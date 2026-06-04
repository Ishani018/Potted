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

export const PETS = {
  george:        { key: 'george',        name: 'George',          price: 150, breed: 'Tabby Cat' },
  storm:         { key: 'storm',         name: 'Storm',           price: 200, breed: 'Husky' },
  koazy:         { key: 'koazy',         name: 'Koazy',           price: 180, breed: 'Ragdoll Cat' },
  brownie:       { key: 'brownie',       name: 'Brownie',         price: 160, breed: 'Pomeranian' },
  aki:           { key: 'aki',           name: 'Aki',             price: 220, breed: 'Akita' },
  cherry:        { key: 'cherry',        name: 'Cherry',          price: 140, breed: 'Golden Puppy' },
  martin:        { key: 'martin',        name: 'Martin',          price: 130, breed: 'Old Tabby' },
  tiger:         { key: 'tiger',         name: 'Tiger',           price: 190, breed: 'Calico Cat' },
  milk:          { key: 'milk',          name: 'Milk',            price: 170, breed: 'White Cat' },
  oreo:          { key: 'oreo',          name: 'Oreo',            price: 170, breed: 'Black Cat' },
  // Always-together pair — one purchase, two cats.
  ebonyandivory: { key: 'ebonyandivory', name: 'Ebony & Ivory',   price: 300, breed: 'Bonded Pair' },
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
  // Potted (stages 1=bud, 2=slight bloom, 3=full bloom)
  daisy:      { 1: 1.0, 2: 1.0, 3: 1.0 },
  snapdragon: { 1: 1.0, 2: 1.0, 3: 1.0 },
  poppy:      { 1: 1.0, 2: 1.0, 3: 1.0 },
  marigold:   { 1: 1.0, 2: 1.0, 3: 1.0 },
  peony:      { 1: 1.0, 2: 1.0, 3: 1.0 },
  hydrenga:   { 1: 1.0, 2: 1.0, 3: 1.0 },
  rose:       { 1: 1.0, 2: 1.0, 3: 1.0 },
  // Hanging (stages 1=bud, 2=full)
  stringofpearls: { 1: 1.0, 2: 1.0 },
  Philodendron:   { 1: 1.0, 2: 1.0 },
  jasmine:        { 1: 1.0, 2: 1.0 },
  petunia:        { 1: 1.0, 2: 1.0 },
  Bougainvillea:  { 1: 1.0, 2: 1.0 },
};

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
  harvestedFlowers: {}, // flowerKey → count, harvested flowers awaiting trade for coins
  ownedPaintings: [],
  ownedPets: [],
  petPlacements: {}, // petKey → room number where the owned pet is currently placed
};

export const ACHIEVEMENTS = [
  { id: 'first_bloom',    title: 'First Bloom',       desc: 'Harvest your first flower.',          check: (s) => s.harvestCount >= 1 },
  { id: 'ten_harvests',   title: 'Green Thumb',        desc: 'Harvest 10 flowers.',                  check: (s) => s.harvestCount >= 10 },
  { id: 'full_slots',     title: 'Garden Full',        desc: 'Fill every slot in a room.',           check: (s) => s._allSlotsFilledOnce },
  { id: 'near_death',     title: 'Back from the Brink',desc: 'Water a nearly-dead plant in time.',  check: (s) => s._savedFromDeath },
  { id: 'room2_unlock',   title: 'Balcony Life',       desc: 'Unlock the Balcony.',                  check: (s) => s.unlockedRooms.includes(2) },
  { id: 'room3_unlock',   title: 'Sunroom Dreams',     desc: 'Unlock the Sunroom.',                  check: (s) => s.unlockedRooms.includes(3) },
];
