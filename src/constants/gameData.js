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


// ── Rare plants ───────────────────────────────────────────────────────────────
// Eight rare shelf plants with only TWO growth stages (bud, then full bloom). Their
// seeds can't be bought: pets bring them home from adventures. They are merged into
// POTTED_FLOWERS (rare: true, maxStage: 2) so the rest of the game treats them as
// shelf flowers; the nursery, Storm's digging and level unlocks skip them.
export const RARE_PLANTS = {
  goldenrose: { key: 'goldenrose', name: 'Golden Rose', hours: 8, base: 70, season: 'summer', blurb: "Every petal glints as if dipped in sunrise. Gardeners whisper that it grows only for the very patient.", tip: "Worth a fortune at the market." },
  moonbell: { key: 'moonbell', name: 'Moonbell', hours: 9, base: 65, season: 'autumn', blurb: "Purple bells that glow softly after dark and chime when the wind is right.", tip: "Looks best on a dark shelf." },
  dreamhydrangea: { key: 'dreamhydrangea', name: 'Dream Hydrangea', hours: 10, base: 75, season: 'summer', blurb: "Pink, lilac and sky-blue blooms all on one plant, like a sweet dream of summer.", tip: "Makes the fanciest bouquets." },
  blushmonstera: { key: 'blushmonstera', name: 'Blush Monstera', hours: 7, base: 60, season: 'spring', blurb: "Leaves painted in pink and cream, each with its own pattern. No two are alike.", tip: "A favourite of the florist customers." },
  midnightlily: { key: 'midnightlily', name: 'Midnight Lily', hours: 11, base: 80, season: 'autumn', blurb: "Dark as night, with gold dust on the stamens. Very rare, and very proud.", tip: "The most valuable rare plant." },
  frostrose: { key: 'frostrose', name: 'Frost Rose', hours: 12, base: 85, season: 'winter', blurb: "A rose that seems carved from ice, cool to the touch even in July.", tip: "The priciest plant in the game." },
  bleedingheart: { key: 'bleedingheart', name: 'Bleeding Heart', hours: 7, base: 55, season: 'spring', blurb: "Little hearts on a long arching stem, ready to fall for whoever waters it.", tip: "Pairs well with pink flowers in a bouquet." },
  ivoryhibiscus: { key: 'ivoryhibiscus', name: 'Ivory Hibiscus', hours: 8, base: 60, season: 'summer', blurb: "Cream petals edged in gold. It opens slowly, as if it knows it is special.", tip: "Calm, steady, and always in demand." },
};
for (const r of Object.values(RARE_PLANTS)) {
  POTTED_FLOWERS[r.key] = { key: r.key, name: r.name, harvestCoins: Math.round(r.base * 0.9), seedPrice: null, rare: true, maxStage: 2 };
}
export const RARE_KEYS = Object.keys(RARE_PLANTS);

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

// ── Pet adventures ────────────────────────────────────────────────────────────
// Send a pet out for `hours`; it comes back with `rolls` rewards (a fed pet gets
// `fedRolls`). A pet that is away doesn't help in the rooms. odds = chance of each
// reward kind per roll (the rest is a flower).
export const ADVENTURE = {
  hours: 4, rolls: 1, fedRolls: 2,
  coins: [25, 60],
  odds: { coins: 0.45, seed: 0.3 },
  rareSeed: 0.12, fedRareSeed: 0.25,   // chance that a seed reward is one of the rare plants
};

