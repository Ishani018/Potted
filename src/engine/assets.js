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
  newbaby:               require('../../assets/walldecor/newbaby.jpeg'),
  picnic:                require('../../assets/walldecor/picnic.jpeg'),
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
  gallerybtn:   require('../../assets/ui_comps/gallerybutton.png'),
  tradebtn:     require('../../assets/ui_comps/tradebutton.png'),
  cancelbutton: require('../../assets/ui_comps/cancelbutton.png'),
  trashclosed:  require('../../assets/ui_comps/trashclosed.png'),
  trashopen:    require('../../assets/ui_comps/trashopen.png'),
  // Flower book + bouquet wrappers
  // Settings screen art
  // Pet card art
  pcCard: require('../../assets/ui_comps/pc_card.png'),
  pcBanner: require('../../assets/ui_comps/pc_banner.png'),
  pcPortrait: require('../../assets/ui_comps/pc_portrait.png'),
  pcPlate: require('../../assets/ui_comps/pc_plate.png'),
  pcGreen: require('../../assets/ui_comps/pc_green.png'),
  pcPrice: require('../../assets/ui_comps/pc_price.png'),
  pcBtnGreen: require('../../assets/ui_comps/pc_btn_green.png'),
  pcBtnTan: require('../../assets/ui_comps/pc_btn_tan.png'),
  pcBtnRed: require('../../assets/ui_comps/pc_btn_red.png'),
  pcBlossom: require('../../assets/ui_comps/pc_blossom.png'),
  pcLeaf: require('../../assets/ui_comps/pc_leaf.png'),
  pcPaw: require('../../assets/ui_comps/pc_paw.png'),
  pcSprout: require('../../assets/ui_comps/pc_sprout.png'),
  pcPerk: require('../../assets/ui_comps/pc_perk.png'),
  pcThumb: require('../../assets/ui_comps/pc_thumb.png'),
  pcThumbOn: require('../../assets/ui_comps/pc_thumb_on.png'),
  logo:          require('../../assets/ui_comps/logo.png'),
  ornateFrame:   require('../../assets/ui_comps/ornate_frame.png'),
  pcPicFrame:    require('../../assets/ui_comps/pc_pic_frame.png'),
  petFrame:      require('../../assets/ui_comps/pet_frame.png'),
  petFrameNoCoin: require('../../assets/ui_comps/pet_frame_nocoin.png'),
  settingsPanel: require('../../assets/ui_comps/settings_panel.png'),
  plantBanner:   require('../../assets/ui_comps/plant_banner.png'),
  settingsBoard: require('../../assets/ui_comps/settings_board.png'),
  settingsTitle: require('../../assets/ui_comps/settings_title.png'),
  backSign:      require('../../assets/ui_comps/back_sign.png'),
  ribbon:        require('../../assets/ui_comps/ribbon.png'),
  roomRibbon:    require('../../assets/ui_comps/room_ribbon.png'),
  coinPlaque:    require('../../assets/ui_comps/coin_plaque.png'),
  slotTile:      require('../../assets/ui_comps/slot_tile.png'),
  slotTileOn:    require('../../assets/ui_comps/slot_tile_on.png'),
  slotNone:      require('../../assets/ui_comps/slot_none.png'),
  nextBtn:       require('../../assets/ui_comps/next_btn.png'),
  dividerPaw:    require('../../assets/ui_comps/divider_paw.png'),
  vineLeft:      require('../../assets/ui_comps/vine_left.png'),
  vineRight:     require('../../assets/ui_comps/vine_right.png'),
  decoPlant:     require('../../assets/ui_comps/deco_plant.png'),
  decoCrate:     require('../../assets/ui_comps/deco_crate.png'),
  waterdrop:     require('../../assets/ui_comps/waterdrop.png'),
  flowerbook:    require('../../assets/ui_comps/flowerbook.png'),
  bouquetempty:  require('../../assets/ui_comps/bouquetempty.png'),
  bouquetmixed:  require('../../assets/ui_comps/bouquetmixed.png'),
  bouquetfancy:  require('../../assets/ui_comps/bouquetfancy.png'),
};

