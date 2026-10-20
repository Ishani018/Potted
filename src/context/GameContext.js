import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_PLAYER_STATE, ROOM_UNLOCK_COSTS, CATCH_UP, BOUQUET_SIZE,
  POTTED_FLOWERS, HANGING_PLANTS, PETS, ROOM_NAMES,
  seedType, evaluateBouquet,
} from '../constants/gameData';
import { roomPetEffects, globalPetEffects, pestRewardFor, placedPets, dayKey } from '../engine/petEffects';
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

// Slot ids encode room + type: r3_p1 → room 3 potted, r2_h4 → room 2 hanging.
function slotInfoFromId(slotId) {
  const m = /^r(\d+)_([ph])/.exec(slotId);
  if (!m) return null;
  return { room: Number(m[1]), type: m[2] === 'h' ? 'hanging' : 'potted' };
}

const initialState = {
  player: INITIAL_PLAYER_STATE,
  slots: {},
  inventory: [],       // { id, flowerKey } seed bags owned (shared across rooms)
  heldSeed: null,      // { invItemId, flowerKey } picked from inventory, awaiting a pot tap
  initialized: false,
  lastPassiveTick: Date.now(),
  lastSeen: Date.now(),  // last time the game was running (saved) — for catch-up
  awaySummary: null,     // "while you were away" report, shown until dismissed
  notices: [],           // pet messages ({ id, text }) shown one at a time, not saved
};

// Pets' once-a-day gifts (Storm digs up a seed, Aki fetches coins).
// Returns { player, inventory, notices } with the gifts applied.
function givePetGifts(player, inventory, now, rand) {
  const today = dayKey(now);
  const gifts = { ...(player.petGifts ?? {}) };
  let coins = player.coins;
  let inv = inventory;
  const notices = [];
  for (const { key, effect } of placedPets(player)) {
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
    if (daily.seed) {
      if (inv.length >= INVENTORY_CAP) {
        notices.push(`${name} dug up a seed, but your inventory is full.`);
      } else {
        const keys = [...Object.keys(POTTED_FLOWERS), ...Object.keys(HANGING_PLANTS)];
        const flowerKey = keys[Math.floor(rand() * keys.length)];
        const seedName = POTTED_FLOWERS[flowerKey]?.name ?? HANGING_PLANTS[flowerKey]?.name;
        inv = [...inv, { id: `inv_${now}_${key}`, flowerKey }];
        notices.push(`${name} dug up a ${seedName} seed!`);
      }
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
    if (slot.type === 'potted' && slot.stage >= maxStageFor('potted')) r.ready++;
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

    case 'LOAD': {
      return { ...state, ...action.payload, initialized: true };
    }

    // Runs every minute, on load, and when the app comes back to the foreground.
    // A long gap since lastSeen means the game was closed: simulate the pests
    // that arrived meanwhile and prepare the "while you were away" summary.
    case 'TICK': {
      const now = action.now;
      const rand = action.seed != null ? makeRand(action.seed) : null;
      const eff = roomPetEffects(state.player);
      const gap = now - (state.lastSeen ?? state.lastPassiveTick ?? now);
      let updatedSlots = tickAllSlots(state.slots, now, rand, eff);
      const gapMinutes = Math.min(Math.floor(gap / 60000) - 1, CATCH_UP.maxPestMinutes);
      if (rand && gapMinutes > 0) updatedSlots = spawnPestsOffline(updatedSlots, gapMinutes, rand, eff);
      const { coins, nextTick } = calcHangingPassiveCoins(state.slots, state.lastPassiveTick ?? now, now, eff);
      const summary = gap >= CATCH_UP.minAwayMs
        ? buildAwaySummary(state.slots, updatedSlots, gap, coins)
        : null;

      let player = { ...state.player, coins: state.player.coins + coins };
      let inventory = state.inventory;
      const notices = [];
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
      return { ...state, heldSeed: { invItemId, flowerKey } };
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
      // Sunroom shelf spots have no draggable pot, so their slot may not exist yet.
      let slot = state.slots[slotId];
      if (!slot) {
        const info = slotInfoFromId(slotId);
        if (!info) return state;
        slot = createEmptySlot(slotId, info.room, info.type, true);
      }
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
      const max = maxStageFor(slot.type);
      let player = state.player;
      if (watered.stage === max && slot.stage < max) {
        const book = { ...(player.flowerBook ?? {}) };
        const prev = book[slot.flowerKey];
        book[slot.flowerKey] = {
          grown: (prev?.grown ?? 0) + 1,
          firstAt: prev?.firstAt ?? Date.now(),
        };
        player = { ...player, flowerBook: book };
      }
      return { ...state, player, slots: { ...state.slots, [slotId]: watered } };
    }

    // Tap a pest off a plant → it can grow again, and you get a small reward.
    case 'REMOVE_PEST': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot?.pest) return state;
      return {
        ...state,
        slots: { ...state.slots, [slotId]: { ...slot, pest: null } },
        player: {
          ...state.player,
          coins: state.player.coins + pestRewardFor(state.player, slot.room),
          pestsCleared: (state.player.pestsCleared ?? 0) + 1,
        },
      };
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
      return {
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
      };
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
      const { flowers } = action;
      if (!Array.isArray(flowers) || flowers.length !== BOUQUET_SIZE) return state;
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      for (const k of flowers) {
        if (!(harvested[k] > 0)) return state; // don't have enough of this flower
        harvested[k] -= 1;
      }
      for (const k of Object.keys(harvested)) if (harvested[k] <= 0) delete harvested[k];
      const { recipe, value } = evaluateBouquet(flowers, globalPetEffects(state.player).bouquetMult);
      const bouquetBook = { ...(state.player.bouquetBook ?? {}) };
      if (recipe) {
        const prev = bouquetBook[recipe.id];
        bouquetBook[recipe.id] = { made: (prev?.made ?? 0) + 1, firstAt: prev?.firstAt ?? Date.now() };
      }
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + value,
          harvestedFlowers: harvested,
          bouquetBook,
          bouquetsSold: (state.player.bouquetsSold ?? 0) + 1,
        },
      };
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

    case 'BUY_PET': {
      const { petKey, price } = action;
      if (state.player.coins < price) return state;
      if ((state.player.ownedPets ?? []).includes(petKey)) return state;
      // Adopt and auto-place in the current room (user can reassign later).
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedPets: [...(state.player.ownedPets ?? []), petKey],
          petPlacements: { ...(state.player.petPlacements ?? {}), [petKey]: state.player.currentRoom },
        },
      };
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
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + refund,
          ownedPets: state.player.ownedPets.filter((k) => k !== petKey),
          petPlacements: placements,
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