// ── Pet food aisle ────────────────────────────────────────────────────────────
// Everything on the shelves is buyable. A "fed" pet gets its perk doubled until
// the food wears off (hours stack up to FED_MAX_HOURS). Nothing bad happens to a
// hungry pet. for = which pets can eat/use it. scope 'one' = you choose a pet,
// 'species' = every owned pet of that kind (litter and pads keep the whole
// household happy).
export const PET_SPECIES = {
  george: 'cat', koazy: 'cat', martin: 'cat', tiger: 'cat', milk: 'cat', oreo: 'cat', ebonyandivory: 'cat',
  storm: 'dog', brownie: 'dog', aki: 'dog', cherry: 'dog',
};
export const FED_BOOST = 2;        // perk strength while fed
export const FED_MAX_HOURS = 72;
export const PET_FOOD = [
  // bagged food
  { key: 'dogfood',    name: 'Dog Food',        price: 30, hours: 24, for: 'dog', scope: 'one' },
  { key: 'catfood',    name: 'Cat Food',        price: 30, hours: 24, for: 'cat', scope: 'one' },
  { key: 'puppyfood',  name: 'Puppy Food',      price: 40, hours: 30, for: 'dog', scope: 'one' },
  { key: 'kittenfood', name: 'Kitten Food',     price: 40, hours: 30, for: 'cat', scope: 'one' },
  { key: 'grainfree',  name: 'Grain Free',      price: 60, hours: 36, for: 'dog', scope: 'one' },
  { key: 'seniorcare', name: 'Senior Care',     price: 60, hours: 36, for: 'any', scope: 'one' },
  // tins and treats
  { key: 'wetcat',     name: 'Wet Food (Cat)',  price: 20, hours: 12, for: 'cat', scope: 'one' },
  { key: 'wetdog',     name: 'Wet Food (Dog)',  price: 20, hours: 12, for: 'dog', scope: 'one' },
  { key: 'biscuits',   name: 'Biscuits',        price: 12, hours: 8,  for: 'dog', scope: 'one' },
  { key: 'treats',     name: 'Cat Treats',      price: 12, hours: 8,  for: 'cat', scope: 'one' },
  { key: 'dental',     name: 'Dental Treats',   price: 25, hours: 16, for: 'any', scope: 'one' },
  { key: 'training',   name: 'Training Treats', price: 25, hours: 16, for: 'dog', scope: 'one' },
  // litter, pads and grooming
  { key: 'catlitter',  name: 'Cat Litter',      price: 35, hours: 24, for: 'cat', scope: 'species' },
  { key: 'puppypads',  name: 'Puppy Pads',      price: 35, hours: 24, for: 'dog', scope: 'species' },
  { key: 'wipes',      name: 'Pet Wipes',       price: 15, hours: 12, for: 'any', scope: 'one' },
  { key: 'deodoriser', name: 'Deodoriser Spray', price: 22, hours: 18, for: 'any', scope: 'one' },
  { key: 'shampoo',    name: 'Pet Shampoo',     price: 30, hours: 24, for: 'any', scope: 'one' },
];

