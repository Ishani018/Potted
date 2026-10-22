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

// Rare plants: two growth stages only (bud, full bloom), so just two pictures each.
Object.assign(POTTED_PLANT_IMAGES, {
  goldenrose: [require('../../assets/rare/goldenrose_bud.png'), require('../../assets/rare/goldenrose_bloom.png')],
  moonbell: [require('../../assets/rare/moonbell_bud.png'), require('../../assets/rare/moonbell_bloom.png')],
  dreamhydrangea: [require('../../assets/rare/dreamhydrangea_bud.png'), require('../../assets/rare/dreamhydrangea_bloom.png')],
  blushmonstera: [require('../../assets/rare/blushmonstera_bud.png'), require('../../assets/rare/blushmonstera_bloom.png')],
  midnightlily: [require('../../assets/rare/midnightlily_bud.png'), require('../../assets/rare/midnightlily_bloom.png')],
  frostrose: [require('../../assets/rare/frostrose_bud.png'), require('../../assets/rare/frostrose_bloom.png')],
  bleedingheart: [require('../../assets/rare/bleedingheart_bud.png'), require('../../assets/rare/bleedingheart_bloom.png')],
  ivoryhibiscus: [require('../../assets/rare/ivoryhibiscus_bud.png'), require('../../assets/rare/ivoryhibiscus_bloom.png')],
});

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

Object.assign(SEED_IMAGES, {
  goldenrose: require('../../assets/rare/goldenrose_seed.png'),
  moonbell: require('../../assets/rare/moonbell_seed.png'),
  dreamhydrangea: require('../../assets/rare/dreamhydrangea_seed.png'),
  blushmonstera: require('../../assets/rare/blushmonstera_seed.png'),
  midnightlily: require('../../assets/rare/midnightlily_seed.png'),
  frostrose: require('../../assets/rare/frostrose_seed.png'),
  bleedingheart: require('../../assets/rare/bleedingheart_seed.png'),
  ivoryhibiscus: require('../../assets/rare/ivoryhibiscus_seed.png'),
});

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

// ─── Weather badges (wreath icons) and floating bits ──────────────────────────


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
  // strays (Foster Center)
  biscuit:       require('../../assets/foster/biscuit.png'),
  marmalade:     require('../../assets/foster/marmalade.png'),
  honey:         require('../../assets/foster/marmaladealt.png'),
  soot:          require('../../assets/foster/soot.png'),
  cloud:         require('../../assets/foster/cloud.png'),
  smoky:         require('../../assets/foster/smoky.png'),
  maple:         require('../../assets/foster/maple.png'),
  clover:        require('../../assets/foster/clover.png'),
  pudding:       require('../../assets/foster/pudding.png'),
  whisper:       require('../../assets/foster/whisper.png'),
  inky:          require('../../assets/foster/inky.png'),
  mocha:         require('../../assets/foster/mocha.png'),
};
// Biscuit naps on the foster beds.
export const FOSTER_REST_IMAGES = { biscuit: require('../../assets/foster/biscuitsleep.png') };
// Little shop and adventure stickers (cardboard box, pet backpack, bell, ribbon spool, lantern, plant).
// The painted order card and its trimmings (cut from one sheet, transparent).
export const ORDER_ART = {
  banner: require('../../assets/order/banner.png'),
  bar_cream: require('../../assets/order/bar_cream.png'),
  bar_green: require('../../assets/order/bar_green.png'),
  bar_pink: require('../../assets/order/bar_pink.png'),
  blossom: require('../../assets/order/blossom.png'),
  bow_cream: require('../../assets/order/bow_cream.png'),
  bow_green: require('../../assets/order/bow_green.png'),
  bow_green_loose: require('../../assets/order/bow_green_loose.png'),
  bow_pink: require('../../assets/order/bow_pink.png'),
  bow_pink_loose: require('../../assets/order/bow_pink_loose.png'),
  card: require('../../assets/order/card.png'),
  clothespin: require('../../assets/order/clothespin.png'),
  daisy: require('../../assets/order/daisy.png'),
  flowers: require('../../assets/order/flowers.png'),
  leaves: require('../../assets/order/leaves.png'),
  photo: require('../../assets/order/photo.png'),
  pin_a: require('../../assets/order/pin_a.png'),
  pin_b: require('../../assets/order/pin_b.png'),
  pin_gold: require('../../assets/order/pin_gold.png'),
  perfect: require('../../assets/order/perfect.png'),
  notice: require('../../assets/order/notice.png'),
  daydone: require('../../assets/order/daydone.png'),
  seal: require('../../assets/order/seal.png'),
  pin_rose: require('../../assets/order/pin_rose.png'),
  rose: require('../../assets/order/rose.png'),
  tag_bow: require('../../assets/order/tag_bow.png'),
  tag_flower: require('../../assets/order/tag_flower.png'),
  tag_round: require('../../assets/order/tag_round.png'),
  tile_cream: require('../../assets/order/tile_cream.png'),
  tile_green: require('../../assets/order/tile_green.png'),
  tile_kraft: require('../../assets/order/tile_kraft.png'),
  tulip: require('../../assets/order/tulip.png'),
  washi_green: require('../../assets/order/washi_green.png'),
  washi_green2: require('../../assets/order/washi_green2.png'),
  washi_pink: require('../../assets/order/washi_pink.png'),
};

