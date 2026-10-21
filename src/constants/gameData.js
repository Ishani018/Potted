export const SEASONS = {
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
  winter: 'winter',
};

export function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return SEASONS.spring;
  if (month >= 5 && month <= 7) return SEASONS.summer;
  if (month >= 8 && month <= 10) return SEASONS.autumn;
  return SEASONS.winter;
}

export const POTTED_FLOWERS = {
  daisy:       { key: 'daisy',       name: 'Daisy',       harvestCoins: 10, seedPrice: 5  },
  snapdragon:  { key: 'snapdragon',  name: 'Snapdragon',  harvestCoins: 12, seedPrice: 8  },
  poppy:       { key: 'poppy',       name: 'Poppy',       harvestCoins: 14, seedPrice: 10 },
  marigold:    { key: 'marigold',    name: 'Marigold',    harvestCoins: 16, seedPrice: 12 },
  peony:       { key: 'peony',       name: 'Peony',       harvestCoins: 18, seedPrice: 15 },
  hydrenga:    { key: 'hydrenga',    name: 'Hydrangea',   harvestCoins: 20, seedPrice: 18 },
  rose:        { key: 'rose',        name: 'Rose',        harvestCoins: 22, seedPrice: 20 },
};

export const HANGING_PLANTS = {
  stringofpearls: { key: 'stringofpearls', name: 'String of Pearls', seedPrice: 10 },
  Philodendron:   { key: 'Philodendron',   name: 'Philodendron',     seedPrice: 12 },
  jasmine:        { key: 'jasmine',        name: 'Jasmine',          seedPrice: 15 },
  petunia:        { key: 'petunia',        name: 'Petunia',          seedPrice: 18 },
  Bougainvillea:  { key: 'Bougainvillea',  name: 'Bougainvillea',    seedPrice: 22 },
};

// ── Seed → pot type ───────────────────────────────────────────────────────────
// Potted flowers only grow in shelf pots, hanging plants only in hanging pots.
// Returns 'potted' | 'hanging' | null.
export function seedType(flowerKey) {
  if (POTTED_FLOWERS[flowerKey]) return 'potted';
  if (HANGING_PLANTS[flowerKey]) return 'hanging';
  return null;
}

// Banner text while holding a seed in a room whose pots are `roomTypes`.
export function heldSeedHint(flowerKey, roomTypes) {
  const type = seedType(flowerKey);
  if (type && !roomTypes.includes(type)) {
    return type === 'hanging'
      ? 'Hanging plant · needs a hanging pot (Balcony or Sunroom hooks) · tap to cancel'
      : 'Shelf flower · needs a shelf pot (Greenhouse or Sunroom shelves) · tap to cancel';
  }
  return type === 'hanging'
    ? 'Tap an empty hanging pot to plant · tap here to cancel'
    : 'Tap an empty shelf pot to plant · tap here to cancel';
}

// ── Pests ─────────────────────────────────────────────────────────────────────
// Every growth tick (1 min) each growing plant (bud or later, not yet full bloom)
// has `chancePerTick` of getting a pest. A plant with a pest can't be watered to
// the next stage until the pest is tapped away, which pays `reward` coins.
export const PEST_CONFIG = {
  chancePerTick: 0.012,   // ≈ one pest per plant every ~80 min of play
  reward: 3,
  // true = pests can also be cleared by hand with their little actions (see
  // PEST_INFO). false = only the herbalist's remedies work.
  handClearing: true,
  // How often each pest shows up (relative weights).
  weights: { aphid: 30, caterpillar: 25, snail: 20, moth: 15, ladybug: 10 },
};

// Each pest is cleared with its own little action (see components/Pest.js):
//   rub = scrub it off by swiping over it, hold = press and hold to lift it off,
//   drag = pull it away from the plant, catch = tap it 3 times as it flutters,
//   tap = tap to send it off. aspect = sprite height / width.
export const PEST_INFO = {
  aphid:       { name: 'Aphids',      action: 'rub',   verb: 'Swipe back and forth over them to rub them off.', aspect: 0.753 },
  caterpillar: { name: 'Caterpillar', action: 'hold',  verb: 'Press and hold until it is lifted off.',          aspect: 0.597 },
  snail:       { name: 'Snail',       action: 'drag',  verb: 'Drag it away from the plant, then let go.',       aspect: 0.7 },
  moth:        { name: 'Moth',        action: 'catch', verb: 'Tap it three times. It flutters off after each tap.', aspect: 0.7 },
  ladybug:     { name: 'Ladybug',     action: 'tap',   verb: 'Give it one tap to send it off.',                 aspect: 0.8 },
};

// Unknown types (older saves had 'beetle') behave like the easy tap-to-clear pest.
export function pestInfo(type) {
  return PEST_INFO[type] ?? PEST_INFO.ladybug;
}

// Pick a pest type by weight. rand: () => [0,1).
export function pickPestType(rand) {
  const entries = Object.entries(PEST_CONFIG.weights);
  let roll = rand() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [type, w] of entries) {
    roll -= w;
    if (roll < 0) return type;
  }
  return entries[0][0];
}

