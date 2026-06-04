export const MAIN_BG = require('../../assets/ui_comps/mainscreen.jpeg');
export const GAME_MUSIC = require('../../assets/Sunlight_on_the_Sprouts.mp3');

// ─── Backgrounds ────────────────────────────────────────────────────────────
export const BACKGROUNDS = {
  room1: {
    white: {
      spring: require('../../assets/room1/white/spring.jpeg'),
      summer: require('../../assets/room1/white/summer.jpeg'),
      autumn: require('../../assets/room1/white/autumn.jpeg'),
      winter: require('../../assets/room1/white/winter.jpeg'),
    },
  },
  room2: {
    white: {
      spring: require('../../assets/room2/white/spring.jpeg'),
      summer: require('../../assets/room2/white/summer.jpeg'),
      autumn: require('../../assets/room2/white/autumn.jpeg'),
      winter: require('../../assets/room2/white/winter.jpeg'),
    },
  },
  room3: {
    white: {
      spring: require('../../assets/room3/white/spring.jpeg'),
      summer: require('../../assets/room3/white/summer.jpeg'),
      autumn: require('../../assets/room3/white/summer.jpeg'), // placeholder
      winter: require('../../assets/room3/white/winter.jpeg'),
    },
  },
};

// ─── Potted Plants ───────────────────────────────────────────────────────────
// stage 0 = potwithseed (shared), 1-3 = growth stages, 4 = dead (marigold3)
export const POTTED_PLANT_IMAGES = {
  _seed:        require('../../assets/pottedplants/potwithseed.png'),
  _seedVisible: require('../../assets/pottedplants/potwithseedvisible.png'),
  _dead:   require('../../assets/pottedplants/marigold3.png'),

  daisy:      [require('../../assets/pottedplants/daisy.png'),      require('../../assets/pottedplants/daisy1.png'),      require('../../assets/pottedplants/daisy2.png'),      require('../../assets/pottedplants/daisy3.png')],
  snapdragon: [require('../../assets/pottedplants/snapdragon.png'), require('../../assets/pottedplants/snapdragon1.png'), require('../../assets/pottedplants/snapdragon2.png'), require('../../assets/pottedplants/snapdragon3.png')],
  poppy:      [require('../../assets/pottedplants/poppy.png'),      require('../../assets/pottedplants/poppy1.png'),      require('../../assets/pottedplants/poppy2.png'),      require('../../assets/pottedplants/poppy3.png')],
  marigold:   [require('../../assets/pottedplants/marigold.png'),   require('../../assets/pottedplants/marigold1.png'),   require('../../assets/pottedplants/marigold2.png'),   require('../../assets/pottedplants/marigold3.png')],
  peony:      [require('../../assets/pottedplants/peony.png'),      require('../../assets/pottedplants/peony1.png'),      require('../../assets/pottedplants/peony2.png'),      require('../../assets/pottedplants/peony3.png')],
  hydrenga:   [require('../../assets/pottedplants/hydrenga.png'),   require('../../assets/pottedplants/hydrenga1.png'),   require('../../assets/pottedplants/hydrenga2.png'),   require('../../assets/pottedplants/hydrenga3.png')],
  rose:       [require('../../assets/pottedplants/rose.png'),       require('../../assets/pottedplants/rose1.png'),       require('../../assets/pottedplants/rose2.png'),       require('../../assets/pottedplants/rose3.png')],
};

// ─── Hanging Plants ──────────────────────────────────────────────────────────
// stage 0 = emptyhangingpotwithseed, 1 = bud, 2 = full, 3 = dead
export const HANGING_PLANT_IMAGES = {
  _seed:        require('../../assets/hangingplants/emptyhangingpotwithseed.png'),
  _seedVisible: require('../../assets/hangingplants/hangingpotwithseedvisible.png'),
  _stool:       require('../../assets/hangingplants/potonstool.png'),

  stringofpearls: [require('../../assets/hangingplants/stringofpearls.png'),  require('../../assets/hangingplants/stringofpearls1.png'),  require('../../assets/hangingplants/stringofpearls2.png')],
  Philodendron:   [require('../../assets/hangingplants/Philodendron.png'),    require('../../assets/hangingplants/Philodendron1 .png'),   require('../../assets/hangingplants/Philodendron2.png')],
  jasmine:        [require('../../assets/hangingplants/jasmine.png'),         require('../../assets/hangingplants/jasmine1.png'),         require('../../assets/hangingplants/jasmine2.png')],
  petunia:        [require('../../assets/hangingplants/petunia.png'),         require('../../assets/hangingplants/petunia1.png'),         require('../../assets/hangingplants/petunia2.png')],
  Bougainvillea:  [require('../../assets/hangingplants/Bougainvillea.png'),   require('../../assets/hangingplants/Bougainvillea1.png'),   require('../../assets/hangingplants/Bougainvillea2.png')],
};

