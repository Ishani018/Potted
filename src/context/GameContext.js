import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_PLAYER_STATE, ROOM_UNLOCK_COSTS, CATCH_UP, BOUQUET_SIZE,
  POTTED_FLOWERS, HANGING_PLANTS, PETS, ROOM_NAMES,
  seedType, evaluateBouquet, bouquetPaper,
  XP_CONFIG, levelInfo, playerLevel, seedUnlockLevel, unlocksAtLevel, TRADE_FLOWERS, CUSTOMERS,
  roomScentShield, HERBALIST, HERBALIST_TRADES, REMEDIES, SACHET_MS, isShielded,
  PET_FOOD, PET_SPECIES, FED_MAX_HOURS, ADVENTURE, orderGrade,
} from '../constants/gameData';
import { maybeArriveStray } from '../engine/strays';
import { rollRewards } from '../engine/adventures';
import { roomPetEffects, globalPetEffects, pestRewardFor, placedPets, dayKey } from '../engine/petEffects';
import { rollCustomerOrders, hashString, bouquetFillsOrder, hasStaleOrders } from '../engine/customers';
import {
  tickAllSlots,
  harvestPlant,
  waterPlant,
  plantSeed,
  createEmptySlot,
  calcHangingPassiveCoins,
  spawnPestsOffline,
  isThirsty,
  maxStageFor,
} from '../engine/gameEngine';
import { getSnapPoints } from '../engine/snapPoints';

const STORAGE_KEY = '@potted_save_v4';
const TICK_INTERVAL_MS = 60_000;

// slot: { slotId, room, type, flowerKey, stage, plantedAt, lastWatered, wilting, _budWatered }

const INVENTORY_CAP = 35; // 7×5 grid