// Scented flowers keep bugs off: each full-bloom one multiplies the chance of a
// pest turning up anywhere in its room by this (never below SCENT_FLOOR).
export const SCENT_SHIELD = { marigold: 0.6, jasmine: 0.8 };
export const SCENT_FLOOR = 0.35;

// { [room]: multiplier } from the full-bloom scented flowers in each room.
export function roomScentShield(slots) {
  const out = {};
  for (const slot of Object.values(slots)) {
    const mult = SCENT_SHIELD[slot.flowerKey];
    if (!mult || slot.stage < (GROWTH_TIMERS.maxStage[slot.type] ?? 3)) continue;
    out[slot.room] = Math.max(SCENT_FLOOR, (out[slot.room] ?? 1) * mult);
  }
  return out;
}

export const WALL_COLORS = {
  room1: ['white'],
  room2: ['white'],
  room3: ['white'],
};

export const ROOM_UNLOCK_COSTS = {
  2: 0,
  3: 0,
};

export const PAINTINGS = {
  beachpainting:        { key: 'beachpainting',        name: 'Beach',          price: 50 },
  campfirepainting:     { key: 'campfirepainting',     name: 'Campfire',       price: 50 },
  sleepingpuppypainting:{ key: 'sleepingpuppypainting',name: 'Sleeping Puppy', price: 50 },
  tabbycatpainting:     { key: 'tabbycatpainting',     name: 'Tabby Cat',      price: 50 },
  weddingpainting:      { key: 'weddingpainting',      name: 'Wedding',        price: 50 },
  womanportraitpainting:{ key: 'womanportraitpainting',name: 'Woman Portrait', price: 50 },
  newbaby:              { key: 'newbaby',              name: 'New Baby',       price: 50 },
  picnic:               { key: 'picnic',               name: 'Picnic',         price: 50 },
};

// Each pet has an effect. `room` effects apply to the room the pet is placed in
// (several pets in one room stack). `daily` gifts and `global` effects apply
// while the pet is placed in any room (not tucked away).
//   pestChance ×, cooldownMult ×, wiltMult ×, pestRewardMult ×, hangingCoinMult ×,
//   autoCatch (chance per tick to catch a bug), harvestLuck (chance of +1 flower)
export const PETS = {
  george:        { key: 'george',        name: 'George',          price: 150, breed: 'Tabby Cat',
    effect: { title: 'Pest Patrol',      desc: 'Bugs are half as likely in its room.',                          room: { pestChance: 0.5 } } },
  storm:         { key: 'storm',         name: 'Storm',           price: 200, breed: 'Husky',
    effect: { title: 'Digger',           desc: 'Digs up a free seed bag once a day.',                           daily: { seed: true } } },
  koazy:         { key: 'koazy',         name: 'Koazy',           price: 180, breed: 'Ragdoll Cat',
    effect: { title: 'Cozy Nap',         desc: 'Plants in its room are ready to water 20% sooner.',             room: { cooldownMult: 0.8 } } },
  brownie:       { key: 'brownie',       name: 'Brownie',         price: 160, breed: 'Pomeranian',
    effect: { title: 'Show-Off',         desc: 'Hanging plants in its room earn double coins.',                 room: { hangingCoinMult: 2 } } },
  aki:           { key: 'aki',           name: 'Aki',             price: 220, breed: 'Akita',
    effect: { title: 'Fetch!',           desc: 'Brings you 10–25 coins once a day.',                            daily: { coins: [10, 25] } } },
  cherry:        { key: 'cherry',        name: 'Cherry',          price: 140, breed: 'Golden Puppy',
    effect: { title: 'Good Pup',         desc: 'Bouquets sell for 15% more.',                                   global: { bouquetMult: 1.15 } } },
  martin:        { key: 'martin',        name: 'Martin',          price: 130, breed: 'Old Tabby',
    effect: { title: 'Wise Old Watcher', desc: 'Plants in its room take twice as long to wilt.',                room: { wiltMult: 2 } } },
  tiger:         { key: 'tiger',         name: 'Tiger',           price: 190, breed: 'Calico Cat',
    effect: { title: 'Bug Snacker',      desc: 'Sometimes catches bugs in its room for you (you keep the coins).', room: { autoCatch: 0.2 } } },
  milk:          { key: 'milk',          name: 'Milk',            price: 170, breed: 'White Cat',
    effect: { title: 'Lucky Paws',       desc: 'Harvests in its room have a 25% chance of an extra flower.',    room: { harvestLuck: 0.25 } } },
  oreo:          { key: 'oreo',          name: 'Oreo',            price: 170, breed: 'Black Cat',
    effect: { title: 'Midnight Hunter',  desc: 'Shooing bugs in its room pays double.',                         room: { pestRewardMult: 2 } } },
  // Always-together pair — one purchase, two cats.
  ebonyandivory: { key: 'ebonyandivory', name: 'Ebony & Ivory',   price: 300, breed: 'Bonded Pair',
    effect: { title: 'Bonded Pair',      desc: 'Plants in its room are ready to water 15% sooner and get 25% fewer bugs.', room: { cooldownMult: 0.85, pestChance: 0.75 } } },
};