// ─── Seeds ───────────────────────────────────────────────────────────────────
export const SEED_IMAGES = {
  daisy:          require('../../assets/seeds/daisyseed.png'),
  snapdragon:     require('../../assets/seeds/snapdragonseed.png'),
  poppy:          require('../../assets/seeds/poppyseed.png'),
  marigold:       require('../../assets/seeds/marigoldseed.png'),
  peony:          require('../../assets/seeds/peonyseed.png'),
  hydrenga:       require('../../assets/seeds/hydrengaseed.png'),
  rose:           require('../../assets/seeds/roseseed.png'),
  stringofpearls: require('../../assets/seeds/stringofpearlseed.png'),
  Philodendron:   require('../../assets/seeds/philodendronseed.png'),
  jasmine:        require('../../assets/seeds/jasmineseed.png'),
  petunia:        require('../../assets/seeds/petuniaseed.png'),
  Bougainvillea:  require('../../assets/seeds/bougenvillaseed.png'),
};

// ─── Wall Decor ──────────────────────────────────────────────────────────────
export const PAINTING_IMAGES = {
  beachpainting:         require('../../assets/walldecor/beachpainting.png'),
  campfirepainting:      require('../../assets/walldecor/campfirepainting.png'),
  sleepingpuppypainting: require('../../assets/walldecor/sleepingpuppypainting.png'),
  tabbycatpainting:      require('../../assets/walldecor/tabbycatpainting.png'),
  weddingpainting:       require('../../assets/walldecor/weddingpainting.png'),
  womanportraitpainting: require('../../assets/walldecor/womanportraitpainting.png'),
};

// ─── Pets ────────────────────────────────────────────────────────────────────
// ebonyandivory = the always-together sleeping PAIR (one purchasable unit).
// milk (white cat) and oreo (black cat) are separate single pets.
// koazy = koazysleeping.png.
export const PET_IMAGES = {
  george:        require('../../assets/pets/george.png'),
  storm:         require('../../assets/pets/storm.png'),
  koazy:         require('../../assets/pets/koazysleeping.png'),
  brownie:       require('../../assets/pets/brownie.png'),
  aki:           require('../../assets/pets/aki.png'),
  cherry:        require('../../assets/pets/cherry.png'),
  martin:        require('../../assets/pets/martin.png'),
  tiger:         require('../../assets/pets/tiger.png'),
  ebonyandivory: require('../../assets/pets/ebonyandivory.png'),
  milk:          require('../../assets/pets/milk.png'),
  oreo:          require('../../assets/pets/oreo.png'),
};

// ─── UI ──────────────────────────────────────────────────────────────────────
export const UI_IMAGES = {
  nurseryshop:  require('../../assets/ui_comps/nurseryshop.png'),
  gallery:      require('../../assets/ui_comps/gallery.png'),
  inventorybtn: require('../../assets/ui_comps/inventorybutton.png'),
  goldcoins:    require('../../assets/ui_comps/goldcoins.png'),
  back:         require('../../assets/ui_comps/back.png'),
  settings:     require('../../assets/ui_comps/settings.png'),
  settingsnobg: require('../../assets/ui_comps/settingsnobg.png'),
  seed:         require('../../assets/ui_comps/seed.png'),
  wateringcan1: require('../../assets/wateringcan1.png'),
  wateringcan2: require('../../assets/wateringcan2.png'),
  // Main screen buttons
  play:         require('../../assets/ui_comps/play.png'),
  sound:        require('../../assets/ui_comps/sound.png'),
  mutedsound:   require('../../assets/ui_comps/mutedsound.png'),
  info:         require('../../assets/ui_comps/info.png'),
  // Navigation / hub buttons
  homebutton:   require('../../assets/ui_comps/homebutton.png'),
  mapicon:      require('../../assets/ui_comps/mapicon.png'),
  greenhousebtn: require('../../assets/ui_comps/greenhousebutton.png'),
  balconybtn:   require('../../assets/ui_comps/balconybutton.png'),
  sunroombtn:   require('../../assets/ui_comps/sunroombutton.png'),
  nurserybtn:   require('../../assets/ui_comps/nurserybutton.png'),
  adoptbtn:     require('../../assets/ui_comps/adoptbutton.png'),
  marketbtn:    require('../../assets/ui_comps/marketbutton.png'),
  tradebtn:     require('../../assets/ui_comps/tradebutton.png'),
  trashclosed:  require('../../assets/ui_comps/trashclosed.png'),
  trashopen:    require('../../assets/ui_comps/trashopen.png'),
};

// ─── Nursery background ───────────────────────────────────────────────────────
export const NURSERY_BG = require('../../assets/nursery.jpeg');

// ─── Inventory grid background (7 cols × 5 rows, 1226×912) ────────────────────
export const INVENTORY_BG = require('../../assets/ui_comps/inventory.png');

// ─── New screen backgrounds ───────────────────────────────────────────────────
export const MAP_BG = require('../../assets/ui_comps/mapoftown.png');
export const HOME_BG = require('../../assets/homeinsidescreen.png');
export const PETSHOP_BG = require('../../assets/petshop.png');
export const TRADE_BG = require('../../assets/flowertradeshop.png');
