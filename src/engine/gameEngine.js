import { GROWTH_TIMERS, PEST_CONFIG, growthCooldownMs, pickPestType } from '../constants/gameData';

// ─── Slot factory ─────────────────────────────────────────────────────────────
export function createEmptySlot(slotId, room, type, hasPot = false) {
  return {
    slotId,
    room,
    type,
    flowerKey: null,
    stage: 0,
    plantedAt: null,
    lastWatered: null,
    wilting: false,
    _budWatered: false,
    pest: null, // pest type (see PEST_INFO) while a pest is on the plant
    shieldUntil: null, // ms timestamp: a Scent Sachet keeps pests off until then
    hasPot, // true only when explicitly placed by user via PLACE_POT
  };
}

export function plantSeed(slot, flowerKey) {
  const now = Date.now();
  return {
    ...slot,
    flowerKey,
    stage: 0,
    plantedAt: now,
    lastWatered: null, // null = thirsty now, so a fresh seed can be watered immediately
    wilting: false,
    _budWatered: false,
    pest: null,
    shieldUntil: null,
  };
}

export function maxStageFor(type) {
  return GROWTH_TIMERS.maxStage[type] ?? 3;
}

// A plant is thirsty (ready to be watered to the next stage) when it hasn't been
// watered yet, or the cooldown since the last watering has elapsed — and it isn't
// already fully grown. slot.cooldown is set when watered (flower's own growth
// time, shortened by pets); older saves fall back to the flower's default.
export function isThirsty(slot, now = Date.now()) {
  return msUntilThirsty(slot, now) === 0;
}

// Milliseconds until the plant can be watered again: 0 = thirsty now, null =
// nothing to wait for (empty slot or fully grown).
export function msUntilThirsty(slot, now = Date.now()) {
  if (!slot.flowerKey) return null;
  if (slot.stage >= maxStageFor(slot.type)) return null;
  if (slot.lastWatered == null) return 0;
  const cooldown = slot.cooldown ?? growthCooldownMs(slot.flowerKey);
  return Math.max(0, slot.lastWatered + cooldown - now);
}

// ─── Watering — advances one stage if thirsty ─────────────────────────────────
// eff: the room's pet effects (see petEffects.roomPetEffects), optional.
export function waterPlant(slot, eff) {
  const now = Date.now();
  if (!slot.flowerKey) return slot;
  if (slot.pest) return slot; // pest blocks growth until it's shooed away
  // Watering a wilting plant always revives it (and advances if it was thirsty).
  if (!isThirsty(slot, now) && !slot.wilting) return slot; // not ready yet — no-op

  const max = maxStageFor(slot.type);
  const wasBud = slot.stage === 1; // bud-stage watering grants the harvest bonus
  const nextStage = Math.min(slot.stage + 1, max);

  return {
    ...slot,
    stage: nextStage,
    lastWatered: now,
    cooldown: Math.round(growthCooldownMs(slot.flowerKey) * (eff?.cooldownMult ?? 1)),
    wilting: false,
    _budWatered: slot._budWatered || wasBud,
  };
}

// ─── Growth tick ──────────────────────────────────────────────────────────────
// Stages only change via watering; the tick only updates the "wilting" flag.
// Plants never die. A full bloom never wilts (it's done growing).
export function tickSlot(slot, now, eff) {
  if (!slot.flowerKey) return slot;
  const fullyGrown = slot.stage >= maxStageFor(slot.type);
  if (fullyGrown) {
    return slot.wilting ? { ...slot, wilting: false } : slot;
  }
  const since = now - (slot.lastWatered ?? slot.plantedAt ?? now);
  const shouldWilt = since >= GROWTH_TIMERS.wiltAfter * (eff?.wiltMult ?? 1);
  if (shouldWilt === slot.wilting) return slot;
  return { ...slot, wilting: shouldWilt };
}