// ── Pre-determined pet positions per room ─────────────────────────────────────
// Laid out in Plopper (1376×768 base, sprite CENTER anchor). A pet shows at its
// room's spot only when the player has PLACED it there (petPlacements[key]===room).
// Each entry: { x, y, w, h, flip, z } in base px. Projected like the hub screens
// (fraction of measured box). Rooms without a real layout yet are empty {}.
export const PET_BASE = { w: 1376, h: 768 };
export const PET_POSITIONS = {
  1: {
    george:        { x: 222,  y: 336, w: 120, h: 135, flip: false, z: 3 },
    tiger:         { x: 121,  y: 152, w: 111, h: 145, flip: false, z: 5 },
    koazy:         { x: 422,  y: 153, w: 133, h: 76,  flip: true,  z: 4 },
    martin:        { x: 542,  y: 112, w: 112, h: 162, flip: false, z: 6 },
    ebonyandivory: { x: 201,  y: 548, w: 123, h: 77,  flip: false, z: 2 },
    cherry:        { x: 561,  y: 693, w: 153, h: 85,  flip: false, z: 1 },
    aki:           { x: 184,  y: 653, w: 133, h: 158, flip: false, z: 8 },
    oreo:          { x: 891,  y: 162, w: 140, h: 62,  flip: false, z: 10 },
    milk:          { x: 968,  y: 96,  w: 86,  h: 118, flip: false, z: 9 },
    brownie:       { x: 1249, y: 589, w: 115, h: 125, flip: false, z: 7 },
    storm:         { x: 925,  y: 649, w: 123, h: 165, flip: false, z: 11 },
  },
  2: {
    george:        { x: 40,   y: 422, w: 89,  h: 100, flip: false, z: 3 },
    martin:        { x: 181,  y: 620, w: 112, h: 162, flip: true,  z: 6 },
    tiger:         { x: 253,  y: 642, w: 99,  h: 129, flip: false, z: 5 },
    aki:           { x: 87,   y: 691, w: 133, h: 158, flip: false, z: 8 },
    oreo:          { x: 447,  y: 705, w: 140, h: 62,  flip: false, z: 10 },
    brownie:       { x: 627,  y: 685, w: 115, h: 125, flip: false, z: 7 },
    milk:          { x: 712,  y: 293, w: 88,  h: 121, flip: false, z: 9 },
    storm:         { x: 772,  y: 604, w: 113, h: 152, flip: false, z: 11 },
    cherry:        { x: 916,  y: 691, w: 152, h: 84,  flip: false, z: 1 },
    koazy:         { x: 1052, y: 629, w: 134, h: 77,  flip: true,  z: 4 },
    ebonyandivory: { x: 1300, y: 719, w: 136, h: 85,  flip: false, z: 2 },
  },
  3: {
    tiger:         { x: 1054, y: 359, w: 103, h: 135, flip: true,  z: 1 },
    koazy:         { x: 1214, y: 367, w: 127, h: 73,  flip: false, z: 2 },
    brownie:       { x: 1177, y: 691, w: 105, h: 114, flip: false, z: 3 },
    aki:           { x: 539,  y: 634, w: 105, h: 125, flip: false, z: 4 },
    cherry:        { x: 811,  y: 658, w: 128, h: 71,  flip: false, z: 5 },
    oreo:          { x: 1104, y: 214, w: 140, h: 62,  flip: false, z: 6 },
    ebonyandivory: { x: 362,  y: 662, w: 135, h: 84,  flip: false, z: 7 },
    martin:        { x: 162,  y: 639, w: 124, h: 179, flip: true,  z: 8 },
    george:        { x: 368,  y: 199, w: 102, h: 114, flip: false, z: 9 },
    milk:          { x: 1233, y: 182, w: 89,  h: 122, flip: true,  z: 10 },
    storm:         { x: 905,  y: 640, w: 116, h: 155, flip: false, z: 11 },
  },
};

// Growth timers in milliseconds
const HOUR = 60 * 60 * 1000;

// ── Water-with-cooldown growth ────────────────────────────────────────────────
// Each watering advances ONE stage. After watering, the plant becomes "thirsty"
// again WATER_COOLDOWN later, and only then can it be watered to the next stage.
// If left thirsty past WILT_AFTER it wilts (sad look, growth paused) — watering
// revives it. Nothing dies. A full bloom never expires.
export const GROWTH_TIMERS = {
  waterCooldown: 3 * HOUR,   // time until a watered plant is thirsty again
  wiltAfter:     24 * HOUR,  // thirsty for this long → wilts (recoverable by watering)
  // Max growth stage per type (full bloom). Watering past this does nothing.
  maxStage: { potted: 3, hanging: 2 },
  hangingPassiveCoins: { amount: 2, interval: 6 * HOUR },
};

export const BONUS_COIN_MULTIPLIER = 1.2;

// ── Per-flower growth time ────────────────────────────────────────────────────
// Hours until a watered plant is thirsty again (and so can be watered to its
// next stage). Potted flowers need 2 waits (seed→bud→bloom→full = 3 waterings),
// hanging plants need 1. Slower flowers are also the more valuable ones.
// A pet's cooldownMult (Koazy etc.) shortens these.
export const FLOWER_GROWTH = {
  daisy:          { hours: 1 },
  snapdragon:     { hours: 1.5 },
  poppy:          { hours: 2 },
  marigold:       { hours: 2.5 },
  peony:          { hours: 3.5 },
  hydrenga:       { hours: 4.5 },
  rose:           { hours: 6 },
  stringofpearls: { hours: 2 },
  Philodendron:   { hours: 3 },
  jasmine:        { hours: 4 },
  petunia:        { hours: 5 },
  Bougainvillea:  { hours: 6 },
};

