import { PETS, PEST_CONFIG, FED_BOOST } from '../constants/gameData';

// Combines the effects of every placed pet. A pet counts only while it's placed
// in a room (petPlacements[key] is a room number), not when tucked away.

const ROOM_DEFAULTS = {
  pestChance: 1, cooldownMult: 1, wiltMult: 1, pestRewardMult: 1, hangingCoinMult: 1,
  autoCatch: 0, harvestLuck: 0,
};
const ADDITIVE = ['autoCatch', 'harvestLuck']; // chances add (capped), the rest multiply

// A pet is "fed" while petCare[key] (a timestamp) is still in the future.
export const isFed = (player, key, now = Date.now()) => (player.petCare?.[key] ?? 0) > now;

// The same effect with every number made FED_BOOST times as strong.
function boostEffect(effect) {
  const boostRoom = (room) => Object.fromEntries(Object.entries(room).map(([k, v]) => [
    k,
    ADDITIVE.includes(k) ? v * FED_BOOST
      : v < 1 ? Math.max(0.2, 1 - (1 - v) * FED_BOOST)
      : 1 + (v - 1) * FED_BOOST,
  ]));
  const out = { ...effect };
  if (effect.room) out.room = boostRoom(effect.room);
  if (effect.global) out.global = { bouquetMult: 1 + (effect.global.bouquetMult - 1) * FED_BOOST };
  if (effect.daily) {
    out.daily = { ...effect.daily };
    if (effect.daily.coins) out.daily.coins = effect.daily.coins.map((n) => n * FED_BOOST);
    if (effect.daily.seed) out.daily.seed = FED_BOOST;
  }
  return out;
}

// Owned pets that are placed in a room → [{ key, room, effect }]. A fed pet's
// effect comes back already boosted, so everything downstream just works.
export function placedPets(player, now = Date.now()) {
  const placements = player.petPlacements ?? {};
  return (player.ownedPets ?? [])
    // a pet that is out on an adventure isn't home to help
    .filter((k) => placements[k] != null && PETS[k] && !player.adventures?.[k])
    // 'all' = the pet appears (and helps) in every room
    .flatMap((k) => {
      const effect = isFed(player, k, now) ? boostEffect(PETS[k].effect ?? {}) : (PETS[k].effect ?? {});
      return (placements[k] === 'all' ? [1, 2, 3] : [placements[k]]).map((room) => ({ key: k, room, effect }));
    });
}

// { [room]: effects } for rooms 1–3, defaults where no pet helps.
export function roomPetEffects(player, now) {
  const out = { 1: { ...ROOM_DEFAULTS }, 2: { ...ROOM_DEFAULTS }, 3: { ...ROOM_DEFAULTS } };
  const apply = (room, block) => {
    for (const [k, v] of Object.entries(block)) {
      out[room][k] = ADDITIVE.includes(k) ? Math.min(0.9, out[room][k] + v) : out[room][k] * v;
    }
  };
  for (const { room, effect } of placedPets(player, now)) {
    if (effect.room && out[room]) apply(room, effect.room);
  }
  return out;
}

export function globalPetEffects(player, now) {
  let bouquetMult = 1;
  // A pet placed in 'all' rooms shows up once per room in placedPets, so count
  // each pet once here (these effects aren't per-room).
  const seen = new Set();
  for (const { key, effect } of placedPets(player, now)) {
    if (seen.has(key)) continue;
    seen.add(key);
    bouquetMult *= effect.global?.bouquetMult ?? 1;
  }
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