// ── Strays at the Foster Center ───────────────────────────────────────────────
// Customers find strays and bring them to the pet shop's Foster Center. The seniors
// (senior: true) are older animals looking for a quiet home. Each one
// takes an empty seat (FOSTER_SEATS) until you adopt it; adopting works like any
// other pet (they're added to PETS below). New strays turn up every STRAY_MS while
// there is a free seat, up to STRAY_MAX at a time. aspect = image width / height,
// fw = how wide it sits on the foster picture (px of the 1020×571 art).
export const STRAY_MS = 8 * 3600000;
export const STRAY_MAX = 5;                  // at most this many wait at once, so there are always empty seats
export const FOSTER_BASE_W = 1020;          // pet widths (fw) are measured against a screen this wide
export const FOSTER_SIZE = { w: 1677, h: 938 }; // size of the foster centre picture
// Feet position of a pet sitting on each seat (px of the 1677×938 picture).
export const FOSTER_SEATS = [
  { id: 'cubbyL',    x: 200,  y: 655, scale: 0.7, max: 62 },
  { id: 'cubbyR',    x: 440,  y: 560, scale: 0.6, max: 56 },
  { id: 'bench',     x: 400,  y: 458, scale: 0.9, max: 92 },
  { id: 'greenBed',  x: 500,  y: 655, scale: 1.1 },
  { id: 'treeHouse', x: 842,  y: 590, scale: 0.7, max: 66 },
  { id: 'greenDog',  x: 1170, y: 628, scale: 1.1 },
  { id: 'flowerL',   x: 200,  y: 810, scale: 1.3 },
  { id: 'flowerR',   x: 1500, y: 685, scale: 1.2 },
  { id: 'pinkBed',   x: 1470, y: 845, scale: 1.2 },
  { id: 'pawRug',    x: 850,  y: 810, scale: 1.2 },
  { id: 'playpen',   x: 1285, y: 520, scale: 0.7, max: 72 },
];
// A pet only sits where it fits: its width on that seat must not pass the seat's `max` (seats with
// no max take anything, so big pets end up on the rug and beds).
export function strayFits(stray, seat) {
  if (!seat.max) return true;
  const w = (stray.restFw ?? stray.fw) * seat.scale;
  return w <= seat.max;
}
export const STRAYS = {
  biscuit:   { key: 'biscuit',   name: 'Biscuit',   breed: 'Shih Tzu',      species: 'dog',    price: 120, aspect: 300 / 262, fw: 120, restAspect: 300 / 155, restFw: 150,
    found: (n) => `${n} found Biscuit dozing under a park bench, far too sleepy to be scared.`,
    effect: { title: 'Sleepy Guard', desc: 'Plants in its room take 1.5x as long to wilt.', room: { wiltMult: 1.5 } } },
  marmalade: { key: 'marmalade', name: 'Marmalade', breed: 'Ginger Kitten', species: 'cat',    price: 110, aspect: 280 / 300, fw: 80,
    found: (n) => `${n} heard a tiny mew from a flowerpot behind the bakery.`,
    effect: { title: 'Pounce', desc: 'Sometimes catches bugs in its room for you.', room: { autoCatch: 0.1 } } },
  honey:     { key: 'honey',     name: 'Honey',     breed: 'Fluffy Kitten', species: 'cat',    price: 130, aspect: 289 / 300, fw: 85,
    found: (n) => `${n} noticed a fluffy kitten watching the shop window every single morning.`,
    effect: { title: 'Window Watcher', desc: 'Plants in its room are ready to water 10% sooner.', room: { cooldownMult: 0.9 } } },
  soot:      { key: 'soot',      name: 'Soot',      breed: 'Black Pup',     species: 'dog',    price: 140, aspect: 300 / 271, fw: 120,
    found: (n) => `${n} met a very muddy puppy who took a bow and would not stop wagging.`,
    effect: { title: 'Treasure Sniffer', desc: 'Brings you 8–18 coins once a day.', daily: { coins: [8, 18] } } },
  cloud:     { key: 'cloud',     name: 'Cloud',     breed: 'Bichon',        species: 'dog',    price: 150, aspect: 299 / 300, fw: 105,
    found: (n) => `${n} found a little cloud of fluff waiting by the florist's door.`,
    effect: { title: 'Fluffy Charm', desc: 'Bouquets sell for 10% more.', global: { bouquetMult: 1.1 } } },
  smoky:     { key: 'smoky',     name: 'Smoky',     breed: 'Grey Kitten',   species: 'cat',    price: 120, aspect: 300 / 175, fw: 120, asleep: true,
    found: (n) => `${n} carried a grey kitten home, and it fell asleep before they got there.`,
    effect: { title: 'Cosy Purr', desc: 'Plants in its room are ready to water 10% sooner.', room: { cooldownMult: 0.9 } } },
  maple:     { key: 'maple',     name: 'Maple',     breed: 'Shiba Pup',     species: 'dog',    price: 170, aspect: 244 / 300, fw: 95,
    found: (n) => `${n} met a fox-faced pup begging, very politely, outside the market.`,
    effect: { title: 'Show-Off', desc: 'Hanging plants in its room earn 1.5x coins.', room: { hangingCoinMult: 1.5 } } },
  clover:    { key: 'clover',    name: 'Clover',    breed: 'Rabbit',        species: 'rabbit', price: 130, aspect: 265 / 300, fw: 85,
    found: (n) => `${n} found a rabbit nibbling the clover by the garden gate.`,
    effect: { title: 'Lucky Foot', desc: 'Harvests in its room have a 15% chance of an extra flower.', room: { harvestLuck: 0.15 } } },
  pudding:   { key: 'pudding',   name: 'Pudding',   breed: 'Senior Spaniel',   species: 'dog', price: 90,  aspect: 300 / 132, fw: 150, senior: true,
    found: (n) => `${n} found Pudding waiting patiently at the bus stop, greying around the muzzle and in no hurry at all.`,
    effect: { title: 'Gentle Soul', desc: 'Bugs are 30% less likely in its room.', room: { pestChance: 0.7 } } },
  whisper:   { key: 'whisper',   name: 'Whisper',   breed: 'Senior Longhair',  species: 'cat', price: 100, aspect: 300 / 144, fw: 150, senior: true,
    found: (n) => `${n} met an old longhaired cat who had clearly seen everything and was still unimpressed.`,
    effect: { title: 'Old Wisdom', desc: 'Plants in its room take 1.75x as long to wilt.', room: { wiltMult: 1.75 } } },
  inky:      { key: 'inky',      name: 'Inky',      breed: 'Senior Tuxedo Cat', species: 'cat', price: 110, aspect: 300 / 141, fw: 140, asleep: true, senior: true,
    found: (n) => `${n} found Inky snoozing in a shop doorway, a tuxedo cat who had long ago earned a good nap.`,
    effect: { title: 'Night Prowler', desc: 'Sometimes catches bugs in its room for you.', room: { autoCatch: 0.15 } } },
  mocha:     { key: 'mocha',     name: 'Mocha',     breed: 'Poodle Pup',       species: 'dog', price: 150, aspect: 300 / 193, fw: 105,
    found: (n) => `${n} was greeted by a chocolate-brown pup who grinned the whole way to the shop.`,
    effect: { title: 'Happy Helper', desc: 'Shooing bugs in its room pays 1.5x.', room: { pestRewardMult: 1.5 } } },
};
export const STRAY_KEYS = Object.keys(STRAYS);
for (const [k, st] of Object.entries(STRAYS)) {
  PETS[k] = { key: k, name: st.name, price: st.price, breed: st.breed, stray: true, effect: st.effect };
  PET_SPECIES[k] = st.species;
}

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
  // rare plants (see RARE_PLANTS)
  goldenrose: { hours: 8 },
  moonbell: { hours: 9 },
  dreamhydrangea: { hours: 10 },
  blushmonstera: { hours: 7 },
  midnightlily: { hours: 11 },
  frostrose: { hours: 12 },
  bleedingheart: { hours: 7 },
  ivoryhibiscus: { hours: 8 },

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
  // rare plants: pot-rim width / image width measured from each cut-out
  goldenrose: { 1: 1.73, 2: 1.94 },
  moonbell: { 1: 1.65, 2: 1.83 },
  dreamhydrangea: { 1: 1.86, 2: 2.07 },
  blushmonstera: { 1: 1.77, 2: 1.89 },
  midnightlily: { 1: 1.83, 2: 1.85 },
  frostrose: { 1: 1.87, 2: 1.66 },
  bleedingheart: { 1: 1.87, 2: 1.93 },
  ivoryhibiscus: { 1: 1.81, 2: 1.93 },

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
for (const r of Object.values(RARE_PLANTS)) {
  TRADE_FLOWERS[r.key] = { key: r.key, name: r.name, img: `${r.key}trade`, base: r.base, rare: true };
}

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

  // Shuffle the 12 everyday keys, take 6. On about 2 days in 5 a collector visits:
  // the last tile is a rare plant (which one is picked by the day) at a high price.
  const keys = Object.keys(TRADE_FLOWERS).filter((k) => !TRADE_FLOWERS[k].rare);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  const picks = keys.slice(0, 6);
  if (rand() < 0.4) picks[5] = RARE_KEYS[Math.floor(rand() * RARE_KEYS.length)];
  return picks.map((key) => {
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
  apartmentItems: {},  // aptId → [{ id, key, kind, x, y }] decor placed in each flat (x,y are fractions of the room picture)
  ownedApartments: [], // apartment ids you have bought (see APARTMENTS)
  ownedPets: [],
  petNames: {},      // petKey → custom name chosen at adoption
  petPlacements: {}, // petKey → room number where the owned pet is currently placed
  flowerBook: {},    // flowerKey → { grown, firstAt } — page unlocks on first full bloom
  pestsCleared: 0,
  xp: 0,             // total experience — level is derived (see levelInfo)
  customers: null,   // { day, list: [orders] } — today's florist orders (engine/customers)
  customersServed: 0,
  customerBook: {},  // customerKey → { served, firstAt } — who you've met at the florist
  remedies: { balm: 0, sachet: 0 },  // herbalist remedies in the bag
  herbalistDay: null,                // day key of the last free daily balm
  bouquetBook: {},   // recipeId → { made, firstAt } — secret bouquet recipes found
  bouquetsSold: 0,
  petGifts: {},      // petKey → day key of the last daily gift
  strays: [],        // strays waiting at the Foster Center: { key, finder, seat, at }
  lastStrayAt: null, // when the last stray arrived (null = none yet, the first comes straight away)
  petFound: {},      // adopted stray key -> customer who found it
  adventures: {},    // petKey -> { startedAt, endsAt, fed } while a pet is out exploring
  petCare: {},       // petKey → time (ms) its food wears off; fed pets get a stronger perk
};

// ── Garden journal ───────────────────────────────────────────────────────────────
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

// Rare plants' pages in the journal (their own chapter).
export const RARE_BOOK = Object.values(RARE_PLANTS).map((r) => ({ key: r.key, season: r.season, blurb: r.blurb, tip: r.tip, rare: true }));

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
// Ribbons on the tray, by key (the same keys the bouquet table uses).
export const RIBBON_NAMES = {
  ribbonRed: 'red', ribbonPink: 'pink', ribbonCream: 'cream',
  ribbonPinkFloral: 'pink flowered', ribbonGreen: 'green', ribbonCreamFloral: 'cream flowered',
};
export const RIBBON_KEYS = Object.keys(RIBBON_NAMES);

// How well a made bouquet matches a customer's order: they ask for a flower, a paper and a
// ribbon. Both right = a perfect order (tip x1.5), one right = the full tip, none right
// = a small tip (x0.4). Older saved orders with no paper/ribbon count as matching.
export function orderGrade(order, paper, ribbon) {
  // (an order for a paper that no longer exists, e.g. the old Fancy, counts as matching)
  const paperOk = !order?.paper || !BOUQUET_PAPERS[order.paper] || order.paper === paper;
  const ribbonOk = !order?.ribbon || order.ribbon === ribbon;
  const hits = (paperOk ? 1 : 0) + (ribbonOk ? 1 : 0);
  const asked = (order?.paper && BOUQUET_PAPERS[order.paper] ? 1 : 0) + (order?.ribbon ? 1 : 0);
  const perfect = asked > 0 && hits === asked;
  const mult = asked === 0 ? 1 : perfect ? 1.5 : hits > 0 ? 1 : 0.4;
  return { paperOk, ribbonOk, perfect, mult, label: asked === 0 ? '' : perfect ? 'Perfect order!' : hits > 0 ? 'Close enough' : 'Not what I asked for...' };
}

export const BOUQUET_SIZE = 3;
export const BOUQUET_MIXED = { name: 'Mixed Bouquet', multiplier: 1.1 };
export const BOUQUET_TRIO = { multiplier: 1.3 }; // 3 of the same flower
// Secret recipes (order doesn't matter). Found ones are recorded in the book;
// unfound ones show only their hint.
// The nine flowers that go into bouquets (one bucket each on the bouquet table). Every other
// flower is still grown and sold, just not used here.
export const BOUQUET_FLOWERS = ['daisy', 'rose', 'peony', 'marigold', 'snapdragon', 'poppy', 'hydrenga', 'jasmine', 'petunia'];

export const BOUQUET_RECIPES = [
  { id: 'sweetheart', name: 'Sweetheart',     flowers: ['rose', 'rose', 'peony'],          multiplier: 1.8, hint: 'Something for someone you love.' },
  { id: 'sunshine',   name: 'Sunshine',       flowers: ['daisy', 'marigold', 'poppy'],     multiplier: 1.6, hint: 'Three flowers as warm as the sun.' },
  { id: 'cottage',    name: 'Cottage Garden', flowers: ['snapdragon', 'daisy', 'peony'],   multiplier: 1.6, hint: 'Picked from a little garden by a country cottage.' },
  { id: 'summer',     name: 'Summer Breeze',  flowers: ['hydrenga', 'poppy', 'rose'],      multiplier: 1.7, hint: 'Three summer bloomers together.' },
  { id: 'harvest',    name: 'Harvest Moon',   flowers: ['marigold', 'marigold', 'snapdragon'], multiplier: 1.6, hint: 'Golden autumn colours under the moon.' },
  { id: 'wedding',    name: 'Wedding Day',    flowers: ['rose', 'peony', 'hydrenga'],      multiplier: 2.0, hint: 'The grandest flowers for the biggest day.' },
  { id: 'cascade',    name: 'Garden Cascade', flowers: ['jasmine', 'petunia', 'snapdragon'],       multiplier: 1.8, hint: 'Everything that spills over the edge of a pot.' },
  { id: 'trailing',   name: 'Evening Garden', flowers: ['jasmine', 'petunia', 'peony'],               multiplier: 1.6, hint: 'Soft blooms that smell sweetest at dusk.' },
  { id: 'meadow',     name: 'Wild Meadow',    flowers: ['daisy', 'poppy', 'petunia'],                 multiplier: 1.6, hint: 'A little of the ground, a little of the sky.' },
];

// Wrapping papers — each fancier than the last, with a value bonus. A sheet is
// used up every time you tie a bouquet, so it costs `cost` coins each time:
// worth it on a valuable bouquet (e.g. +12 on a 110-coin Sweetheart for 6), a
// loss on a cheap one (+4 on a 38-coin mixed bunch for 6).
export const BOUQUET_PAPERS = {
  plain:   { id: 'plain',   name: 'Kraft',   bonus: 1.0, cost: 0,  level: 1 },
  layered: { id: 'layered', name: 'Layered', bonus: 1.1, cost: 6,  level: 3 },
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
    bio: "Always has a book in her bag and a plan for one more cosy corner.",
    look: { skin: '#f1c9a0', hair: '#8a3a1c', outfit: '#7a8a46' },
    likes: ['rose', 'peony', 'petunia'],
    askFlowers: "I'm decorating my reading nook! Could I have {qty} {flower}?",
    askBouquet: "A bouquet for my best friend's birthday, please. It must have {flower} in it.",
    thanks: "Oh, they're gorgeous! Thank you!",
  },
  theo: {
    key: 'theo', name: 'Theo', desc: 'Curly-haired student in a green hoodie and brown trousers, flower tote bag.',
    bio: "A student with a very small flat and very big plans for it.",
    look: { skin: '#f0c49a', hair: '#3a2416', outfit: '#3f6a3a' },
    likes: ['daisy', 'snapdragon', 'poppy'],
    askFlowers: 'My flat is so dull. Could I get {qty} {flower}, please?',
    askBouquet: "It's for my sister's graduation! A bouquet with {flower} in it?",
    thanks: "Nice one! She's going to love these.",
  },
  iris: {
    key: 'iris', name: 'Iris', desc: 'Woman with a messy bun, cream cardigan, lilac floral skirt, brown satchel.',
    bio: "Hosts the best tea parties in town and never forgets a favourite.",
    look: { skin: '#eebf94', hair: '#3a2a22', outfit: '#a98bd0' },
    likes: ['hydrenga', 'jasmine', 'petunia'],
    askFlowers: "I'm hosting a tea party! Might I have {qty} {flower}?",
    askBouquet: 'A pretty centrepiece for the tea table, with {flower} in it.',
    thanks: 'Perfect! Do stay for a cup.',
  },
  posy: {
    key: 'posy', name: 'Posy', desc: 'Small laughing girl in a pink dress with a daisy in her wavy brown hair.',
    bio: "Collects flowers for crowns, secrets and shiny pebbles.",
    look: { skin: '#f4cfa8', hair: '#7a4a2a', outfit: '#f2a0b8' },
    likes: ['daisy', 'poppy', 'marigold'],
    askFlowers: 'Can I have {qty} {flower}? I want to make a flower crown!',
    askBouquet: "A bouquet with {flower}, please! It's for my teacher!",
    thanks: 'Yay yay yay! Thank you!',
  },
  walt: {
    key: 'walt', name: 'Grandpa Walt', desc: 'Old man in a flat cap, round glasses, white moustache, brown tweed jacket, walking cane.',
    bio: "Grew prize marigolds for forty years. He will tell you all about them.",
    look: { skin: '#f0c9a6', hair: '#d8d8d8', outfit: '#7a5a2a' },
    likes: ['marigold', 'rose', 'snapdragon'],
    askFlowers: 'Back in my day I grew these myself. {qty} {flower}, if you please.',
    askBouquet: "For my wife's birthday. A bouquet with {flower}; she's always liked those.",
    thanks: "She'll smile at that. Thank you, young one.",
  },
  finn: {
    key: 'finn', name: 'Finn', desc: 'Boy in a beige cap, brown overalls and green sneakers, mid-stride, big grin.',
    bio: "Runs everywhere, saves every coin, and loves his mum's garden.",
    look: { skin: '#f2c8a0', hair: '#6a4426', outfit: '#7a4a24' },
    likes: ['poppy', 'marigold', 'daisy'],
    askFlowers: "My mum's garden needs help! Do you have {qty} {flower}?",
    askBouquet: 'A bouquet with {flower} for my mum! I saved up!',
    thanks: "Thanks! She's gonna love it!",
  },
  marisol: {
    key: 'marisol', name: 'Marisol', desc: 'Woman with long curly auburn hair, gold hoops, black top, wide blue jeans, black satchel.',
    bio: "A photographer who sees a perfect picture in every petal.",
    look: { skin: '#e8b48a', hair: '#9a3a1c', outfit: '#6a90b8' },
    likes: ['Bougainvillea', 'petunia', 'poppy'],
    askFlowers: "I'm styling a photoshoot. {qty} {flower}, and quickly!",
    askBouquet: 'For a photoshoot: a bouquet with {flower} in it, please.',
    thanks: 'Gorgeous. The camera will love these.',
  },
  ben: {
    key: 'ben', name: 'Gardener Ben', desc: 'Bearded man with glasses and messy hair, cream shirt, green apron with brass buttons.',
    bio: "Looks after the town greenhouse and knows every plant by first name.",
    look: { skin: '#eebf94', hair: '#4a3020', outfit: '#3d5a2a' },
    likes: ['stringofpearls', 'Philodendron', 'snapdragon'],
    askFlowers: 'My greenhouse is short of a few things. {qty} {flower}, please?',
    askBouquet: 'A bouquet with {flower} for the garden club raffle.',
    thanks: 'Smashing. The club will love them.',
  },
  nori: {
    key: 'nori', name: 'Nori', desc: 'Girl with long black hair, white bow and headphones, cream sweater, olive cargo trousers, tote bag.',
    bio: "Studies with headphones on and has a plant on every shelf.",
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


// The pets the book shows: the shop's pets, plus any stray you've met (at the
// Foster Center now, or already adopted). Unmet strays stay a surprise.
export function knownPetKeys(player) {
  const met = new Set([...(player.ownedPets ?? []), ...(player.strays ?? []).map((s) => s.key)]);
  return Object.keys(PETS).filter((k) => !PETS[k].stray || met.has(k));
}

// The apartment building: three floors, each flat bigger than the one below.
export const APARTMENTS = {
  1: { name: 'Little Green Door', floor: 'Ground floor', price: 300,  size: 'Cosy studio' },
  2: { name: 'Cream Arch',        floor: 'First floor',  price: 900,  size: 'Two rooms' },
  3: { name: 'Grand Suite',       floor: 'Top floor',    price: 2500, size: 'Three rooms and a balcony' },
};