// The painted pet card frame (blank: all text is live). 'nocoin' has the coin icon wiped too.
export const PETCARD_IMAGES = { coin: require('../../assets/petcard/card_coin.png'), nocoin: require('../../assets/petcard/card_nocoin.png') };
export const PETCARD_GRASS = require('../../assets/petcard/grass.png');   // the grass patch a pet sits on in the card
// The cardboard delivery box: open with tissue, half-closed, closed from above and closed at an angle.
export const BOX_IMAGES = {
  open: require('../../assets/boxes/open1.png'), closing: require('../../assets/boxes/closing.png'),
  top: require('../../assets/boxes/closed_top.png'), iso: require('../../assets/boxes/closed_iso.png'),
};
export const ORDER_SLIP = require('../../assets/shop/order_slip.png');
export const SHOP_IMAGES = {
  box: require('../../assets/shop/box.png'), backpack: require('../../assets/shop/backpack.png'),
  bell: require('../../assets/shop/bell.png'), spool: require('../../assets/shop/spool.png'),
  lantern: require('../../assets/shop/lantern.png'), plant: require('../../assets/shop/plant.png'),
};
// Bows, five or so shapes per ribbon colour (the box under the scissors holds them).
export const BOW_IMAGES = {
  red: [require('../../assets/bows/red_0.png'), require('../../assets/bows/red_1.png'), require('../../assets/bows/red_2.png'), require('../../assets/bows/red_3.png'), require('../../assets/bows/red_4.png')],
  pink: [require('../../assets/bows/pink_0.png'), require('../../assets/bows/pink_1.png'), require('../../assets/bows/pink_2.png'), require('../../assets/bows/pink_3.png'), require('../../assets/bows/pink_4.png')],
  cream: [require('../../assets/bows/cream_0.png'), require('../../assets/bows/cream_1.png'), require('../../assets/bows/cream_2.png'), require('../../assets/bows/cream_3.png'), require('../../assets/bows/cream_4.png')],
  pinkfloral: [require('../../assets/bows/pinkfloral_0.png'), require('../../assets/bows/pinkfloral_1.png'), require('../../assets/bows/pinkfloral_2.png'), require('../../assets/bows/pinkfloral_3.png'), require('../../assets/bows/pinkfloral_4.png')],
  green: [require('../../assets/bows/green_0.png'), require('../../assets/bows/green_1.png'), require('../../assets/bows/green_2.png'), require('../../assets/bows/green_3.png')],
  creamfloral: [require('../../assets/bows/creamfloral_0.png'), require('../../assets/bows/creamfloral_1.png')],
};

