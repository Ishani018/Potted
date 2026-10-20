import { PETS, PEST_CONFIG } from '../constants/gameData';

// Combines the effects of every placed pet. A pet counts only while it's placed
// in a room (petPlacements[key] is a room number), not when tucked away.

const ROOM_DEFAULTS = {
  pestChance: 1, cooldownMult: 1, wiltMult: 1, pestRewardMult: 1, hangingCoinMult: 1,
  autoCatch: 0, harvestLuck: 0,
};
const ADDITIVE = ['autoCatch', 'harvestLuck']; // chances add (capped), the rest multiply

// Owned pets that are placed in a room → [{ key, room, effect }]
export function placedPets(player) {
  const placements = player.petPlacements ?? {};
  return (player.ownedPets ?? [])
    .filter((k) => placements[k] != null && PETS[k])
    .map((k) => ({ key: k, room: placements[k], effect: PETS[k].effect ?? {} }));
}

// { [room]: effects } for rooms 1–3, defaults where no pet helps.
export function roomPetEffects(player) {
  const out = { 1: { ...ROOM_DEFAULTS }, 2: { ...ROOM_DEFAULTS }, 3: { ...ROOM_DEFAULTS } };
  for (const { room, effect } of placedPets(player)) {
    if (!effect.room || !out[room]) continue;
    for (const [k, v] of Object.entries(effect.room)) {
      out[room][k] = ADDITIVE.includes(k) ? Math.min(0.9, out[room][k] + v) : out[room][k] * v;
    }
  }
  return out;
}

export function globalPetEffects(player) {
  let bouquetMult = 1;
  for (const { effect } of placedPets(player)) bouquetMult *= effect.global?.bouquetMult ?? 1;
  return { bouquetMult };
}

// Coins for shooing a bug in `room`.
export function pestRewardFor(player, room) {
  return Math.round(PEST_CONFIG.reward * (roomPetEffects(player)[room]?.pestRewardMult ?? 1));
}

// Local calendar day, for once-a-day gifts.
export function dayKey(now) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
