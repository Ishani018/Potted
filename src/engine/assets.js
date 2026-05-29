// ─── Backgrounds ────────────────────────────────────────────────────────────
export const BACKGROUNDS = {
  room1: {
    green: {
      spring: require('../../room1/green/spring.jpeg'),
      summer: require('../../room1/green/summer.jpeg'),
      autumn: require('../../room1/green/autumn.jpeg'),
      winter: require('../../room1/green/winter.jpeg'),
    },
    pink: {
      spring: require('../../room1/pink/spring.jpeg'),
      summer: require('../../room1/pink/summer.jpeg'),
      autumn: require('../../room1/pink/autumn.jpeg'),
      winter: require('../../room1/pink/winter.jpeg'),
    },
    white: {
      spring: require('../../room1/white/spring.jpeg'),
      summer: require('../../room1/white/summer.jpeg'),
      autumn: require('../../room1/white/autumn.jpeg'),
      winter: require('../../room1/white/winter.jpeg'),
    },
  },
  room2: {
    pink: {
      spring: require('../../room2/pink/spring.jpeg'),
      summer: require('../../room2/pink/summer.jpeg'),
      autumn: require('../../room2/pink/autumn.jpeg'),
      winter: require('../../room2/pink/winter.jpeg'),
    },
    white: {
      spring: require('../../room2/white/spring.jpeg'),
      summer: require('../../room2/white/summer.jpeg'),
      autumn: require('../../room2/white/autumn.jpeg'),
      winter: require('../../room2/white/winter.jpeg'),
    },
  },
  room3: {
    white: {
      spring: require('../../room3/white/spring.jpeg'),
      summer: require('../../room3/white/summer.jpeg'),
      autumn: require('../../room3/white/summer.jpeg'), // placeholder
      winter: require('../../room3/white/winter.jpeg'),
    },
  },
};

// ─── Potted Plants ───────────────────────────────────────────────────────────
// stage 0 = potwithseed (shared), 1-3 = growth stages, 4 = dead (marigold3)
export const POTTED_PLANT_IMAGES = {
  _seed:   require('../../pottedplants/potwithseed.png'),
  _dead:   require('../../pottedplants/marigold3.png'),

  daisy:      [require('../../pottedplants/daisy.png'),      require('../../pottedplants/daisy1.png'),      require('../../pottedplants/daisy2.png'),      require('../../pottedplants/daisy3.png')],
  snapdragon: [require('../../pottedplants/snapdragon.png'), require('../../pottedplants/snapdragon1.png'), require('../../pottedplants/snapdragon2.png'), require('../../pottedplants/snapdragon3.png')],
  poppy:      [require('../../pottedplants/poppy.png'),      require('../../pottedplants/poppy1.png'),      require('../../pottedplants/poppy2.png'),      require('../../pottedplants/poppy3.png')],
  marigold:   [require('../../pottedplants/marigold.png'),   require('../../pottedplants/marigold1.png'),   require('../../pottedplants/marigold2.png'),   require('../../pottedplants/marigold3.png')],
  peony:      [require('../../pottedplants/peony.png'),      require('../../pottedplants/peony1.png'),      require('../../pottedplants/peony2.png'),      require('../../pottedplants/peony3.png')],
  hydrenga:   [require('../../pottedplants/hydrenga.png'),   require('../../pottedplants/hydrenga1.png'),   require('../../pottedplants/hydrenga2.png'),   require('../../pottedplants/hydrenga3.png')],
  rose:       [require('../../pottedplants/rose.png'),       require('../../pottedplants/rose1.png'),       require('../../pottedplants/rose2.png'),       require('../../pottedplants/rose3.png')],
};

// ─── Hanging Plants ──────────────────────────────────────────────────────────
// stage 0 = emptyhangingpotwithseed, 1 = bud, 2 = full, 3 = dead
export const HANGING_PLANT_IMAGES = {
  _seed: require('../../hangingplants/emptyhangingpotwithseed.png'),

  stringofpearls: [require('../../hangingplants/stringofpearls.png'),  require('../../hangingplants/stringofpearls1.png'),  require('../../hangingplants/stringofpearls2.png')],
  Philodendron:   [require('../../hangingplants/Philodendron.png'),    require('../../hangingplants/Philodendron1 .png'),   require('../../hangingplants/Philodendron2.png')],
  jasmine:        [require('../../hangingplants/jasmine.png'),         require('../../hangingplants/jasmine1.png'),         require('../../hangingplants/jasmine2.png')],
  petunia:        [require('../../hangingplants/petunia.png'),         require('../../hangingplants/petunia1.png'),         require('../../hangingplants/petunia2.png')],
  Bougainvillea:  [require('../../hangingplants/Bougainvillea.png'),   require('../../hangingplants/Bougainvillea1.png'),   require('../../hangingplants/Bougainvillea2.png')],
};

// ─── Seeds ───────────────────────────────────────────────────────────────────
export const SEED_IMAGES = {
  daisy:      require('../../seeds/daisyseed.png'),
  snapdragon: require('../../seeds/snapdragonseed.png'),
  poppy:      require('../../seeds/poppyseed.png'),
  marigold:   require('../../seeds/marigoldseed.png'),
  peony:      require('../../seeds/peonyseed.png'),
  hydrenga:   require('../../seeds/hydrengaseed.png'),
  rose:       require('../../seeds/roseseed.png'),
  // hanging seeds reuse potted seed bags
  stringofpearls: require('../../seeds/daisyseed.png'),
  Philodendron:   require('../../seeds/hydrengaseed.png'),
  jasmine:        require('../../seeds/roseseed.png'),
  petunia:        require('../../seeds/peonyseed.png'),
  Bougainvillea:  require('../../seeds/marigoldseed.png'),
};

// ─── Wall Decor ──────────────────────────────────────────────────────────────
export const PAINTING_IMAGES = {
  beachpainting:         require('../../walldecor/beachpainting.png'),
  campfirepainting:      require('../../walldecor/campfirepainting.png'),
  sleepingpuppypainting: require('../../walldecor/sleepingpuppypainting.png'),
  tabbycatpainting:      require('../../walldecor/tabbycatpainting.png'),
  weddingpainting:       require('../../walldecor/weddingpainting.png'),
  womanportraitpainting: require('../../walldecor/womanportraitpainting.png'),
};

// ─── Pets ────────────────────────────────────────────────────────────────────
export const PET_IMAGES = {
  persiancat:  require('../../pets/persiancat.png'),
  puppybeagle: require('../../pets/puppybeagle.png'),
};

// ─── UI ──────────────────────────────────────────────────────────────────────
export const UI_IMAGES = {
  nurseryshop:   require('../../ui_comps/nurseryshop.png'),
  hangingplants: require('../../ui_comps/hangingplants.png'),
  pottedplants:  require('../../ui_comps/pottedplants.png'),
  wateringcan1:  require('../../wateringcan1.png'),
  wateringcan2:  require('../../wateringcan2.png'),
};