// Bouquet-making: the flat kraft sheet (700×617) and two wavy ribbons (red, pink).
export const MAKE_IMAGES = {
  paper: require('../../assets/shop/paper_kraft.png'),
  paperFancy: require('../../assets/shop/paper_fancy.png'),
  // the wrapped bouquet (an empty folded wrapper) once the flaps are over; fancy borrows layered's until it has its own
  wrapKraft: require('../../assets/shop/wrap_kraft.png'),
  wrapLayered: require('../../assets/shop/wrap_layered.png'),
  ribbonRed: require('../../assets/shop/ribbon_red.png'),
  ribbonPink: require('../../assets/shop/ribbon_pink.png'),
  ribbonCream: require('../../assets/shop/ribbon_cream.png'),
  ribbonPinkFloral: require('../../assets/shop/ribbon_pinkfloral.png'),
  ribbonGreen: require('../../assets/shop/ribbon_green.png'),
  ribbonCreamFloral: require('../../assets/shop/ribbon_creamfloral.png'),
};
export const FOSTER_BG = require('../../assets/foster/center.png');

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
  // Garden journal + bouquet wrappers
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
// The strays have their own painted perk icons (assets/perks/).
Object.assign(PERK_ICONS, {
  biscuit: require('../../assets/perks/biscuit.png'),
  marmalade: require('../../assets/perks/marmalade.png'),
  honey: require('../../assets/perks/honey.png'),
  soot: require('../../assets/perks/soot.png'),
  cloud: require('../../assets/perks/cloud.png'),
  smoky: require('../../assets/perks/smoky.png'),
  maple: require('../../assets/perks/maple.png'),
  clover: require('../../assets/perks/clover.png'),
  pudding: require('../../assets/perks/pudding.png'),
  whisper: require('../../assets/perks/whisper.png'),
  inky: require('../../assets/perks/inky.png'),
  mocha: require('../../assets/perks/mocha.png'),
});

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
Object.assign(TRADE_IMAGES, {
  goldenrosetrade: require('../../assets/rare/goldenrose_trade.png'),
  moonbelltrade: require('../../assets/rare/moonbell_trade.png'),
  dreamhydrangeatrade: require('../../assets/rare/dreamhydrangea_trade.png'),
  blushmonsteratrade: require('../../assets/rare/blushmonstera_trade.png'),
  midnightlilytrade: require('../../assets/rare/midnightlily_trade.png'),
  frostrosetrade: require('../../assets/rare/frostrose_trade.png'),
  bleedinghearttrade: require('../../assets/rare/bleedingheart_trade.png'),
  ivoryhibiscustrade: require('../../assets/rare/ivoryhibiscus_trade.png'),
});

// ─── Nursery background ───────────────────────────────────────────────────────
export const NURSERY_BG = require('../../assets/nursery.jpeg');

// ─── Inventory grid background (7 cols × 5 rows, 1226×912) ────────────────────
export const INVENTORY_BG = require('../../assets/ui_comps/inventory.png');

// ─── New screen backgrounds ───────────────────────────────────────────────────
export const MAP_BG = require('../../assets/ui_comps/mapoftown_v2.png');
export const HOME_BG = require('../../assets/homeinsidescreen.png');
// The pet shop in three states: both doors shut, the Pet Food door open, both doors open.
export const PETSHOP_BG = require('../../assets/petshop/shop_closed.png');
export const PETSHOP_STATES = {
  closed: PETSHOP_BG,
  food: require('../../assets/petshop/shop_food_open.png'),
  foster: require('../../assets/petshop/shop_foster_open.png'),
  both: require('../../assets/petshop/shop_both_open.png'),
};
// ─── Pet food aisle ───────────────────────────────────────────────────────────
export const PETFOOD_BG = require('../../assets/petfood/aisle.png');
export const PETFOOD_IMAGES = {
  dogfood: require('../../assets/petfood/dogfood.png'),
  catfood: require('../../assets/petfood/catfood.png'),
  puppyfood: require('../../assets/petfood/puppyfood.png'),
  kittenfood: require('../../assets/petfood/kittenfood.png'),
  grainfree: require('../../assets/petfood/grainfree.png'),
  seniorcare: require('../../assets/petfood/seniorcare.png'),
  wetcat: require('../../assets/petfood/wetcat.png'),
  wetdog: require('../../assets/petfood/wetdog.png'),
  biscuits: require('../../assets/petfood/biscuits.png'),
  treats: require('../../assets/petfood/treats.png'),
  dental: require('../../assets/petfood/dental.png'),
  training: require('../../assets/petfood/training.png'),
  catlitter: require('../../assets/petfood/catlitter.png'),
  puppypads: require('../../assets/petfood/puppypads.png'),
  wipes: require('../../assets/petfood/wipes.png'),
  deodoriser: require('../../assets/petfood/deodoriser.png'),
  shampoo: require('../../assets/petfood/shampoo.png'),
};

