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
  room1: ['green', 'pink', 'white'],
  room2: ['pink', 'white'],
  room3: ['white'],
};

export const ROOM_UNLOCK_COSTS = {
  2: 500,
  3: 1500,
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
  persiancat:  { key: 'persiancat',  name: 'Persian Cat',  price: 100 },
  puppybeagle: { key: 'puppybeagle', name: 'Puppy Beagle', price: 100 },
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
  coins: 50,
  unlockedRooms: [1],
  currentRoom: 1,
  wallColor: { room1: 'green', room2: 'pink', room3: 'white' },
  inventory: {},
  placedDecor: {
    room2: { photoFrame: null, pet: null },
  },
  achievements: [],
  harvestCount: 0,
  ownedPaintings: [],
  ownedPets: [],
};

export const ACHIEVEMENTS = [
  { id: 'first_bloom',    title: 'First Bloom',       desc: 'Harvest your first flower.',          check: (s) => s.harvestCount >= 1 },
  { id: 'ten_harvests',   title: 'Green Thumb',        desc: 'Harvest 10 flowers.',                  check: (s) => s.harvestCount >= 10 },
  { id: 'full_slots',     title: 'Garden Full',        desc: 'Fill every slot in a room.',           check: (s) => s._allSlotsFilledOnce },
  { id: 'near_death',     title: 'Back from the Brink',desc: 'Water a nearly-dead plant in time.',  check: (s) => s._savedFromDeath },
  { id: 'room2_unlock',   title: 'Balcony Life',       desc: 'Unlock the Balcony.',                  check: (s) => s.unlockedRooms.includes(2) },
  { id: 'room3_unlock',   title: 'Sunroom Dreams',     desc: 'Unlock the Sunroom.',                  check: (s) => s.unlockedRooms.includes(3) },
];