// Water-again cooldown in ms for a flower (falls back to the global default).
export function growthCooldownMs(flowerKey) {
  const h = FLOWER_GROWTH[flowerKey]?.hours;
  return h ? Math.round(h * HOUR) : GROWTH_TIMERS.waterCooldown;
}

// "1h 12m" / "35m" / "20s"
export function formatDuration(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return h ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

// ── Player levels ─────────────────────────────────────────────────────────────
// XP comes from growing and selling. Each level unlocks new seeds and bouquet
// papers and pays a coin reward. Level is derived from total XP (player.xp).
export const XP_CONFIG = {
  water: 3,            // each time a plant is watered to its next stage
  pest: 2,             // shooing a bug
  firstBloom: 15,      // a flower's first full bloom (fills its book page)
  newRecipe: 20,       // discovering a bouquet recipe
  bouquetDivisor: 3,   // bouquet XP = coins earned / this
  levelUpCoins: 20,    // reward = this x the new level
};

// XP needed to go from level n to n+1.
export function xpToNext(n) {
  return 40 + 25 * n;
}

// { level, into, need, progress } for a total XP amount.
export function levelInfo(totalXp = 0) {
  let level = 1;
  let left = Math.max(0, totalXp);
  while (left >= xpToNext(level)) {
    left -= xpToNext(level);
    level += 1;
  }
  const need = xpToNext(level);
  return { level, into: left, need, progress: left / need };
}

// TEST SWITCH: the level is never below this. Set to 99 to unlock everything
// while testing. Leave at 1 for the real game.
export const DEBUG_MIN_LEVEL = 1;

export function playerLevel(player) {
  return Math.max(levelInfo(player?.xp ?? 0).level, DEBUG_MIN_LEVEL);
}

// Level at which each seed appears in the nursery.
export const SEED_UNLOCK_LEVEL = {
  daisy: 1, stringofpearls: 1,
  snapdragon: 2, Philodendron: 2,
  poppy: 3, jasmine: 3,
  marigold: 4, petunia: 4,
  peony: 5, Bougainvillea: 5,
  hydrenga: 6,
  rose: 7,
};

export function seedUnlockLevel(flowerKey) {
  return SEED_UNLOCK_LEVEL[flowerKey] ?? 1;
}

// Names of everything that unlocks exactly at `level` (for the level-up notice).
export function unlocksAtLevel(level) {
  const names = [];
  for (const [key, lv] of Object.entries(SEED_UNLOCK_LEVEL)) {
    if (lv === level) names.push(`${POTTED_FLOWERS[key]?.name ?? HANGING_PLANTS[key]?.name ?? key} seeds`);
  }
  for (const p of Object.values(BOUQUET_PAPERS)) {
    if (p.level === level) names.push(`${p.name} paper`);
  }
  return names;
}

// Stages
// Potted:  0=seed, 1=bud, 2=slight bloom, 3=full bloom (harvest)
// Hanging: 0=seed, 1=bud, 2=full (harvest)
// (no dead stage — neglected plants wilt, they don't die)

// ── Per-flower, per-stage display scale ───────────────────────────────────────
// Each flower PNG is cropped tightly to a different degree, so a single size
// makes some render tiny. This multiplies the base pot width PER flower PER
// growth stage. 1.0 = base size; bump up if a flower looks too small at a stage.
// Stage 0 (seed) uses the shared pot image, so it's not listed here.
// Indexed [flowerKey][stage]. Missing entries default to 1.0.
export const FLOWER_STAGE_SCALE = {
  // Potted (stages 1=bud, 2=slight bloom, 3=full bloom). Bumped up so the
  // flower+pot matches an empty pot's size despite each PNG's tight crop.
  // Scales measured PER STAGE per PNG (pot-rim width ÷ image width vs the empty
  // pot) so every flower's pot renders the same size as an empty pot. Each stage's
  // image is cropped differently, so each gets its own scale.
  daisy:      { 1: 2.75, 2: 2.75, 3: 2.76 },
  snapdragon: { 1: 1.00, 2: 2.96, 3: 1.20 },
  poppy:      { 1: 0.93, 2: 0.93, 3: 2.74 },
  marigold:   { 1: 0.93, 2: 2.73, 3: 2.29 },
  peony:      { 1: 0.93, 2: 0.95, 3: 0.93 },
  hydrenga:   { 1: 0.95, 2: 1.43, 3: 1.21 },
  rose:       { 1: 0.93, 2: 2.74, 3: 0.94 },
  // Hanging (stages 1=bud, 2=full). Room 2 sizes via baseWidthOverride; these are
  // gentle per-plant nudges. Tune by eye if a hanging plant looks off.
  stringofpearls: { 1: 1.0, 2: 1.0 },
  Philodendron:   { 1: 1.0, 2: 1.0 },
  jasmine:        { 1: 1.0, 2: 1.0 },
  petunia:        { 1: 1.0, 2: 1.0 },
  Bougainvillea:  { 1: 1.0, 2: 1.0 },
};

// ── Catch-up summary ──────────────────────────────────────────────────────────
// Coming back after at least `minAwayMs` shows a "while you were away" summary.
// Pests keep arriving while you're gone, simulated for up to `maxPestMinutes`.
export const CATCH_UP = {
  minAwayMs: 10 * 60 * 1000,
  maxPestMinutes: 6 * 60,
};

export const ROOM_NAMES = { 1: 'Greenhouse', 2: 'Balcony', 3: 'Sunroom' };

// ── Market trading ────────────────────────────────────────────────────────────
// All 12 tradeable flowers, mapped to their trade-image key + a base value the
// daily price varies around. Each day, 6 of these appear in the market's 6 slots
// at a price near their base value (chosen by a date seed, so it's stable within
// a day and changes the next).
export const TRADE_FLOWERS = {
  daisy:          { key: 'daisy',          name: 'Daisy',            img: 'daisytrade',          base: 10 },
  snapdragon:     { key: 'snapdragon',     name: 'Snapdragon',       img: 'snapdragontrade',     base: 12 },
  poppy:          { key: 'poppy',          name: 'Poppy',            img: 'poppytrade',          base: 14 },
  marigold:       { key: 'marigold',       name: 'Marigold',         img: 'marigoldtrade',       base: 16 },
  peony:          { key: 'peony',          name: 'Peony',            img: 'peonytrade',          base: 18 },
  hydrenga:       { key: 'hydrenga',       name: 'Hydrangea',        img: 'hydrengatrade',       base: 20 },
  rose:           { key: 'rose',           name: 'Rose',             img: 'rosetrade',           base: 22 },
  stringofpearls: { key: 'stringofpearls', name: 'String of Pearls', img: 'stringofpearlstrade', base: 13 },
  Philodendron:   { key: 'Philodendron',   name: 'Philodendron',     img: 'philodendrontrade',   base: 15 },
  jasmine:        { key: 'jasmine',        name: 'Jasmine',          img: 'jasminetrade',        base: 17 },
  petunia:        { key: 'petunia',        name: 'Petunia',          img: 'petuniatrade',        base: 19 },
  Bougainvillea:  { key: 'Bougainvillea',  name: 'Bougainvillea',    img: 'bougenvillatrade',    base: 22 },
};

// Deterministic per-day pseudo-random (mulberry32 seeded by an integer).
function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns today's 6 market offers: [{ key, name, img, price }] — stable per day.
export function getDailyTrades() {
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const rand = seededRandom(daySeed);

  // Shuffle the 12 keys, take 6.
  const keys = Object.keys(TRADE_FLOWERS);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys.slice(0, 6).map((key) => {
    const f = TRADE_FLOWERS[key];
    // Price varies ±40% around base value, rounded, min 1.
    const factor = 0.6 + rand() * 0.8;
    const price = Math.max(1, Math.round(f.base * factor));
    return { key, name: f.name, img: f.img, price };
  });
}

export const INITIAL_PLAYER_STATE = {
  coins: 50000,
  unlockedRooms: [1, 2, 3],
  currentRoom: 1,
  wallColor: { room1: 'white', room2: 'white', room3: 'white' },
  inventory: { daisy: 1 },
  placedDecor: {
    room2: { photoFrame: null, pet: null },
  },
  achievements: [],
  harvestCount: 0,
  // flowerKey → count, harvested flowers awaiting trade for coins.
  // TEMP: seeded with test flowers so trading is testable — clear to {} before release.
  harvestedFlowers: { daisy: 8, rose: 5, marigold: 6, jasmine: 4, peony: 3, poppy: 7, hydrenga: 5, snapdragon: 6 },
  ownedPaintings: [],
  ownedPets: [],
  petNames: {},      // petKey → custom name chosen at adoption
  petPlacements: {}, // petKey → room number where the owned pet is currently placed
  flowerBook: {},    // flowerKey → { grown, firstAt } — page unlocks on first full bloom
  pestsCleared: 0,
  xp: 0,             // total experience — level is derived (see levelInfo)
  customers: null,   // { day, list: [orders] } — today's florist orders (engine/customers)
  customersServed: 0,
  remedies: { balm: 0, sachet: 0 },  // herbalist remedies in the bag
  herbalistDay: null,                // day key of the last free daily balm
  bouquetBook: {},   // recipeId → { made, firstAt } — secret bouquet recipes found
  bouquetsSold: 0,
  petGifts: {},      // petKey → day key of the last daily gift
};

// ── Flower book ───────────────────────────────────────────────────────────────
// One page per flower. A page unlocks the first time that flower reaches full
// bloom. season = the flower's natural bloom season (flavour for now).
export const FLOWER_BOOK = [
  { key: 'daisy',          season: 'spring', blurb: 'A cheerful little bloom that opens with the sun and closes at dusk.',                tip: 'The easiest flower to grow — a great first harvest.' },
  { key: 'snapdragon',     season: 'spring', blurb: 'Squeeze a blossom and it opens like a tiny dragon\'s mouth.',                       tip: 'Tall stems — give it a spot with headroom on the shelf.' },
  { key: 'poppy',          season: 'summer', blurb: 'Papery petals that flutter in the slightest breeze.',                               tip: 'Poppies sell well when the market is short on red.' },
  { key: 'marigold',       season: 'autumn', blurb: 'Warm golden pom-poms. Gardeners say pests dislike their scent.',                    tip: 'Bugs hate its scent: a full-bloom marigold keeps them off the whole room.' },
  { key: 'peony',          season: 'spring', blurb: 'Big, ruffled, and fragrant. A peony bloom is worth the wait.',                      tip: 'A valuable flower — check the market for a good day to sell.' },
  { key: 'hydrenga',       season: 'summer', blurb: 'Clusters of tiny flowers form one big puffy bloom.',                                tip: 'One of the priciest potted flowers at the market.' },
  { key: 'rose',           season: 'summer', blurb: 'The classic. Every gardener\'s pride and joy.',                                    tip: 'The most valuable shelf flower — save the best price days for roses.' },
  { key: 'stringofpearls', season: 'summer', blurb: 'Trailing strands of round, bead-like leaves.',                                     tip: 'Grows in hanging pots only.' },
  { key: 'Philodendron',   season: 'autumn', blurb: 'Glossy heart-shaped leaves that tumble over the pot\'s edge.',                     tip: 'Grows in hanging pots only.' },
  { key: 'jasmine',        season: 'summer', blurb: 'Tiny white stars with a sweet evening scent.',                                     tip: 'Its scent keeps some bugs off the room once in full bloom. Hanging pots only.' },
  { key: 'petunia',        season: 'spring', blurb: 'Trumpet-shaped blooms that spill down in a colourful cascade.',                     tip: 'Grows in hanging pots only.' },
  { key: 'Bougainvillea',  season: 'summer', blurb: 'Bright paper-like bracts in hot pink — a burst of colour.',                         tip: 'Grows in hanging pots only.' },
];

export const ACHIEVEMENTS = [
  { id: 'first_bloom',    title: 'First Bloom',       desc: 'Harvest your first flower.',          check: (s) => s.harvestCount >= 1 },
  { id: 'ten_harvests',   title: 'Green Thumb',        desc: 'Harvest 10 flowers.',                  check: (s) => s.harvestCount >= 10 },
  { id: 'full_slots',     title: 'Garden Full',        desc: 'Fill every slot in a room.',           check: (s) => s._allSlotsFilledOnce },
  { id: 'near_death',     title: 'Back from the Brink',desc: 'Water a nearly-dead plant in time.',  check: (s) => s._savedFromDeath },
  { id: 'room2_unlock',   title: 'Balcony Life',       desc: 'Unlock the Balcony.',                  check: (s) => s.unlockedRooms.includes(2) },
  { id: 'room3_unlock',   title: 'Sunroom Dreams',     desc: 'Unlock the Sunroom.',                  check: (s) => s.unlockedRooms.includes(3) },
];

// ── Bouquets ──────────────────────────────────────────────────────────────────
// Tie any 3 harvested flowers into a bouquet and sell it at the market. Unlike
// single flowers (only sellable when featured that day), the market always buys
// bouquets. Value = sum of the flowers' base values × the bouquet's multiplier.
export const BOUQUET_SIZE = 3;
export const BOUQUET_MIXED = { name: 'Mixed Bouquet', multiplier: 1.1 };
export const BOUQUET_TRIO = { multiplier: 1.3 }; // 3 of the same flower
// Secret recipes (order doesn't matter). Found ones are recorded in the book;
// unfound ones show only their hint.
export const BOUQUET_RECIPES = [
  { id: 'sweetheart', name: 'Sweetheart',     flowers: ['rose', 'rose', 'peony'],          multiplier: 1.8, hint: 'Something for someone you love.' },
  { id: 'sunshine',   name: 'Sunshine',       flowers: ['daisy', 'marigold', 'poppy'],     multiplier: 1.6, hint: 'Three flowers as warm as the sun.' },
  { id: 'cottage',    name: 'Cottage Garden', flowers: ['snapdragon', 'daisy', 'peony'],   multiplier: 1.6, hint: 'Picked from a little garden by a country cottage.' },
  { id: 'summer',     name: 'Summer Breeze',  flowers: ['hydrenga', 'poppy', 'rose'],      multiplier: 1.7, hint: 'Three summer bloomers together.' },
  { id: 'harvest',    name: 'Harvest Moon',   flowers: ['marigold', 'marigold', 'snapdragon'], multiplier: 1.6, hint: 'Golden autumn colours under the moon.' },
  { id: 'wedding',    name: 'Wedding Day',    flowers: ['rose', 'peony', 'hydrenga'],      multiplier: 2.0, hint: 'The grandest flowers for the biggest day.' },
  { id: 'cascade',    name: 'Garden Cascade', flowers: ['jasmine', 'petunia', 'Bougainvillea'],       multiplier: 1.8, hint: 'Everything that hangs and spills over the edge.' },
  { id: 'trailing',   name: 'Trailing Vines', flowers: ['stringofpearls', 'Philodendron', 'jasmine'], multiplier: 1.6, hint: 'Long green strands with a sweet white finish.' },
  { id: 'meadow',     name: 'Wild Meadow',    flowers: ['daisy', 'poppy', 'petunia'],                 multiplier: 1.6, hint: 'A little of the ground, a little of the sky.' },
];

// Wrapping papers — each fancier than the last, with a value bonus. A sheet is
// used up every time you tie a bouquet, so it costs `cost` coins each time:
// worth it on a valuable bouquet (e.g. +12 on a 110-coin Sweetheart for 6), a
// loss on a cheap one (+4 on a 38-coin mixed bunch for 6).
export const BOUQUET_PAPERS = {
  plain:   { id: 'plain',   name: 'Kraft',   bonus: 1.0, cost: 0,  level: 1 },
  layered: { id: 'layered', name: 'Layered', bonus: 1.1, cost: 6,  level: 3 },
  fancy:   { id: 'fancy',   name: 'Fancy',   bonus: 1.2, cost: 14, level: 5 },
};

// Unknown ids fall back to plain kraft (free).
export function bouquetPaper(id) {
  return BOUQUET_PAPERS[id] ?? BOUQUET_PAPERS.plain;
}

function sameFlowers(a, b) {
  if (a.length !== b.length) return false;
  const x = [...a].sort(), y = [...b].sort();
  return x.every((k, i) => k === y[i]);
}

// keys: array of BOUQUET_SIZE flower keys →
// { recipe, name, multiplier, paperBonus, paperCost, value, net }
// (value = sale price, net = value minus the paper's cost).
// bonus: extra multiplier from pets (see globalPetEffects).
export function evaluateBouquet(keys, bonus = 1, paper = 'plain') {
  const base = keys.reduce((sum, k) => sum + (TRADE_FLOWERS[k]?.base ?? 0), 0);
  const recipe = BOUQUET_RECIPES.find((r) => sameFlowers(r.flowers, keys)) ?? null;
  let name = BOUQUET_MIXED.name;
  let multiplier = BOUQUET_MIXED.multiplier;
  if (recipe) {
    name = recipe.name;
    multiplier = recipe.multiplier;
  } else if (keys.every((k) => k === keys[0])) {
    name = `${TRADE_FLOWERS[keys[0]]?.name ?? keys[0]} Bouquet`;
    multiplier = BOUQUET_TRIO.multiplier;
  }
  const { bonus: paperBonus, cost: paperCost } = bouquetPaper(paper);
  const value = Math.round(base * multiplier * paperBonus * bonus);
  return { recipe, name, multiplier, paperBonus, paperCost, value, net: value - paperCost };
}

// ── Florist customers ─────────────────────────────────────────────────────────
// Each day three customers visit the florist with an order (see engine/customers).
// Sprites live in assets/customers/<key>.png (see CUSTOMER_IMAGES in engine/assets).
//   look   = palette for the stand-in drawn person (also a colour guide for the
//            real sprite); desc = what the sprite should show.
//   likes  = flowers they ask for; lines use {flower} / {qty}.
export const CUSTOMERS = {
  clara: {
    key: 'clara', name: 'Clara', desc: 'Girl with long wavy auburn hair and a cream bow, olive floral skirt, brown satchel.',
    look: { skin: '#f1c9a0', hair: '#8a3a1c', outfit: '#7a8a46' },
    likes: ['rose', 'peony', 'petunia'],
    askFlowers: "I'm decorating my reading nook! Could I have {qty} {flower}?",
    askBouquet: "A bouquet for my best friend's birthday, please. It must have {flower} in it.",
    thanks: "Oh, they're gorgeous! Thank you!",
  },
  theo: {
    key: 'theo', name: 'Theo', desc: 'Curly-haired student in a green hoodie and brown trousers, flower tote bag.',
    look: { skin: '#f0c49a', hair: '#3a2416', outfit: '#3f6a3a' },
    likes: ['daisy', 'snapdragon', 'poppy'],
    askFlowers: 'My flat is so dull. Could I get {qty} {flower}, please?',
    askBouquet: "It's for my sister's graduation! A bouquet with {flower} in it?",
    thanks: "Nice one! She's going to love these.",
  },
  iris: {
    key: 'iris', name: 'Iris', desc: 'Woman with a messy bun, cream cardigan, lilac floral skirt, brown satchel.',
    look: { skin: '#eebf94', hair: '#3a2a22', outfit: '#a98bd0' },
    likes: ['hydrenga', 'jasmine', 'petunia'],
    askFlowers: "I'm hosting a tea party! Might I have {qty} {flower}?",
    askBouquet: 'A pretty centrepiece for the tea table, with {flower} in it.',
    thanks: 'Perfect! Do stay for a cup.',
  },
  posy: {
    key: 'posy', name: 'Posy', desc: 'Small laughing girl in a pink dress with a daisy in her wavy brown hair.',
    look: { skin: '#f4cfa8', hair: '#7a4a2a', outfit: '#f2a0b8' },
    likes: ['daisy', 'poppy', 'marigold'],
    askFlowers: 'Can I have {qty} {flower}? I want to make a flower crown!',
    askBouquet: "A bouquet with {flower}, please! It's for my teacher!",
    thanks: 'Yay yay yay! Thank you!',
  },
  walt: {
    key: 'walt', name: 'Grandpa Walt', desc: 'Old man in a flat cap, round glasses, white moustache, brown tweed jacket, walking cane.',
    look: { skin: '#f0c9a6', hair: '#d8d8d8', outfit: '#7a5a2a' },
    likes: ['marigold', 'rose', 'snapdragon'],
    askFlowers: 'Back in my day I grew these myself. {qty} {flower}, if you please.',
    askBouquet: "For my wife's birthday. A bouquet with {flower}; she's always liked those.",
    thanks: "She'll smile at that. Thank you, young one.",
  },
  finn: {
    key: 'finn', name: 'Finn', desc: 'Boy in a beige cap, brown overalls and green sneakers, mid-stride, big grin.',
    look: { skin: '#f2c8a0', hair: '#6a4426', outfit: '#7a4a24' },
    likes: ['poppy', 'marigold', 'daisy'],
    askFlowers: "My mum's garden needs help! Do you have {qty} {flower}?",
    askBouquet: 'A bouquet with {flower} for my mum! I saved up!',
    thanks: "Thanks! She's gonna love it!",
  },
  marisol: {
    key: 'marisol', name: 'Marisol', desc: 'Woman with long curly auburn hair, gold hoops, black top, wide blue jeans, black satchel.',
    look: { skin: '#e8b48a', hair: '#9a3a1c', outfit: '#6a90b8' },
    likes: ['Bougainvillea', 'petunia', 'poppy'],
    askFlowers: "I'm styling a photoshoot. {qty} {flower}, and quickly!",
    askBouquet: 'For a photoshoot: a bouquet with {flower} in it, please.',
    thanks: 'Gorgeous. The camera will love these.',
  },
  ben: {
    key: 'ben', name: 'Gardener Ben', desc: 'Bearded man with glasses and messy hair, cream shirt, green apron with brass buttons.',
    look: { skin: '#eebf94', hair: '#4a3020', outfit: '#3d5a2a' },
    likes: ['stringofpearls', 'Philodendron', 'snapdragon'],
    askFlowers: 'My greenhouse is short of a few things. {qty} {flower}, please?',
    askBouquet: 'A bouquet with {flower} for the garden club raffle.',
    thanks: 'Smashing. The club will love them.',
  },
  nori: {
    key: 'nori', name: 'Nori', desc: 'Girl with long black hair, white bow and headphones, cream sweater, olive cargo trousers, tote bag.',
    look: { skin: '#f0cfae', hair: '#1c1418', outfit: '#6a7a3a' },
    likes: ['jasmine', 'Philodendron', 'stringofpearls', 'Bougainvillea'],
    askFlowers: 'Plants for my study space! {qty} {flower}, please.',
    askBouquet: 'A bouquet with {flower} for my desk. Make it pretty!',
    thanks: 'Yes! Desk upgrade complete.',
  },
};

export const CUSTOMERS_PER_DAY = 3;

// ── The herbalist & remedies ──────────────────────────────────────────────────
// Granny Mae the herbalist waits on the Home screen. Her remedies can't be bought:
// she gives one Bug Balm free every day and swaps more for flowers you've grown.
//   balm    — clears a pest from one plant at once (no coins/XP, unlike by hand)
//   sachet  — hangs on a plant and keeps pests off it for SACHET_MS
// Art: she reuses Granny Mae's customer sprite; balm.png and sachet.png (256x256,
// transparent, assets/herbalist/) are optional icons — see HERBALIST_IMAGES in engine/assets.
export const HERBALIST = {
  key: 'maemae',
  name: 'Granny Mae',
  title: 'HERBALIST',
  // Reuses the customer sprite CUSTOMER_IMAGES[sprite] (she isn't a florist
  // customer any more).
  sprite: 'maemae',
  desc: 'Elderly woman with a grey bun, purple floral shawl, long plum skirt and a wicker basket of herbs.',
  greetDaily: "Morning, dear! A fresh jar of balm for you, on the house.",
  greetNone: "Back already, dear? Bring me some herbs and I'll mix you something.",
  thanks: 'There you go, dear.',
};

export const REMEDIES = {
  balm:   { key: 'balm',   name: 'Bug Balm',     desc: 'Clears the bug from one plant at once.' },
  sachet: { key: 'sachet', name: 'Scent Sachet', desc: 'Keeps one plant bug-free for a day.' },
};

export const SACHET_MS = 24 * HOUR;

// What she'll swap for flowers you've harvested.
export const HERBALIST_TRADES = [
  { id: 'balm_marigold', give: { marigold: 2 }, get: 'balm',   qty: 1 },
  { id: 'balm_daisy',    give: { daisy: 3 },    get: 'balm',   qty: 1 },
  { id: 'sachet_jasmine', give: { jasmine: 1 }, get: 'sachet', qty: 1 },
  { id: 'sachet_poppy',  give: { poppy: 2 },    get: 'sachet', qty: 1 },
];

// Whether a plant is currently protected by a sachet.
export function isShielded(slot, now = Date.now()) {
  return !!slot?.shieldUntil && slot.shieldUntil > now;
}