export const TRADE_BG = require('../../assets/flowertradeshop.png');   // market exterior (scales)
export const TRADING_BG = require('../../assets/tradingscreen.png');    // the 6-slot trade page
export const COUNTER_BG = require('../../assets/shop/counter.png');   // florist counter seen from behind the till (1678×937)
// The bouquet workspace seen from above (1536×1024, zoomed-in version). workspace_wide.png is the
// same scene pulled back a little; swap the line to try it.
export const BOUQUET_BG = require('../../assets/shop/workspace_v3.png');   // the zoomed workspace with a box of bows
export const PETROOM_BG = require('../../assets/petroom.png');       // pet lounge (beds)
export const GALLERY_BGS = { a: require('../../assets/ui_comps/cafe.png'), b: require('../../assets/ui_comps/cafe2.png') };   // the gallery is now a café (two pictures to choose from)
export const GALLERY_BG = GALLERY_BGS.a;
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

// Extra poses per customer (same 400x600 canvas): waving as they come in, thinking while
// they order, and holding their bouquet once served.
export const CUSTOMER_POSES = {
  clara: { wave: require('../../assets/customers/poses/clara_wave.png'), think: require('../../assets/customers/poses/clara_think.png'), hold: require('../../assets/customers/poses/clara_hold.png'), angry: require('../../assets/customers/poses/clara_angry.png'), box: require('../../assets/customers/poses/clara_box.png') },
  theo: { wave: require('../../assets/customers/poses/theo_wave.png'), think: require('../../assets/customers/poses/theo_think.png'), hold: require('../../assets/customers/poses/theo_hold.png'), angry: require('../../assets/customers/poses/theo_angry.png'), box: require('../../assets/customers/poses/theo_box.png') },
  iris: { wave: require('../../assets/customers/poses/iris_wave.png'), think: require('../../assets/customers/poses/iris_think.png'), hold: require('../../assets/customers/poses/iris_hold.png'), angry: require('../../assets/customers/poses/iris_angry.png'), box: require('../../assets/customers/poses/iris_box.png') },
  posy: { wave: require('../../assets/customers/poses/posy_wave.png'), think: require('../../assets/customers/poses/posy_think.png'), hold: require('../../assets/customers/poses/posy_hold.png'), angry: require('../../assets/customers/poses/posy_angry.png'), box: require('../../assets/customers/poses/posy_box.png') },
  walt: { wave: require('../../assets/customers/poses/walt_wave.png'), think: require('../../assets/customers/poses/walt_think.png'), hold: require('../../assets/customers/poses/walt_hold.png'), angry: require('../../assets/customers/poses/walt_angry.png'), box: require('../../assets/customers/poses/walt_box.png') },
  finn: { wave: require('../../assets/customers/poses/finn_wave.png'), think: require('../../assets/customers/poses/finn_think.png'), hold: require('../../assets/customers/poses/finn_hold.png'), angry: require('../../assets/customers/poses/finn_angry.png'), box: require('../../assets/customers/poses/finn_box.png') },
  marisol: { wave: require('../../assets/customers/poses/marisol_wave.png'), think: require('../../assets/customers/poses/marisol_think.png'), hold: require('../../assets/customers/poses/marisol_hold.png'), angry: require('../../assets/customers/poses/marisol_angry.png'), box: require('../../assets/customers/poses/marisol_box.png') },
  ben: { wave: require('../../assets/customers/poses/ben_wave.png'), think: require('../../assets/customers/poses/ben_think.png'), hold: require('../../assets/customers/poses/ben_hold.png'), angry: require('../../assets/customers/poses/ben_angry.png'), box: require('../../assets/customers/poses/ben_box.png') },
  maemae: { wave: require('../../assets/customers/poses/maemae_wave.png'), think: require('../../assets/customers/poses/maemae_think.png'), hold: require('../../assets/customers/poses/maemae_hold.png'), angry: require('../../assets/customers/poses/maemae_angry.png'), box: require('../../assets/customers/poses/maemae_box.png') },
  nori: { wave: require('../../assets/customers/poses/nori_wave.png'), think: require('../../assets/customers/poses/nori_think.png'), hold: require('../../assets/customers/poses/nori_hold.png'), angry: require('../../assets/customers/poses/nori_angry.png'), box: require('../../assets/customers/poses/nori_box.png') },
};