export const PERK_ICONS = {
  george: require('../../assets/ui_comps/pc_perk_george.png'),
  storm: require('../../assets/ui_comps/pc_perk_storm.png'),
  koazy: require('../../assets/ui_comps/pc_perk_koazy.png'),
  brownie: require('../../assets/ui_comps/pc_perk_brownie.png'),
  aki: require('../../assets/ui_comps/pc_perk_aki.png'),
  cherry: require('../../assets/ui_comps/pc_perk_cherry.png'),
  martin: require('../../assets/ui_comps/pc_perk_martin.png'),
  tiger: require('../../assets/ui_comps/pc_perk_tiger.png'),
  milk: require('../../assets/ui_comps/pc_perk_milk.png'),
  oreo: require('../../assets/ui_comps/pc_perk_oreo.png'),
  ebonyandivory: require('../../assets/ui_comps/pc_perk_ebonyandivory.png'),
};

// ─── Trade flower images (market) ─────────────────────────────────────────────
export const TRADE_IMAGES = {
  daisytrade:          require('../../assets/ui_comps/daisytrade.png'),
  snapdragontrade:     require('../../assets/ui_comps/snapdragontrade.png'),
  poppytrade:          require('../../assets/ui_comps/poppytrade.png'),
  marigoldtrade:       require('../../assets/ui_comps/marigoldtrade.png'),
  peonytrade:          require('../../assets/ui_comps/peonytrade.png'),
  hydrengatrade:       require('../../assets/ui_comps/hydrengatrade.png'),
  rosetrade:           require('../../assets/ui_comps/rosetrade.png'),
  stringofpearlstrade: require('../../assets/ui_comps/stringofpearlstrade.png'),
  philodendrontrade:   require('../../assets/ui_comps/philodendrontrade.png'),
  jasminetrade:        require('../../assets/ui_comps/jasminetrade.png'),
  petuniatrade:        require('../../assets/ui_comps/petuniatrade.png'),
  bougenvillatrade:    require('../../assets/ui_comps/bougenvillatrade.png'),
};

// ─── Nursery background ───────────────────────────────────────────────────────
export const NURSERY_BG = require('../../assets/nursery.jpeg');

// ─── Inventory grid background (7 cols × 5 rows, 1226×912) ────────────────────
export const INVENTORY_BG = require('../../assets/ui_comps/inventory.png');

// ─── New screen backgrounds ───────────────────────────────────────────────────
export const MAP_BG = require('../../assets/ui_comps/mapoftown.png');
export const HOME_BG = require('../../assets/homeinsidescreen.png');
export const PETSHOP_BG = require('../../assets/petshop.png');
export const TRADE_BG = require('../../assets/flowertradeshop.png');   // market exterior (scales)
export const TRADING_BG = require('../../assets/tradingscreen.png');    // the 6-slot trade page
export const BOUQUET_BG = require('../../assets/bouquetshop.png');   // bouquet table screen
export const PETROOM_BG = require('../../assets/petroom.png');       // pet lounge (beds)
export const GALLERY_BG = require('../../assets/gallery.png');
export const LOADING_BG = require('../../assets/loadingshop.png');

// ─── Florist customers ────────────────────────────────────────────────────────
// Full-body sprites (400×600, transparent, feet at the bottom), one per customer
// in gameData CUSTOMERS. They live in assets/customers/ and ship with the repo. A
// customer with no entry here is drawn as a simple stand-in person instead.
export const CUSTOMER_IMAGES = {
  clara:   require('../../assets/customers/clara.png'),
  theo:    require('../../assets/customers/theo.png'),
  iris:    require('../../assets/customers/iris.png'),
  posy:    require('../../assets/customers/posy.png'),
  walt:    require('../../assets/customers/walt.png'),
  finn:    require('../../assets/customers/finn.png'),
  marisol: require('../../assets/customers/marisol.png'),
  ben:     require('../../assets/customers/ben.png'),
  maemae:  require('../../assets/customers/maemae.png'),
  nori:    require('../../assets/customers/nori.png'),
};