// Small seeded PRNG (mulberry32) so TICK's pest rolls come from the action.
function makeRand(seed) {
  let t = Math.floor(seed * 4294967296) >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const initialState = {
  player: INITIAL_PLAYER_STATE,
  slots: {},
  inventory: [],       // { id, flowerKey } seed bags owned (shared across rooms)
  heldSeed: null,      // { invItemId, flowerKey } picked from inventory, awaiting a pot tap
  initialized: false,
  lastPassiveTick: Date.now(),
  lastSeen: Date.now(),  // last time the game was running (saved) — for catch-up
  lastAdventure: null,   // { petKey, rewards, full } a returned pet's box, shown until closed
  awaySummary: null,     // "while you were away" report, shown until dismissed
  heldRemedy: null,      // 'balm' | 'sachet' picked from the tray, awaiting a plant tap
  notices: [],           // pet messages ({ id, text }) shown one at a time, not saved
};

// Award XP; each level gained pays coins and queues a notice naming what it
// unlocked. Returns the new state.
function grantXp(state, amount) {
  if (!(amount > 0)) return state;
  const oldXp = state.player.xp ?? 0;
  const before = levelInfo(oldXp).level;
  const xp = oldXp + Math.round(amount);
  const after = levelInfo(xp).level;
  let player = { ...state.player, xp };
  const notices = [...state.notices];
  for (let lv = before + 1; lv <= after; lv++) {
    const reward = XP_CONFIG.levelUpCoins * lv;
    player = { ...player, coins: player.coins + reward };
    const unlocks = unlocksAtLevel(lv);
    notices.push({
      id: `level_${lv}_${Date.now()}`,
      icon: '★',
      text: `Level ${lv}! +${reward} coins${unlocks.length ? ` · Unlocked ${unlocks.join(', ')}` : ''}`,
    });
  }
  return { ...state, player, notices };
}

// Mark an order done, give its XP and seed bonus, and queue a thank-you notice.
function completeOrder(state, order, message) {
  const list = state.player.customers.list.map((o) => (o.id === order.id ? { ...o, done: true } : o));
  const inventory = addSeed(state.inventory, order.seed, `c_${order.id}`);
  const met = state.player.customerBook?.[order.customer];
  const gotSeed = order.seed && inventory.length > state.inventory.length;
  const seedName = order.seed ? (POTTED_FLOWERS[order.seed]?.name ?? HANGING_PLANTS[order.seed]?.name) : '';
  const next = {
    ...state,
    inventory,
    player: {
      ...state.player,
      customers: { ...state.player.customers, list },
      customersServed: (state.player.customersServed ?? 0) + 1,
      // the customers page in the garden journal fills in as you serve people
      customerBook: {
        ...(state.player.customerBook ?? {}),
        [order.customer]: { served: (met?.served ?? 0) + 1, firstAt: met?.firstAt ?? Date.now() },
      },
    },
    // no "thanks" message on top of the screen: the customer reacts in person at the counter
    notices: gotSeed ? [...state.notices, { id: `cust_${order.id}_${Date.now()}`, icon: '🌱', text: `A ${seedName} seed from ${CUSTOMERS[order.customer].name}!` }] : state.notices,
  };
  return grantXp(next, order.xp);
}

// Put a seed in the inventory if there's room. Returns the new inventory.
function addSeed(inventory, flowerKey, tag) {
  if (!flowerKey || inventory.length >= INVENTORY_CAP) return inventory;
  return [...inventory, { id: `inv_${Date.now()}_${tag}`, flowerKey }];
}

// Pets' once-a-day gifts (Storm digs up a seed, Aki fetches coins).
// Returns { player, inventory, notices } with the gifts applied.
function givePetGifts(player, inventory, now, rand) {
  const today = dayKey(now);
  const gifts = { ...(player.petGifts ?? {}) };
  let coins = player.coins;
  let inv = inventory;
  const notices = [];
  for (const { key, effect } of placedPets(player, now)) {
    const daily = effect.daily;
    if (!daily || gifts[key] === today) continue;
    gifts[key] = today;
    const name = PETS[key].name;
    if (daily.coins) {
      const [lo, hi] = daily.coins;
      const n = lo + Math.floor(rand() * (hi - lo + 1));
      coins += n;
      notices.push(`${name} fetched ${n} coins for you!`);
    }
    for (let i = 0; i < (daily.seed === true ? 1 : daily.seed ?? 0); i++) {
      if (inv.length >= INVENTORY_CAP) {
        notices.push(`${name} dug up a seed, but your inventory is full.`);
        break;
      }
      const keys = [...Object.keys(POTTED_FLOWERS).filter((k) => !POTTED_FLOWERS[k].rare), ...Object.keys(HANGING_PLANTS)];
      const flowerKey = keys[Math.floor(rand() * keys.length)];
      const seedName = POTTED_FLOWERS[flowerKey]?.name ?? HANGING_PLANTS[flowerKey]?.name;
      inv = [...inv, { id: `inv_${now}_${key}_${i}`, flowerKey }];
      notices.push(`${name} dug up a ${seedName} seed!`);
    }
  }
  return { player: { ...player, coins, petGifts: gifts }, inventory: inv, notices };
}

// What changed / needs attention after time away, per room. null = nothing to say.
function buildAwaySummary(before, after, awayMs, coins) {
  const rooms = {};
  let total = 0;
  for (const slot of Object.values(after)) {
    if (!slot.flowerKey) continue;
    const r = (rooms[slot.room] ??= { ready: 0, thirsty: 0, wilting: 0, pests: 0 });
    if (slot.stage >= maxStageFor(slot.type, slot.flowerKey)) r.ready++;
    else if (slot.pest) r.pests++;
    else if (slot.wilting) r.wilting++;
    else if (isThirsty(slot)) r.thirsty++;
  }
  for (const r of Object.values(rooms)) total += r.ready + r.thirsty + r.wilting + r.pests;
  const newPests = Object.values(after).filter((s) => s.pest && !before[s.slotId]?.pest).length;
  if (total === 0 && coins === 0) return null;
  return { awayMs, rooms, newPests, coins };
}

function reducer(state, action) {
  switch (action.type) {

    // Settings → START OVER: back to a brand-new game (the saved copy is overwritten
    // by the next autosave).
    case 'RESET_GAME': {
      const now = Date.now();
      return { ...initialState, initialized: true, lastSeen: now, lastPassiveTick: now, notices: [] };
    }

    case 'LOAD': {
      return { ...state, ...action.payload, initialized: true };
    }

    // Runs every minute, on load, and when the app comes back to the foreground.
    // A long gap since lastSeen means the game was closed: simulate the pests
    // that arrived meanwhile and prepare the "while you were away" summary.
    case 'TICK': {
      const now = action.now;
      const rand = action.seed != null ? makeRand(action.seed) : null;
      const eff = roomPetEffects(state.player, now);
      // Full-bloom marigolds / jasmine make pests less likely anywhere in their room.
      const shield = roomScentShield(state.slots);
      for (const room of Object.keys(shield)) {
        eff[room] = { ...eff[room], pestChance: eff[room].pestChance * shield[room] };
      }
      const gap = now - (state.lastSeen ?? state.lastPassiveTick ?? now);
      let updatedSlots = tickAllSlots(state.slots, now, rand, eff);
      const gapMinutes = Math.min(Math.floor(gap / 60000) - 1, CATCH_UP.maxPestMinutes);
      if (rand && gapMinutes > 0) updatedSlots = spawnPestsOffline(updatedSlots, gapMinutes, rand, eff, now);
      const { coins, nextTick } = calcHangingPassiveCoins(state.slots, state.lastPassiveTick ?? now, now, eff);
      const summary = gap >= CATCH_UP.minAwayMs
        ? buildAwaySummary(state.slots, updatedSlots, gap, coins)
        : null;

      let player = { ...state.player, coins: state.player.coins + coins };
      let inventory = state.inventory;
      const notices = [];
      // A new day brings a new set of florist customers.
      const today = dayKey(now);
      if (player.customers?.day !== today || hasStaleOrders(player.customers)) {
        player = {
          ...player,
          customers: { day: today, list: rollCustomerOrders(today, playerLevel(player), makeRand(hashString(today))) },
        };
      }
      if (rand) {
        // Bug-catching pets (Tiger) sometimes clear a bug in their room.
        for (const [id, slot] of Object.entries(updatedSlots)) {
          if (!slot.pest || !(eff[slot.room]?.autoCatch > 0) || rand() >= eff[slot.room].autoCatch) continue;
          updatedSlots[id] = { ...slot, pest: null };
          const reward = pestRewardFor(player, slot.room);
          player = { ...player, coins: player.coins + reward, pestsCleared: (player.pestsCleared ?? 0) + 1 };
          const catcher = placedPets(player).find((p) => p.room === slot.room && p.effect.room?.autoCatch);
          notices.push(`${PETS[catcher?.key]?.name ?? 'Your pet'} caught a bug in the ${ROOM_NAMES[slot.room]}! +${reward}`);
        }
        const arrived = maybeArriveStray(player, now, rand);
        if (arrived) { player = arrived.player; notices.push(arrived.notice); }
        const gifts = givePetGifts(player, inventory, now, rand);
        player = gifts.player;
        inventory = gifts.inventory;
        notices.push(...gifts.notices);
      }
      return {
        ...state,
        slots: updatedSlots,
        inventory,
        lastPassiveTick: nextTick,
        lastSeen: now,
        awaySummary: summary ?? state.awaySummary,
        player,
        notices: [...state.notices, ...notices.map((text, i) => ({ id: `${now}_${i}`, text }))],
      };
    }

    case 'DISMISS_SUMMARY': {
      return { ...state, awaySummary: null };
    }

    case 'SHIFT_NOTICE': {
      return { ...state, notices: state.notices.slice(1) };
    }

    case 'INIT_SLOTS': {
      const { screenWidth, screenHeight } = action;
      const slots = { ...state.slots };
      for (const room of [1, 2, 3]) {
        // Only auto-create hanging slots; potted pots are placed by dragging
        for (const type of ['hanging']) {
          const pts = getSnapPoints(room, type, screenWidth, screenHeight);
          for (const pt of pts) {
            if (!slots[pt.id]) {
              slots[pt.id] = createEmptySlot(pt.id, room, type);
            }
          }
        }
      }
      return { ...state, slots };
    }

    // Buy a seed in the nursery → charge coins, add a bag to the shared inventory.
    // action: { flowerKey, price }
    case 'BUY_SEED': {
      const { flowerKey, price = 0 } = action;
      if (playerLevel(state.player) < seedUnlockLevel(flowerKey)) return state; // not unlocked yet
      if (state.player.coins < price) return state;          // can't afford
      if (state.inventory.length >= INVENTORY_CAP) return state; // inventory full
      const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return {
        ...state,
        player: { ...state.player, coins: state.player.coins - price },
        inventory: [...state.inventory, { id, flowerKey }],
      };
    }

    // Pick a seed from the inventory to plant next (held until a pot is tapped).
    case 'HOLD_SEED': {
      const { invItemId, flowerKey } = action;
      return { ...state, heldSeed: { invItemId, flowerKey }, heldRemedy: null };
    }

    case 'CLEAR_HELD': {
      return { ...state, heldSeed: null };
    }

    // Tap an empty pot while holding a seed → plant it, consume from inventory.
    // The seed must match the pot: shelf flowers → potted, hanging plants → hanging.
    case 'PLANT_HELD': {
      const { slotId } = action;
      const held = state.heldSeed;
      if (!held) return state;
      const slot = state.slots[slotId];
      if (!slot || !slot.hasPot) return state; // a pot has to be placed first
      if (slot.flowerKey) return state;
      if (seedType(held.flowerKey) !== slot.type) return state; // wrong pot type
      return {
        ...state,
        slots: { ...state.slots, [slotId]: plantSeed(slot, held.flowerKey) },
        inventory: state.inventory.filter((i) => i.id !== held.invItemId),
        heldSeed: null,
      };
    }

    case 'PLACE_POT': {
      const { slotId, room } = action;
      // Reject if pot already placed (hasPot:true) or if slot has a plant
      if (state.slots[slotId]?.hasPot) return state;
      const type = slotId.includes('_h') ? 'hanging' : 'potted';
      return {
        ...state,
        slots: { ...state.slots, [slotId]: createEmptySlot(slotId, room, type, true) },
      };
    }

    case 'WATER_PLANT': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot || !slot.flowerKey) return state;
      const watered = waterPlant(slot, roomPetEffects(state.player)[slot.room]);
      // First time reaching full bloom fills that flower's page in the book.
      const max = maxStageFor(slot.type, slot.flowerKey);
      let player = state.player;
      const firstBloom = watered.stage === max && slot.stage < max && !player.flowerBook?.[slot.flowerKey];
      if (watered.stage === max && slot.stage < max) {
        const book = { ...(player.flowerBook ?? {}) };
        const prev = book[slot.flowerKey];
        book[slot.flowerKey] = {
          grown: (prev?.grown ?? 0) + 1,
          firstAt: prev?.firstAt ?? Date.now(),
        };
        player = { ...player, flowerBook: book };
      }
      let next = { ...state, player, slots: { ...state.slots, [slotId]: watered } };
      if (watered.stage > slot.stage) {
        // Growing a stage earns XP; the first full bloom of a flower earns extra.
        next = grantXp(next, XP_CONFIG.water + (firstBloom ? XP_CONFIG.firstBloom : 0));
      }
      return next;
    }

    // Tap a pest off a plant → it can grow again, and you get a small reward.
    case 'REMOVE_PEST': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot?.pest) return state;
      return grantXp({
        ...state,
        slots: { ...state.slots, [slotId]: { ...slot, pest: null } },
        player: {
          ...state.player,
          coins: state.player.coins + pestRewardFor(state.player, slot.room),
          pestsCleared: (state.player.pestsCleared ?? 0) + 1,
        },
      }, XP_CONFIG.pest);
    }

    case 'HARVEST_PLANT': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot) return state;
      const { flowerKey, amount: baseAmount, slot: clearedSlot } = harvestPlant(slot);
      if (!flowerKey || baseAmount <= 0) return state; // not harvestable
      // Lucky pets (Milk): chance of one extra flower. Roll seeded by the plant
      // so the same harvest always gives the same result.
      const luck = roomPetEffects(state.player)[slot.room]?.harvestLuck ?? 0;
      const lucky = luck > 0 && makeRand(((slot.plantedAt ?? 0) % 1e6) / 1e6)() < luck;
      const amount = baseAmount + (lucky ? 1 : 0);
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      harvested[flowerKey] = (harvested[flowerKey] ?? 0) + amount;
      const luckyPet = lucky && placedPets(state.player).find((p) => p.room === slot.room && p.effect.room?.harvestLuck);
      return grantXp({
        ...state,
        notices: lucky
          ? [...state.notices, { id: `harvest_${Date.now()}`, text: `${PETS[luckyPet?.key]?.name ?? 'Your pet'} found an extra flower!` }]
          : state.notices,
        slots: { ...state.slots, [slotId]: { ...clearedSlot, hasPot: slot.hasPot } },
        player: {
          ...state.player,
          harvestedFlowers: harvested,
          harvestCount: (state.player.harvestCount ?? 0) + 1,
        },
      }, TRADE_FLOWERS[flowerKey]?.base ?? 10); // XP = the flower's base value
    }

    // Trade harvested flowers for coins at the market.
    // action: { flowerKey, qty, unitPrice }
    case 'TRADE_FLOWERS': {
      const { flowerKey, qty, unitPrice } = action;
      const have = state.player.harvestedFlowers?.[flowerKey] ?? 0;
      const n = Math.min(qty, have);
      if (n <= 0) return state;
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      harvested[flowerKey] = have - n;
      if (harvested[flowerKey] <= 0) delete harvested[flowerKey];
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + n * unitPrice,
          harvestedFlowers: harvested,
        },
      };
    }

    // Tie BOUQUET_SIZE harvested flowers into a bouquet and sell it at once.
    // action: { flowers: [flowerKey, ...] }
    case 'SELL_BOUQUET': {
      const { flowers, paper = 'plain', ribbon = null, customerId = null, neat = false } = action;
      if (!Array.isArray(flowers) || flowers.length !== BOUQUET_SIZE) return state;
      // Delivering to a customer: the order must be open and the bouquet must fit it.
      const order = customerId ? state.player.customers?.list?.find((o) => o.id === customerId) : null;
      if (customerId && (!order || order.done)) return state;
      // you may hand over the wrong bouquet: the customer pays less and leaves angry
      const flowersOk = !order || bouquetFillsOrder(order, flowers);
      if (state.player.coins < bouquetPaper(paper).cost) return state; // can't afford the paper
      if (playerLevel(state.player) < bouquetPaper(paper).level) return state; // paper not unlocked yet
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      for (const k of flowers) {
        if (!(harvested[k] > 0)) return state; // don't have enough of this flower
        harvested[k] -= 1;
      }
      for (const k of Object.keys(harvested)) if (harvested[k] <= 0) delete harvested[k];
      const { recipe, net } = evaluateBouquet(flowers, globalPetEffects(state.player).bouquetMult, paper);
      const bouquetBook = { ...(state.player.bouquetBook ?? {}) };
      if (recipe) {
        const prev = bouquetBook[recipe.id];
        bouquetBook[recipe.id] = { made: (prev?.made ?? 0) + 1, firstAt: prev?.firstAt ?? Date.now() };
      }
      const newRecipe = recipe && !state.player.bouquetBook?.[recipe.id];
      // a neatly folded and tied bouquet sells for 10% more
      const neatBonus = neat && net > 0 ? Math.round(net * 0.1) : 0;
      // a customer pays the price plus a tip; the tip depends on how well paper and ribbon match the order
      const tip = order ? Math.round(order.tip * (flowersOk ? orderGrade(order, paper, ribbon).mult : 0.4)) : 0;
      let delivered = {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + net + neatBonus + tip, // sale minus the paper used, plus neat bonus and any tip
          harvestedFlowers: harvested,
          bouquetBook,
          bouquetsSold: (state.player.bouquetsSold ?? 0) + 1,
        },
      };
      if (order) {
        const upset = !flowersOk || orderGrade(order, paper, ribbon).mult < 1;   // got neither the paper nor the ribbon they asked for
        delivered = completeOrder(delivered, order, upset ? `${CUSTOMERS[order.customer].name} wasn't happy with the bouquet. +${tip} tip` : `${CUSTOMERS[order.customer].name} loved the bouquet! +${tip} tip`);
        if (upset) delivered = { ...delivered, player: { ...delivered.player, customers: { ...delivered.player.customers, list: delivered.player.customers.list.map((o) => (o.id === order.id ? { ...o, upset: true } : o)) } } };
      }
      return grantXp(delivered, Math.max(0, net) / XP_CONFIG.bouquetDivisor + (newRecipe ? XP_CONFIG.newRecipe : 0));
    }

    // ── Herbalist ─────────────────────────────────────────────────────────────
    // One free Bug Balm per day.
    case 'CLAIM_DAILY_REMEDY': {
      const today = dayKey(Date.now());
      if (state.player.herbalistDay === today) return state;
      const rem = { ...(state.player.remedies ?? {}) };
      rem.balm = (rem.balm ?? 0) + 1;
      return {
        ...state,
        player: { ...state.player, remedies: rem, herbalistDay: today },
        notices: [...state.notices, { id: `rem_daily_${Date.now()}`, icon: '🌿', text: `${HERBALIST.name} gave you a ${REMEDIES.balm.name}!` }],
      };
    }

    // Swap harvested flowers for a remedy. action: { id } (see HERBALIST_TRADES)
    case 'TRADE_REMEDY': {
      const trade = HERBALIST_TRADES.find((t) => t.id === action.id);
      if (!trade) return state;
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      for (const [k, n] of Object.entries(trade.give)) {
        if ((harvested[k] ?? 0) < n) return state;       // not enough of this flower
      }
      for (const [k, n] of Object.entries(trade.give)) {
        harvested[k] -= n;
        if (harvested[k] <= 0) delete harvested[k];
      }
      const rem = { ...(state.player.remedies ?? {}) };
      rem[trade.get] = (rem[trade.get] ?? 0) + trade.qty;
      return {
        ...state,
        player: { ...state.player, harvestedFlowers: harvested, remedies: rem },
        notices: [...state.notices, { id: `rem_trade_${Date.now()}`, icon: '🌿', text: `${HERBALIST.thanks} +${trade.qty} ${REMEDIES[trade.get].name}` }],
      };
    }

    // Pick a remedy from the tray (tap again to put it back).
    case 'HOLD_REMEDY': {
      const { kind } = action;
      if (!REMEDIES[kind] || (state.player.remedies?.[kind] ?? 0) <= 0) return state;
      return { ...state, heldRemedy: state.heldRemedy === kind ? null : kind, heldSeed: null };
    }

    case 'CLEAR_REMEDY': {
      return { ...state, heldRemedy: null };
    }

    // Use the held remedy on a plant. Balm: clears its bug. Sachet: pests stay
    // off it for SACHET_MS. Invalid targets change nothing (the room shows a hint).
    case 'USE_REMEDY': {
      const kind = state.heldRemedy;
      const slot = state.slots[action.slotId];
      if (!kind || !slot?.flowerKey) return state;
      const left = state.player.remedies?.[kind] ?? 0;
      if (left <= 0) return { ...state, heldRemedy: null };
      let used;
      if (kind === 'balm') {
        if (!slot.pest) return state;
        used = { ...slot, pest: null };
      } else {
        if (slot.stage >= maxStageFor(slot.type, slot.flowerKey) || isShielded(slot)) return state;
        used = { ...slot, shieldUntil: Date.now() + SACHET_MS };
      }
      const rem = { ...state.player.remedies, [kind]: left - 1 };
      return {
        ...state,
        slots: { ...state.slots, [action.slotId]: used },
        player: { ...state.player, remedies: rem },
        heldRemedy: left - 1 > 0 ? kind : null,    // stay armed while you have more
      };
    }

    // Hand a customer the flowers they asked for.
    case 'FULFILL_CUSTOMER': {
      const order = state.player.customers?.list?.find((o) => o.id === action.id);
      if (!order || order.done || order.type !== 'flowers') return state;
      const have = state.player.harvestedFlowers?.[order.flowerKey] ?? 0;
      if (have < order.qty) return state;
      const harvested = { ...state.player.harvestedFlowers };
      harvested[order.flowerKey] = have - order.qty;
      if (harvested[order.flowerKey] <= 0) delete harvested[order.flowerKey];
      const paid = {
        ...state,
        player: { ...state.player, coins: state.player.coins + order.coins, harvestedFlowers: harvested },
      };
      return completeOrder(paid, order, `${CUSTOMERS[order.customer].name} paid ${order.coins} coins`);
    }

    // Flowers handed over in the box on the counter. action: { id, given: [flowerKey, ...] }.
    // Right flowers pay in full; the wrong ones pay a little and the customer storms off.
    case 'DELIVER_FLOWERS': {
      const order = state.player.customers?.list?.find((o) => o.id === action.id);
      const given = action.given ?? [];
      if (!order || order.done || order.type !== 'flowers' || given.length !== order.qty) return state;
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      for (const k of given) {
        if (!(harvested[k] > 0)) return state;
        harvested[k] -= 1;
      }
      for (const k of Object.keys(harvested)) if (harvested[k] <= 0) delete harvested[k];
      const right = given.every((k) => k === order.flowerKey);
      const coins = right ? order.coins : Math.round(order.coins * 0.4);
      let paid = { ...state, player: { ...state.player, coins: state.player.coins + coins, harvestedFlowers: harvested } };
      paid = completeOrder(paid, order, right ? `${CUSTOMERS[order.customer].name} paid ${coins} coins` : `${CUSTOMERS[order.customer].name} wasn't happy with the flowers. ${coins} coins`);
      if (!right) paid = { ...paid, player: { ...paid.player, customers: { ...paid.player.customers, list: paid.player.customers.list.map((o) => (o.id === order.id ? { ...o, upset: true } : o)) } } };
      return paid;
    }

    case 'REMOVE_PLANT': {
      const { slotId, deletePot } = action;
      const slot = state.slots[slotId];
      if (!slot) return state;
      // deletePot (room 2) or potted: remove the pot too. For hanging slots that
      // are auto-created by INIT_SLOTS, reset to hasPot:false instead of deleting
      // so the empty rod hook (drag target) reappears.
      if (slot.type === 'potted') {
        const { [slotId]: _, ...rest } = state.slots;
        return { ...state, slots: rest };
      }
      if (deletePot) {
        return {
          ...state,
          slots: { ...state.slots, [slotId]: createEmptySlot(slotId, slot.room, slot.type, false) },
        };
      }
      // Hanging default: clear the plant but preserve hasPot so the empty pot stays
      return {
        ...state,
        slots: { ...state.slots, [slotId]: createEmptySlot(slotId, slot.room, slot.type, true) },
      };
    }

    case 'BUY_PAINTING': {
      const { paintingKey, price } = action;
      if (state.player.coins < price) return state;
      if ((state.player.ownedPaintings ?? []).includes(paintingKey)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedPaintings: [...(state.player.ownedPaintings ?? []), paintingKey],
        },
      };
    }

    case 'BUY_APARTMENT': {
      const { aptId, price } = action;
      if (state.player.coins < price) return state;
      if ((state.player.ownedApartments ?? []).includes(aptId)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedApartments: [...(state.player.ownedApartments ?? []), aptId],
        },
      };
    }

    case 'BUY_PET': {
      const { petKey, price } = action;
      if (state.player.coins < price) return state;
      if ((state.player.ownedPets ?? []).includes(petKey)) return state;
      // Adopt and auto-place in the current room (user can reassign later).
      const next = {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedPets: [...(state.player.ownedPets ?? []), petKey],
          petPlacements: { ...(state.player.petPlacements ?? {}), [petKey]: 'all' },
          // a stray leaves the Foster Center (its finder is remembered for the book)
          strays: (state.player.strays ?? []).filter((s) => s.key !== petKey),
          petFound: { ...(state.player.petFound ?? {}), ...(state.player.strays ?? []).filter((s) => s.key === petKey).reduce((o, s) => ({ ...o, [petKey]: s.finder }), {}) },
        },
      };
      return next;
    }

    // Send a pet out for ADVENTURE.hours. It must be owned and home. Whether it was
    // fed when it left is remembered, because that decides how much it brings back.
    case 'SEND_ADVENTURE': {
      const { petKey } = action;
      const now = action.now ?? Date.now();
      if (!(state.player.ownedPets ?? []).includes(petKey)) return state;
      if (state.player.adventures?.[petKey]) return state;
      const fed = (state.player.petCare?.[petKey] ?? 0) > now;
      return {
        ...state,
        player: {
          ...state.player,
          adventures: { ...(state.player.adventures ?? {}), [petKey]: { startedAt: now, endsAt: now + ADVENTURE.hours * 3600000, fed } },
        },
      };
    }

    // Open the box a returned pet brought. action: { petKey, now, seed }
    case 'COLLECT_ADVENTURE': {
      const { petKey } = action;
      const now = action.now ?? Date.now();
      const adv = state.player.adventures?.[petKey];
      if (!adv || now < adv.endsAt) return state;
      const rewards = rollRewards(adv.fed, makeRand(action.seed ?? Math.random()));
      let coins = state.player.coins, inv = state.inventory;
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      const lost = [];
      rewards.forEach((r, i) => {
        if (r.type === 'coins') coins += r.amount;
        else if (r.type === 'flower') harvested[r.flowerKey] = (harvested[r.flowerKey] ?? 0) + r.amount;
        else if (inv.length < INVENTORY_CAP) inv = [...inv, { id: `inv_${now}_adv${i}`, flowerKey: r.flowerKey }];
        else lost.push(r);
      });
      const adventures = { ...state.player.adventures }; delete adventures[petKey];
      return {
        ...state, inventory: inv,
        lastAdventure: { petKey, rewards: rewards.filter((r) => !lost.includes(r)), full: lost.length > 0 },
        player: { ...state.player, coins, harvestedFlowers: harvested, adventures, adventureCount: (state.player.adventureCount ?? 0) + 1 },
      };
    }

    case 'CLOSE_ADVENTURE': {
      return { ...state, lastAdventure: null };
    }

    // Buy something from the pet food aisle and give it to a pet. 'one' items go to
    // action.petKey; 'species' items (litter, pads) to every owned pet of that kind.
    // Fed time stacks on top of what's left, up to FED_MAX_HOURS.
    case 'FEED_PET': {
      const item = PET_FOOD.find((f) => f.key === action.itemKey);
      if (!item || state.player.coins < item.price) return state;
      const now = action.now ?? Date.now();
      const owned = state.player.ownedPets ?? [];
      const fits = (k) => PETS[k] && (item.for === 'any' || PET_SPECIES[k] === item.for);
      const targets = item.scope === 'species'
        ? owned.filter(fits)
        : owned.filter((k) => k === action.petKey && fits(k));
      if (targets.length === 0) return state;
      const care = { ...(state.player.petCare ?? {}) };
      for (const k of targets) {
        const from = Math.max(now, care[k] ?? 0);
        care[k] = Math.min(from + item.hours * 3600000, now + FED_MAX_HOURS * 3600000);
      }
      return { ...state, player: { ...state.player, coins: state.player.coins - item.price, petCare: care } };
    }

    // Give an owned pet a custom name (empty = back to its default name).
    case 'NAME_PET': {
      const { petKey, name } = action;
      if (!(state.player.ownedPets ?? []).includes(petKey)) return state;
      const names = { ...(state.player.petNames ?? {}) };
      const clean = (name ?? '').trim().slice(0, 12).trim();
      if (clean) names[petKey] = clean; else delete names[petKey];
      return { ...state, player: { ...state.player, petNames: names } };
    }

    // Assign an owned pet to a room (room = number, or null to hide it).
    case 'PLACE_PET': {
      const { petKey, room } = action;
      if (!(state.player.ownedPets ?? []).includes(petKey)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          petPlacements: { ...(state.player.petPlacements ?? {}), [petKey]: room },
        },
      };
    }

    // Put a pet up for adoption: remove it from the collection + refund coins.
    case 'GIVE_UP_PET': {
      const { petKey, refund = 0 } = action;
      if (!(state.player.ownedPets ?? []).includes(petKey)) return state;
      const placements = { ...(state.player.petPlacements ?? {}) };
      delete placements[petKey];
      const petNames = { ...(state.player.petNames ?? {}) };
      delete petNames[petKey];
      const petCare = { ...(state.player.petCare ?? {}) };
      delete petCare[petKey];
      const adventures = { ...(state.player.adventures ?? {}) };
      delete adventures[petKey];
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + refund,
          ownedPets: state.player.ownedPets.filter((k) => k !== petKey),
          petPlacements: placements,
          petNames,
          petCare,
          adventures,
        },
      };
    }

    case 'PLACE_DECOR': {
      const { room, slot: decorSlot, value } = action;
      const placedDecor = { ...state.player.placedDecor };
      placedDecor[`room${room}`] = { ...(placedDecor[`room${room}`] ?? {}), [decorSlot]: value };
      return { ...state, player: { ...state.player, placedDecor } };
    }

    case 'SET_ROOM': {
      return { ...state, player: { ...state.player, currentRoom: action.room } };
    }

    case 'SET_WALL_COLOR': {
      const { room, color } = action;
      return {
        ...state,
        player: {
          ...state.player,
          wallColor: { ...state.player.wallColor, [`room${room}`]: color },
        },
      };
    }

    case 'UNLOCK_ROOM': {
      const { room } = action;
      const cost = ROOM_UNLOCK_COSTS[room];
      if (state.player.coins < cost) return state;
      if (state.player.unlockedRooms.includes(room)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - cost,
          unlockedRooms: [...state.player.unlockedRooms, room],
        },
      };
    }

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // Migrate old sill/floor storage into the shared inventory (one-time).
          const legacyBags = [...(saved.windowSill ?? []), ...(saved.windowSill2 ?? [])];
          if (legacyBags.length && !saved.inventory) {
            saved.inventory = legacyBags.map((b) => ({
              id: b.id ?? `inv_${Math.random().toString(36).slice(2)}`,
              flowerKey: b.flowerKey,
            }));
          }
          delete saved.windowSill;
          delete saved.windowSill2;
          // Migrate old potted slots: only mark hasPot:true if they have/had a plant
          if (saved.slots) {
            Object.values(saved.slots).forEach((s) => {
              if (s.type === 'potted' && s.hasPot === undefined) {
                s.hasPot = !!(s.flowerKey || s.plantedAt);
              }
              // Empty hanging slots must not claim a pot — the pot is drag-placed.
              // Fixes stale dev saves where hanging slots got hasPot:true with no plant.
              if (s.type === 'hanging' && s.hasPot && !s.flowerKey && !s.plantedAt) {
                s.hasPot = false;
              }
            });
          }
          // Migrate legacy pet keys: old saves split the duo as separate
          // `ebony`/`ivory` pets (and could list duplicates), which rendered the
          // pair twice in the balcony. Fold them into `ebonyandivory` and dedupe.
          if (saved.player?.ownedPets) {
            const seen = new Set();
            saved.player.ownedPets = saved.player.ownedPets
              .map((k) => (k === 'ebony' || k === 'ivory' ? 'ebonyandivory' : k))
              .filter((k) => (seen.has(k) ? false : (seen.add(k), true)));
          }
          if (saved.player?.petPlacements) {
            delete saved.player.petPlacements.ebony;
            delete saved.player.petPlacements.ivory;
          }
          // TEMP TESTING: force coins on every load so we don't have to clear
          // storage. REMOVE this line when done testing.
          saved.player = { ...saved.player, coins: 50000 };
          // Saves from before catch-up existed: lastPassiveTick was the last tick time.
          saved.lastSeen = saved.lastSeen ?? saved.lastPassiveTick ?? Date.now();
          dispatch({ type: 'LOAD', payload: { ...initialState, ...saved, initialized: true } });
          // Catch up on the time the game was closed (pests, coins, summary).
          dispatch({ type: 'TICK', now: Date.now(), seed: Math.random() });
        } else {
          dispatch({ type: 'LOAD', payload: { ...initialState, initialized: true } });
        }
      } catch {
        dispatch({ type: 'LOAD', payload: { ...initialState, initialized: true } });
      }
    })();
  }, []);

  const saveState = async (s) => {
    try {
      const toSave = {
        player: s.player, slots: s.slots, inventory: s.inventory,
        lastPassiveTick: s.lastPassiveTick, lastSeen: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  };

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now(), seed: Math.random() });
      saveState(stateRef.current);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Back in the foreground → tick now (catches up if timers were paused), and
  // save when leaving so lastSeen marks when the player went away.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') dispatch({ type: 'TICK', now: Date.now(), seed: Math.random() });
      else saveState(stateRef.current);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (state.initialized) saveState(state);
  }, [state.player, state.slots, state.inventory]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
