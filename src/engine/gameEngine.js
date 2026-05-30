import { GROWTH_TIMERS, POTTED_FLOWERS, BONUS_COIN_MULTIPLIER } from '../constants/gameData';

// ─── Slot factory ─────────────────────────────────────────────────────────────
export function createEmptySlot(slotId, room, type) {
  return {
    slotId,
    room,
    type,
    flowerKey: null,
    stage: 0,
    plantedAt: null,
    lastWatered: null,
    isDead: false,
    _budWatered: false,
  };
}

export function plantSeed(slot, flowerKey) {
  const now = Date.now();
  return {
    ...slot,
    flowerKey,
    stage: 0,
    plantedAt: now,
    lastWatered: now,
    isDead: false,
    _budWatered: false,
  };
}

export function waterPlant(slot) {
  const now = Date.now();
  const wasBud = slot.type === 'potted' && slot.stage === 1;
  // Watering a seed (stage 0) advances it to bud (stage 1) immediately
  const advanceSeed = slot.type === 'potted' && slot.stage === 0;
  return {
    ...slot,
    stage: advanceSeed ? 1 : slot.stage,
    // Backdate plantedAt so tick agrees elapsed >= seedToBud
    plantedAt: advanceSeed ? now - GROWTH_TIMERS.potted.seedToBud : slot.plantedAt,
    lastWatered: now,
    isDead: false,
    _budWatered: slot._budWatered || wasBud,
  };
}

// ─── Growth tick ──────────────────────────────────────────────────────────────
// Returns updated slot. Pass current timestamp.
export function tickSlot(slot, now) {
  if (!slot.flowerKey || slot.isDead) return slot;

  const elapsed = now - slot.plantedAt;
  const timeSinceWatered = now - (slot.lastWatered ?? slot.plantedAt);

  // Death by dehydration
  if (timeSinceWatered >= GROWTH_TIMERS.deathIfNotWatered && slot.stage < 4) {
    return { ...slot, isDead: true, stage: slot.type === 'potted' ? 4 : 3 };
  }

  if (slot.type === 'potted') {
    return tickPotted(slot, elapsed, now);
  }
  return tickHanging(slot, elapsed);
}

function tickPotted(slot, elapsed, now) {
  const t = GROWTH_TIMERS.potted;
  let stage = slot.stage;

  if (elapsed >= t.seedToBud + t.budToSlightBloom + t.slightBloomToBloom) {
    stage = 3; // full bloom
    // check if bloom has expired
    const bloomedAt = slot.plantedAt + t.seedToBud + t.budToSlightBloom + t.slightBloomToBloom;
    if (now - bloomedAt >= t.bloomDeathTime) {
      return { ...slot, isDead: true, stage: 4 };
    }
  } else if (elapsed >= t.seedToBud + t.budToSlightBloom) {
    stage = 2;
  } else if (elapsed >= t.seedToBud) {
    stage = 1;
  } else {
    stage = 0;
  }

  return { ...slot, stage };
}

function tickHanging(slot, elapsed) {
  const t = GROWTH_TIMERS.hanging;
  const stage = elapsed >= t.budToFull ? 2 : 1;
  return { ...slot, stage };
}

// ─── Harvest ──────────────────────────────────────────────────────────────────
export function harvestPlant(slot) {
  const flower = POTTED_FLOWERS[slot.flowerKey];
  if (!flower || slot.isDead || slot.stage !== 3) return { coins: 0, slot };

  let coins = flower.harvestCoins;
  if (slot._budWatered) coins = Math.floor(coins * BONUS_COIN_MULTIPLIER);

  const cleared = createEmptySlot(slot.slotId, slot.room, slot.type);
  return { coins, slot: cleared };
}

// ─── Passive hanging coin trickle ─────────────────────────────────────────────
export function calcHangingPassiveCoins(slots, lastTickTime, now) {
  const { amount, interval } = GROWTH_TIMERS.hangingPassiveCoins;
  let total = 0;
  for (const slot of Object.values(slots)) {
    if (slot.type !== 'hanging' || !slot.flowerKey || slot.isDead || slot.stage < 2) continue;
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

// ─── Near-death detection (within 1h of death) ────────────────────────────────
export function isNearDeath(slot, now) {
  if (!slot.flowerKey || slot.isDead) return false;
  const timeSinceWatered = now - (slot.lastWatered ?? slot.plantedAt);
  const warningThreshold = GROWTH_TIMERS.deathIfNotWatered - 60 * 60 * 1000;
  return timeSinceWatered >= warningThreshold;
}

// ─── Achievements check helpers ───────────────────────────────────────────────
export function checkAllSlotsFilled(slots, room, type) {
  return Object.values(slots)
    .filter((s) => s.room === room && s.type === type)
    .every((s) => s.flowerKey !== null);
}