// ─── Harvest ──────────────────────────────────────────────────────────────────
// Harvesting a full-bloom plant yields FLOWERS (not coins) — the player trades
// them for coins at the market. Potted flowers give 1 (2 with the bud-watered
// bonus); hanging plants give 1 and stop their passive coin trickle (the pot
// stays on the hook, empty). Returns how many flowers and the cleared slot.
export function harvestPlant(slot) {
  const max = maxStageFor(slot.type);
  if (!slot.flowerKey || slot.stage < max) {
    return { flowerKey: null, amount: 0, slot };
  }
  const amount = slot.type === 'potted' && slot._budWatered ? 2 : 1;
  const cleared = createEmptySlot(slot.slotId, slot.room, slot.type, slot.hasPot);
  return { flowerKey: slot.flowerKey, amount, slot: cleared };
}

// ─── Passive hanging coin trickle ─────────────────────────────────────────────
// Each mature hanging plant pays `amount` per full `interval` since lastTickTime.
// Returns the coins and the new lastTickTime — advanced only by the intervals
// paid out, so partial progress carries over to the next tick.
// effByRoom (optional) weights each plant by its room's hangingCoinMult.
export function calcHangingPassiveCoins(slots, lastTickTime, now, effByRoom) {
  const { amount, interval } = GROWTH_TIMERS.hangingPassiveCoins;
  const intervals = Math.max(0, Math.floor((now - lastTickTime) / interval));
  const weight = Object.values(slots)
    .filter((s) => s.type === 'hanging' && s.flowerKey && s.stage >= maxStageFor('hanging'))
    .reduce((sum, s) => sum + (effByRoom?.[s.room]?.hangingCoinMult ?? 1), 0);
  return { coins: Math.round(intervals * amount * weight), nextTick: lastTickTime + intervals * interval };
}

// ─── Pests ────────────────────────────────────────────────────────────────────
// Growing plants (bud or later, not full bloom) can pick up a pest each tick.
function canGetPest(slot, now = Date.now()) {
  if (slot.shieldUntil && slot.shieldUntil > now) return false; // protected by a sachet
  return !!slot.flowerKey && !slot.pest && slot.stage >= 1 && slot.stage < maxStageFor(slot.type);
}

function maybeSpawnPest(slot, rand, eff, now) {
  const chance = PEST_CONFIG.chancePerTick * (eff?.pestChance ?? 1);
  if (!canGetPest(slot, now) || rand() >= chance) return slot;
  return { ...slot, pest: pickPestType(rand) };
}

// Pests that arrived while the game was closed: each growing plant gets one
// with probability 1 - (1 - p)^minutes.
export function spawnPestsOffline(slots, minutes, rand, effByRoom, now = Date.now()) {
  const updated = {};
  for (const [id, slot] of Object.entries(slots)) {
    const chance = PEST_CONFIG.chancePerTick * (effByRoom?.[slot.room]?.pestChance ?? 1);
    // A sachet covers part of the time away: only count the unprotected minutes.
    const away = now - minutes * 60000;
    const covered = slot.shieldUntil ? Math.max(0, Math.min(minutes, (slot.shieldUntil - away) / 60000)) : 0;
    const p = 1 - Math.pow(1 - chance, Math.max(0, minutes - covered));
    updated[id] = canGetPest({ ...slot, shieldUntil: null }) && rand() < p
      ? { ...slot, pest: pickPestType(rand) }
      : slot;
  }
  return updated;
}

// ─── Tick all slots ───────────────────────────────────────────────────────────
// rand: () => [0,1). Passed in so the reducer stays deterministic per action.
// effByRoom: pet effects per room (optional).
export function tickAllSlots(slots, now, rand, effByRoom) {
  const updated = {};
  for (const [id, slot] of Object.entries(slots)) {
    const eff = effByRoom?.[slot.room];
    const ticked = tickSlot(slot, now, eff);
    updated[id] = rand ? maybeSpawnPest(ticked, rand, eff, now) : ticked;
  }
  return updated;
}

// ─── Achievements check helpers ───────────────────────────────────────────────
export function checkAllSlotsFilled(slots, room, type) {
  return Object.values(slots)
    .filter((s) => s.room === room && s.type === type)
    .every((s) => s.flowerKey !== null);
}
