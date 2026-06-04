import { GROWTH_TIMERS } from '../constants/gameData';

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
  };
}

function maxStageFor(type) {
  return GROWTH_TIMERS.maxStage[type] ?? 3;
}

// A plant is thirsty (ready to be watered to the next stage) when it hasn't been
// watered yet, or the cooldown since the last watering has elapsed — and it isn't
// already fully grown.
export function isThirsty(slot, now = Date.now()) {
  if (!slot.flowerKey) return false;
  if (slot.stage >= maxStageFor(slot.type)) return false;
  if (slot.lastWatered == null) return true;
  return now - slot.lastWatered >= GROWTH_TIMERS.waterCooldown;
}

// ─── Watering — advances one stage if thirsty ─────────────────────────────────
export function waterPlant(slot) {
  const now = Date.now();
  if (!slot.flowerKey) return slot;
  // Watering a wilting plant always revives it (and advances if it was thirsty).
  if (!isThirsty(slot, now) && !slot.wilting) return slot; // not ready yet — no-op

  const max = maxStageFor(slot.type);
  const wasBud = slot.stage === 1; // bud-stage watering grants the harvest bonus
  const nextStage = Math.min(slot.stage + 1, max);

  return {
    ...slot,
    stage: nextStage,
    lastWatered: now,
    wilting: false,
    _budWatered: slot._budWatered || wasBud,
  };
}

// ─── Growth tick ──────────────────────────────────────────────────────────────
// Stages only change via watering; the tick only updates the "wilting" flag.
// Plants never die. A full bloom never wilts (it's done growing).
export function tickSlot(slot, now) {
  if (!slot.flowerKey) return slot;
  const fullyGrown = slot.stage >= maxStageFor(slot.type);
  if (fullyGrown) {
    return slot.wilting ? { ...slot, wilting: false } : slot;
  }
  const since = now - (slot.lastWatered ?? slot.plantedAt ?? now);
  const shouldWilt = since >= GROWTH_TIMERS.wiltAfter;
  if (shouldWilt === slot.wilting) return slot;
  return { ...slot, wilting: shouldWilt };
}

// ─── Harvest ──────────────────────────────────────────────────────────────────
// Harvesting a full-bloom potted flower yields FLOWERS (not coins) — the player
// trades them for coins at the market. Returns how many flowers were collected
// (1, or 2 with the bud-watered bonus) and the cleared slot.
export function harvestPlant(slot) {
  const max = maxStageFor(slot.type);
  if (!slot.flowerKey || slot.stage < max || slot.type !== 'potted') {
    return { flowerKey: null, amount: 0, slot };
  }
  const amount = slot._budWatered ? 2 : 1; // bud-stage watering = double yield
  const cleared = createEmptySlot(slot.slotId, slot.room, slot.type, slot.hasPot);
  return { flowerKey: slot.flowerKey, amount, slot: cleared };
}

// ─── Passive hanging coin trickle ─────────────────────────────────────────────
export function calcHangingPassiveCoins(slots, lastTickTime, now) {
  const { amount, interval } = GROWTH_TIMERS.hangingPassiveCoins;
  let total = 0;
  for (const slot of Object.values(slots)) {
    if (slot.type !== 'hanging' || !slot.flowerKey) continue;
    if (slot.stage < maxStageFor('hanging')) continue; // only mature hanging plants
    const elapsed = now - lastTickTime;
    total += Math.floor(elapsed / interval) * amount;
  }
  return total;
}

// ─── Tick all slots ───────────────────────────────────────────────────────────
export function tickAllSlots(slots, now) {
  const updated = {};
  for (const [id, slot] of Object.entries(slots)) {
    updated[id] = tickSlot(slot, now);
  }
  return updated;
}

// ─── Achievements check helpers ───────────────────────────────────────────────
export function checkAllSlotsFilled(slots, room, type) {
  return Object.values(slots)
    .filter((s) => s.room === room && s.type === type)
    .every((s) => s.flowerKey !== null);
}
