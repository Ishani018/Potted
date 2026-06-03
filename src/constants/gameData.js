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
};

export const PETS = {
  george:  { key: 'george',  name: 'George',  price: 150, breed: 'Tabby Cat' },
  storm:   { key: 'storm',   name: 'Storm',   price: 200, breed: 'Husky' },
  koazy:   { key: 'koazy',   name: 'Koazy',   price: 180, breed: 'Ragdoll Cat' },
  brownie: { key: 'brownie', name: 'Brownie', price: 160, breed: 'Pomeranian' },
  aki:     { key: 'aki',     name: 'Aki',     price: 220, breed: 'Akita' },
  cherry:  { key: 'cherry',  name: 'Cherry',  price: 140, breed: 'Golden Puppy' },
  martin:  { key: 'martin',  name: 'Martin',  price: 130, breed: 'Old Tabby' },
  ebony:   { key: 'ebony',   name: 'Ebony',   price: 170, breed: 'Black Cat' },
  ivory:   { key: 'ivory',   name: 'Ivory',   price: 170, breed: 'White Cat' },
  tiger:   { key: 'tiger',   name: 'Tiger',   price: 190, breed: 'Calico Cat' },
};

// ── Pre-determined pet positions per room (fractions of screen, 0–1) ──────────
// A pet shows at its room's spot only when the player has PLACED it in that room
// (player.petPlacements[petKey] === roomNumber). Estimated from reference art;
// tune x/y per pet. baseW = display width as a fraction of screen width.
export const PET_BASE_W = 0.10; // default sprite width fraction
export const PET_POSITIONS = {
  1: {
    storm:   { x: 0.07, y: 0.88 },  // husky, floor far left
    george:  { x: 0.14, y: 0.82 },  // tabby, floor left
    aki:     { x: 0.30, y: 0.90 },  // shiba puppy, floor
    ivory:   { x: 0.40, y: 0.80 },  // white cat reaching, center
    koazy:   { x: 0.52, y: 0.90 },  // ragdoll sleeping, rug
    brownie: { x: 0.64, y: 0.88 },  // pomeranian, rug right
    martin:  { x: 0.47, y: 0.62 },  // calico, on potting bench
    cherry:  { x: 0.80, y: 0.90 },  // golden puppy, floor right
    ebony:   { x: 0.92, y: 0.88 },  // black cat, floor far right
    tiger:   { x: 0.85, y: 0.20 },  // orange tabby, right shelf top
  },
  2: {
    storm:   { x: 0.06, y: 0.86 },
    george:  { x: 0.14, y: 0.80 },
    ebony:   { x: 0.24, y: 0.90 },  // black cat lying, floor
    aki:     { x: 0.34, y: 0.84 },
    brownie: { x: 0.45, y: 0.86 },
    martin:  { x: 0.56, y: 0.82 },  // tabby kitten
    ivory:   { x: 0.44, y: 0.34 },  // white cat reaching, wall
    koazy:   { x: 0.74, y: 0.84 },  // ragdoll sleeping
    cherry:  { x: 0.66, y: 0.90 },  // golden puppy
    tiger:   { x: 0.93, y: 0.92 },  // calico, bottom right
  },
  3: {
    martin:  { x: 0.13, y: 0.30 },  // calico, windowsill left
    koazy:   { x: 0.27, y: 0.28 },  // ragdoll, windowsill
    george:  { x: 0.42, y: 0.20 },  // tabby, windowsill center
    ebony:   { x: 0.56, y: 0.28 },  // black cat, windowsill
    ivory:   { x: 0.66, y: 0.24 },  // white cat reaching, windowsill
    tiger:   { x: 0.13, y: 0.50 },  // tabby kitten, mid-shelf
    aki:     { x: 0.40, y: 0.92 },  // shiba, floor
    cherry:  { x: 0.28, y: 0.90 },  // golden puppy sleeping, floor
    storm:   { x: 0.66, y: 0.84 },  // husky, floor
    brownie: { x: 0.86, y: 0.84 },  // pomeranian, floor right
  },
};

// Growth timers in milliseconds
export const GROWTH_TIMERS = {
  potted: {
    seedToBud:          4  * 60 * 60 * 1000,
    budToSlightBloom:   6  * 60 * 60 * 1000,
    slightBloomToBloom: 8  * 60 * 60 * 1000,
    bloomDeathTime:     4  * 60 * 60 * 1000,
  },
  hanging: {
    budToFull: 8 * 60 * 60 * 1000,
  },
  deathIfNotWatered: 12 * 60 * 60 * 1000,
  hangingPassiveCoins: { amount: 2, interval: 6 * 60 * 60 * 1000 },
};

export const BONUS_COIN_MULTIPLIER = 1.2;

// Stages
// Potted: 0=seed, 1=bud, 2=slight bloom, 3=bloom, 4=dead
// Hanging: 0=seed, 1=bud, 2=full, 3=dead

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