// ─── Herbalist (Granny Mae) and her remedies ──────────────────────────────────
// The herbalist reuses Granny Mae's customer sprite (CUSTOMER_IMAGES.maemae). The
// two remedy icons (256×256 transparent) live in assets/herbalist/ and ship with
// the repo. An icon that isn't registered here is drawn as a simple stand-in.
export const HERBALIST_IMAGES = {
  balm:   require('../../assets/herbalist/balm.png'),
  sachet: require('../../assets/herbalist/sachet.png'),
};

// ─── Garden journal ──────────────────────────────────────────────────────────────
// The open book (cropped to the book itself, transparent outside it). Text goes in
// the page areas defined in components/BookFrame.js. Ships with the repo.
export const BOOK_IMG = require('../../assets/book/flowerbook.png');
// Painted page cards for the book's tiles, the title ribbon and a vine divider.
export const BOOK_TILES = {
  empty:    require('../../assets/book/tile_empty.png'),
  found:    require('../../assets/book/tile_found.png'),
  selected: require('../../assets/book/tile_selected.png'),
  locked:   require('../../assets/book/tile_locked.png'),
};
// Painted buttons, cut in three (left cap | stretchy middle | right cap) so the
// flowers on the corners keep their shape at any width. cap = cap width / height.
export const BOOK_BUTTONS = {
  green: { l: require('../../assets/book/btn_green_l.png'), m: require('../../assets/book/btn_green_m.png'), r: require('../../assets/book/btn_green_r.png'), cap: 237 / 200, tall: 1.9 },
  wood:  { l: require('../../assets/book/btn_wood_l.png'),  m: require('../../assets/book/btn_wood_m.png'),  r: require('../../assets/book/btn_wood_r.png'),  cap: 82 / 170 },
  red:   { l: require('../../assets/book/btn_red_l.png'),   m: require('../../assets/book/btn_red_m.png'),   r: require('../../assets/book/btn_red_r.png'),   cap: 80 / 170 },
};
export const BOOK_ARROWS = { left: require('../../assets/book/arrow_left.png'), right: require('../../assets/book/arrow_right.png') };
export const BOOK_MEDAL = require('../../assets/book/medal.png');
// Torn-paper card with a ribbon seal (pop-up summaries), hanging tag (hover labels),
// wax tick stamp (done), XP bar frame + fill, notice board (daily goals, later).
export const BOOK_CARD = require('../../assets/book/card_big.png');
export const BOOK_TAG = require('../../assets/book/tag.png');
export const BOOK_STAMP = require('../../assets/book/stamp.png');
export const BOOK_XP = { frame: require('../../assets/book/xp_frame.png'), fill: require('../../assets/book/xp_fill.png') };
export const BOOK_BOARD = require('../../assets/book/board.png');
export const BOOK_BANNER = require('../../assets/book/banner.png');
export const BOOK_DIVIDER = require('../../assets/book/divider.png');
