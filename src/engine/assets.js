export const MAIN_BG = require('../../assets/ui_comps/mainscreen.jpeg');
export const GAME_MUSIC = require('../../assets/Sunlight_on_the_Sprouts.mp3');

// ─── Backgrounds ────────────────────────────────────────────────────────────
export const ROOM_BGS = {   // one picture per room: no seasons, no wall colours
  room1: require('../../assets/rooms/greenhouse.png'),
  room2: require('../../assets/rooms/balcony.png'),
  room3: require('../../assets/rooms/sunroom.png'),
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
  daisy:          require('../../assets/seeds2/daisyseed.png'),
  snapdragon:     require('../../assets/seeds2/snapdragonseed.png'),
  poppy:          require('../../assets/seeds2/poppyseed.png'),
  marigold:       require('../../assets/seeds2/marigoldseed.png'),
  peony:          require('../../assets/seeds2/peonyseed.png'),
  hydrenga:       require('../../assets/seeds2/hydrengaseed.png'),
  rose:           require('../../assets/seeds2/roseseed.png'),
  stringofpearls: require('../../assets/seeds2/stringofpearlseed.png'),
  Philodendron:   require('../../assets/seeds2/philodendronseed.png'),
  jasmine:        require('../../assets/seeds2/jasmineseed.png'),
  petunia:        require('../../assets/seeds2/petuniaseed.png'),
  Bougainvillea:  require('../../assets/seeds2/bougenvillaseed.png'),
};

// The clean seed-bag pictures (used in the cart / order summary), kept before the painted cut-outs replace them below.
export const SEED_ICONS = { ...SEED_IMAGES };

// Painted seed bags (cut from the nursery counter); the other three keep the old bag art.
Object.assign(SEED_IMAGES, {
  daisy: require('../../assets/seeds3/daisy.png'), marigold: require('../../assets/seeds3/marigold.png'), rose: require('../../assets/seeds3/rose.png'),
  hydrenga: require('../../assets/seeds3/hydrenga.png'), jasmine: require('../../assets/seeds3/jasmine.png'), peony: require('../../assets/seeds3/peony.png'),
  poppy: require('../../assets/seeds3/poppy.png'), petunia: require('../../assets/seeds3/petunia.png'), snapdragon: require('../../assets/seeds3/snapdragon.png'),
});

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
  paper: require('../../assets/make2/pap_05.png'),        // kraft sheet
  paperFancy: require('../../assets/make2/pap_01.png'),   // flowered sheet
  paperStack: require('../../assets/make2/pap_07.png'),   // folded kraft, lying flat
  paperFancyStack: require('../../assets/make2/pap_03.png'), // folded flowered sheet, lying flat
  // the ribbon spools (picture + tail), same order as the rack
  spoolRed: require('../../assets/make2/spl_01.png'), spoolPink: require('../../assets/make2/spl_02.png'), spoolCream: require('../../assets/make2/spl_03.png'),
  spoolPinkFloral: require('../../assets/make2/spl_04.png'), spoolCreamFloral: require('../../assets/make2/spl_05.png'), spoolGreen: require('../../assets/make2/spl_06.png'),
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
  inventorybtn: require('../../assets/ui_sheet/hud_bag.png'),
  goldcoins:    require('../../assets/ui_comps/goldcoins.png'),
  back:         require('../../assets/ui_comps/back.png'),
  settings:     require('../../assets/ui_comps/settings.png'),
  settingsnobg: require('../../assets/ui_sheet/hud_gear.png'),
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
  mainPlay:     require('../../assets/ui_sheet2/pl_01.png'),
  mainGear:     require('../../assets/ui_sheet/ui_01.png'),
  mainInfo:     require('../../assets/ui_sheet/ui_07.png'),
  mainSound:    require('../../assets/ui_sheet/ui_13.png'),
  mainMuted:    require('../../assets/ui_sheet/ui_14.png'),
  mapicon:      require('../../assets/ui_sheet/hud_map.png'),
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
  flowerbook:    require('../../assets/ui_sheet/hud_book.png'),
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
export const NURSERY_BG = require('../../assets/shop/nursery_v11.png');

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
export const BOUQUET_BG = require('../../assets/shop/workspace_v4.png');   // the zoomed workspace with a box of bows
export const PETROOM_BG = require('../../assets/petroom.png');       // pet lounge (beds)
export const GALLERY_BGS = { a: require('../../assets/ui_comps/cafe.png'), b: require('../../assets/ui_comps/cafe2.png'), c: require('../../assets/ui_comps/cafe3.png'), d: require('../../assets/ui_comps/cafe4.png') };   // the gallery is now a café (two pictures to choose from)
// The apartment building's butler (picture + its pixel size, so he keeps his proportions)
export const BUTLER = {
  idle: { src: require('../../assets/butler/bt_01.png'), w: 202, h: 468 },
  wave: { src: require('../../assets/butler/bt_02.png'), w: 249, h: 463 },
  clip: { src: require('../../assets/butler/bt_03.png'), w: 216, h: 461 },
  offer: { src: require('../../assets/butler/bt_04.png'), w: 289, h: 460 },
  pointR: { src: require('../../assets/butler/bt_05.png'), w: 271, h: 463 },
  pointL: { src: require('../../assets/butler/bt_06.png'), w: 259, h: 456 },
  parcels: { src: require('../../assets/butler/bt_07.png'), w: 196, h: 445 },
  cart: { src: require('../../assets/butler/bt_08.png'), w: 229, h: 440 },
  keys: { src: require('../../assets/butler/bt_09.png'), w: 267, h: 446 },
  tip: { src: require('../../assets/butler/bt_10.png'), w: 199, h: 439 },
  gift: { src: require('../../assets/butler/bt_11.png'), w: 206, h: 440 },
  bow: { src: require('../../assets/butler/bt_12.png'), w: 197, h: 431 },
  whisper: { src: require('../../assets/butler/bt_13.png'), w: 200, h: 432 },
};
// The goose: frames 1-9 walk right, 10-18 walk left, 19 front, 20-21 stand, 22 honk, 23-24 wings, 25 peck, 26 asleep, 27 preen,
// 28-36 walk away, 37-38 from behind. (picture + pixel size, so frames keep their proportions)
export const GOOSE = {
  1: { src: require('../../assets/goose/gs_01.png'), w: 181, h: 207 },
  2: { src: require('../../assets/goose/gs_02.png'), w: 183, h: 208 },
  3: { src: require('../../assets/goose/gs_03.png'), w: 191, h: 207 },
  4: { src: require('../../assets/goose/gs_04.png'), w: 194, h: 203 },
  5: { src: require('../../assets/goose/gs_05.png'), w: 191, h: 203 },
  6: { src: require('../../assets/goose/gs_06.png'), w: 175, h: 206 },
  7: { src: require('../../assets/goose/gs_07.png'), w: 181, h: 208 },
  8: { src: require('../../assets/goose/gs_08.png'), w: 185, h: 204 },
  9: { src: require('../../assets/goose/gs_09.png'), w: 182, h: 202 },
  10: { src: require('../../assets/goose/gs_10.png'), w: 191, h: 203 },
  11: { src: require('../../assets/goose/gs_11.png'), w: 188, h: 200 },
  12: { src: require('../../assets/goose/gs_12.png'), w: 178, h: 202 },
  13: { src: require('../../assets/goose/gs_13.png'), w: 182, h: 208 },
  14: { src: require('../../assets/goose/gs_14.png'), w: 185, h: 203 },
  15: { src: require('../../assets/goose/gs_15.png'), w: 200, h: 199 },
  16: { src: require('../../assets/goose/gs_16.png'), w: 195, h: 203 },
  17: { src: require('../../assets/goose/gs_17.png'), w: 190, h: 206 },
  18: { src: require('../../assets/goose/gs_18.png'), w: 218, h: 206 },
  19: { src: require('../../assets/goose/gs_19.png'), w: 114, h: 201 },
  20: { src: require('../../assets/goose/gs_20.png'), w: 137, h: 200 },
  21: { src: require('../../assets/goose/gs_21.png'), w: 148, h: 196 },
  22: { src: require('../../assets/goose/gs_22.png'), w: 144, h: 205 },
  23: { src: require('../../assets/goose/gs_23.png'), w: 165, h: 188 },
  24: { src: require('../../assets/goose/gs_24.png'), w: 227, h: 201 },
  25: { src: require('../../assets/goose/gs_25.png'), w: 192, h: 158 },
  26: { src: require('../../assets/goose/gs_26.png'), w: 247, h: 140 },
  27: { src: require('../../assets/goose/gs_27.png'), w: 139, h: 189 },
  28: { src: require('../../assets/goose/gs_28.png'), w: 116, h: 187 },
  29: { src: require('../../assets/goose/gs_29.png'), w: 116, h: 191 },
  30: { src: require('../../assets/goose/gs_30.png'), w: 118, h: 187 },
  31: { src: require('../../assets/goose/gs_31.png'), w: 117, h: 190 },
  32: { src: require('../../assets/goose/gs_32.png'), w: 126, h: 185 },
  33: { src: require('../../assets/goose/gs_33.png'), w: 115, h: 190 },
  34: { src: require('../../assets/goose/gs_34.png'), w: 114, h: 192 },
  35: { src: require('../../assets/goose/gs_35.png'), w: 125, h: 192 },
  36: { src: require('../../assets/goose/gs_36.png'), w: 114, h: 189 },
  37: { src: require('../../assets/goose/gs_37.png'), w: 112, h: 192 },
  38: { src: require('../../assets/goose/gs_38.png'), w: 177, h: 190 },
};
// The goose, second sheet: 1-13 walk right, 14-25 walk left (legs alternate), 26 front, 27-29 and 32-33 standing, 30-31 from behind,
// 34-35 wings, 36-37 honk, 38 wings wide, 39-41 peck, 42-45 asleep, 46 neck up, 47 preen, 48 settling, 49 sitting
export const GOOSE2 = {
  1: { src: require('../../assets/goose2/g2_01.png'), w: 143, h: 156 },
  2: { src: require('../../assets/goose2/g2_02.png'), w: 139, h: 154 },
  3: { src: require('../../assets/goose2/g2_03.png'), w: 148, h: 160 },
  4: { src: require('../../assets/goose2/g2_04.png'), w: 152, h: 160 },
  5: { src: require('../../assets/goose2/g2_05.png'), w: 152, h: 163 },
  6: { src: require('../../assets/goose2/g2_06.png'), w: 154, h: 162 },
  7: { src: require('../../assets/goose2/g2_07.png'), w: 158, h: 162 },
  8: { src: require('../../assets/goose2/g2_08.png'), w: 158, h: 161 },
  9: { src: require('../../assets/goose2/g2_09.png'), w: 158, h: 161 },
  10: { src: require('../../assets/goose2/g2_10.png'), w: 158, h: 160 },
  11: { src: require('../../assets/goose2/g2_11.png'), w: 159, h: 161 },
  12: { src: require('../../assets/goose2/g2_12.png'), w: 152, h: 160 },
  13: { src: require('../../assets/goose2/g2_13.png'), w: 142, h: 156 },
  14: { src: require('../../assets/goose2/g2_14.png'), w: 153, h: 156 },
  15: { src: require('../../assets/goose2/g2_15.png'), w: 146, h: 155 },
  16: { src: require('../../assets/goose2/g2_16.png'), w: 152, h: 155 },
  17: { src: require('../../assets/goose2/g2_17.png'), w: 152, h: 155 },
  18: { src: require('../../assets/goose2/g2_18.png'), w: 149, h: 155 },
  19: { src: require('../../assets/goose2/g2_19.png'), w: 155, h: 156 },
  20: { src: require('../../assets/goose2/g2_20.png'), w: 153, h: 159 },
  21: { src: require('../../assets/goose2/g2_21.png'), w: 150, h: 153 },
  22: { src: require('../../assets/goose2/g2_22.png'), w: 155, h: 154 },
  23: { src: require('../../assets/goose2/g2_23.png'), w: 155, h: 157 },
  24: { src: require('../../assets/goose2/g2_24.png'), w: 152, h: 154 },
  25: { src: require('../../assets/goose2/g2_25.png'), w: 135, h: 158 },
  26: { src: require('../../assets/goose2/g2_26.png'), w: 97, h: 163 },
  27: { src: require('../../assets/goose2/g2_27.png'), w: 104, h: 167 },
  28: { src: require('../../assets/goose2/g2_28.png'), w: 91, h: 166 },
  29: { src: require('../../assets/goose2/g2_29.png'), w: 87, h: 166 },
  30: { src: require('../../assets/goose2/g2_30.png'), w: 98, h: 176 },
  31: { src: require('../../assets/goose2/g2_31.png'), w: 99, h: 175 },
  32: { src: require('../../assets/goose2/g2_32.png'), w: 81, h: 168 },
  33: { src: require('../../assets/goose2/g2_33.png'), w: 91, h: 168 },
  34: { src: require('../../assets/goose2/g2_34.png'), w: 180, h: 159 },
  35: { src: require('../../assets/goose2/g2_35.png'), w: 205, h: 182 },
  36: { src: require('../../assets/goose2/g2_36.png'), w: 148, h: 150 },
  37: { src: require('../../assets/goose2/g2_37.png'), w: 135, h: 168 },
  38: { src: require('../../assets/goose2/g2_38.png'), w: 241, h: 159 },
  39: { src: require('../../assets/goose2/g2_39.png'), w: 174, h: 112 },
  40: { src: require('../../assets/goose2/g2_40.png'), w: 198, h: 105 },
  41: { src: require('../../assets/goose2/g2_41.png'), w: 197, h: 103 },
  42: { src: require('../../assets/goose2/g2_42.png'), w: 165, h: 107 },
  43: { src: require('../../assets/goose2/g2_43.png'), w: 181, h: 107 },
  44: { src: require('../../assets/goose2/g2_44.png'), w: 126, h: 110 },
  45: { src: require('../../assets/goose2/g2_45.png'), w: 176, h: 96 },
  46: { src: require('../../assets/goose2/g2_46.png'), w: 101, h: 153 },
  47: { src: require('../../assets/goose2/g2_47.png'), w: 126, h: 120 },
  48: { src: require('../../assets/goose2/g2_48.png'), w: 139, h: 136 },
  49: { src: require('../../assets/goose2/g2_49.png'), w: 105, h: 151 },
};
export const GOOSE_HONK = require('../../assets/sfx/goose.mp3');
// Small UI / shop sounds, made by tools/make_sfx.py
export const SFX = {
  coin: require('../../assets/sfx/coin.mp3'), register: require('../../assets/sfx/register.mp3'), tap: require('../../assets/sfx/tap.mp3'),
  add: require('../../assets/sfx/add.mp3'), pop: require('../../assets/sfx/pop.mp3'), water: require('../../assets/sfx/water.mp3'),
  nope: require('../../assets/sfx/nope.mp3'), whoosh: require('../../assets/sfx/whoosh.mp3'),
};
export const GOOSE_PICKUP = require('../../assets/sfx/goose_pickup.mp3');   // the loud honk when you pick the goose up
// Speech bubbles (picture + pixel size)
export const BUBBLE_WIDE = { src: require('../../assets/ui_sheet/bb_08.png'), w: 401, h: 166 };
// Granny Mae: 1-6 walk (3/4 front), 7-10 and 18-21 walk away, 11-17 walk with hands clasped, 22-30 chatting busts, 33-40 seated
export const GRANNY = {
  1: { src: require('../../assets/granny/gm_01.png'), w: 104, h: 177 },
  2: { src: require('../../assets/granny/gm_02.png'), w: 99, h: 177 },
  3: { src: require('../../assets/granny/gm_03.png'), w: 101, h: 178 },
  4: { src: require('../../assets/granny/gm_04.png'), w: 109, h: 177 },
  5: { src: require('../../assets/granny/gm_05.png'), w: 111, h: 178 },
  6: { src: require('../../assets/granny/gm_06.png'), w: 109, h: 176 },
  7: { src: require('../../assets/granny/gm_07.png'), w: 97, h: 175 },
  8: { src: require('../../assets/granny/gm_08.png'), w: 98, h: 174 },
  9: { src: require('../../assets/granny/gm_09.png'), w: 93, h: 173 },
  10: { src: require('../../assets/granny/gm_10.png'), w: 100, h: 172 },
  11: { src: require('../../assets/granny/gm_11.png'), w: 87, h: 166 },
  12: { src: require('../../assets/granny/gm_12.png'), w: 91, h: 169 },
  13: { src: require('../../assets/granny/gm_13.png'), w: 99, h: 168 },
  14: { src: require('../../assets/granny/gm_14.png'), w: 91, h: 165 },
  15: { src: require('../../assets/granny/gm_15.png'), w: 88, h: 167 },
  16: { src: require('../../assets/granny/gm_16.png'), w: 98, h: 172 },
  17: { src: require('../../assets/granny/gm_17.png'), w: 95, h: 165 },
  18: { src: require('../../assets/granny/gm_18.png'), w: 84, h: 164 },
  19: { src: require('../../assets/granny/gm_19.png'), w: 89, h: 164 },
  20: { src: require('../../assets/granny/gm_20.png'), w: 91, h: 172 },
  21: { src: require('../../assets/granny/gm_21.png'), w: 94, h: 175 },
  22: { src: require('../../assets/granny/gm_22.png'), w: 90, h: 111 },
  23: { src: require('../../assets/granny/gm_23.png'), w: 88, h: 103 },
  24: { src: require('../../assets/granny/gm_24.png'), w: 104, h: 113 },
  25: { src: require('../../assets/granny/gm_25.png'), w: 102, h: 117 },
  26: { src: require('../../assets/granny/gm_26.png'), w: 107, h: 111 },
  27: { src: require('../../assets/granny/gm_27.png'), w: 87, h: 117 },
  28: { src: require('../../assets/granny/gm_28.png'), w: 83, h: 119 },
  29: { src: require('../../assets/granny/gm_29.png'), w: 88, h: 113 },
  30: { src: require('../../assets/granny/gm_30.png'), w: 85, h: 118 },
  31: { src: require('../../assets/granny/gm_31.png'), w: 205, h: 267 },
  32: { src: require('../../assets/granny/gm_32.png'), w: 93, h: 110 },
  33: { src: require('../../assets/granny/gm_33.png'), w: 127, h: 158 },
  34: { src: require('../../assets/granny/gm_34.png'), w: 119, h: 163 },
  35: { src: require('../../assets/granny/gm_35.png'), w: 105, h: 161 },
  36: { src: require('../../assets/granny/gm_36.png'), w: 121, h: 157 },
  37: { src: require('../../assets/granny/gm_37.png'), w: 124, h: 139 },
  38: { src: require('../../assets/granny/gm_38.png'), w: 93, h: 139 },
  39: { src: require('../../assets/granny/gm_39.png'), w: 92, h: 147 },
  40: { src: require('../../assets/granny/gm_40.png'), w: 95, h: 146 },
  41: { src: require('../../assets/granny/gm_41.png'), w: 82, h: 106 },
  42: { src: require('../../assets/granny/gm_42.png'), w: 90, h: 109 },
  43: { src: require('../../assets/granny/gm_43.png'), w: 89, h: 105 },
  44: { src: require('../../assets/granny/gm_44.png'), w: 97, h: 108 },
  45: { src: require('../../assets/granny/gm_45.png'), w: 89, h: 98 },
  46: { src: require('../../assets/granny/gm_46.png'), w: 93, h: 98 },
  47: { src: require('../../assets/granny/gm_47.png'), w: 84, h: 99 },
  48: { src: require('../../assets/granny/gm_48.png'), w: 99, h: 99 },
  49: { src: require('../../assets/granny/gm_49.png'), w: 97, h: 94 },
  50: { src: require('../../assets/granny/gm_50.png'), w: 97, h: 94 },
  51: { src: require('../../assets/granny/gm_51.png'), w: 92, h: 102 },
};
// Painted UI pieces used by the settings screen (picture + pixel size)
export const SET_UI = {
  toggleOn: { src: require('../../assets/ui_sheet/ui_19.png'), w: 120, h: 60 },
  toggleOff: { src: require('../../assets/ui_sheet/ui_27.png'), w: 121, h: 60 },
  left: { src: require('../../assets/ui_sheet/ui_21.png'), w: 101, h: 92 },
  right: { src: require('../../assets/ui_sheet/ui_22.png'), w: 105, h: 92 },
  close: { src: require('../../assets/ui_sheet/ui_10.png'), w: 110, h: 106 },
  music: { src: require('../../assets/ui_sheet/ui_15.png'), w: 94, h: 86 },
  sound: { src: require('../../assets/ui_sheet/ui_13.png'), w: 100, h: 88 },
  btnCream: { src: require('../../assets/ui_sheet/ui_38.png'), w: 176, h: 76 },
  btnRed: { src: require('../../assets/ui_sheet/ui_39.png'), w: 187, h: 78 },
  heart: { src: require('../../assets/ui_sheet/ui_50.png'), w: 56, h: 49 },
  heartOff: { src: require('../../assets/ui_sheet/ui_51.png'), w: 57, h: 50 },
  btnGreen: { src: require('../../assets/ui_sheet/ui_37.png'), w: 180, h: 70 },
};
// Furniture seen from four sides (front, left and right three-quarter, side) so it can be turned
export const ROT_IMAGES = {
  rot_sofa_front: { src: require('../../assets/rot/sofa_front.png'), w: 341, h: 172 },
  rot_sofa_left: { src: require('../../assets/rot/sofa_left.png'), w: 330, h: 180 },
  rot_sofa_right: { src: require('../../assets/rot/sofa_right.png'), w: 290, h: 178 },
  rot_sofa_side: { src: require('../../assets/rot/sofa_side.png'), w: 155, h: 175 },
  rot_armchair_front: { src: require('../../assets/rot/armchair_front.png'), w: 166, h: 190 },
  rot_armchair_left: { src: require('../../assets/rot/armchair_left.png'), w: 167, h: 189 },
  rot_armchair_right: { src: require('../../assets/rot/armchair_right.png'), w: 171, h: 188 },
  rot_armchair_side: { src: require('../../assets/rot/armchair_side.png'), w: 141, h: 169 },
  rot_bed_front: { src: require('../../assets/rot/bed_front.png'), w: 347, h: 212 },
  rot_bed_left: { src: require('../../assets/rot/bed_left.png'), w: 345, h: 215 },
  rot_bed_right: { src: require('../../assets/rot/bed_right.png'), w: 336, h: 215 },
  rot_bed_side: { src: require('../../assets/rot/bed_side.png'), w: 321, h: 201 },
  rot_bookshelf_front: { src: require('../../assets/rot/bookshelf_front.png'), w: 160, h: 249 },
  rot_bookshelf_left: { src: require('../../assets/rot/bookshelf_left.png'), w: 152, h: 248 },
  rot_bookshelf_right: { src: require('../../assets/rot/bookshelf_right.png'), w: 152, h: 249 },
  rot_bookshelf_side: { src: require('../../assets/rot/bookshelf_side.png'), w: 97, h: 244 },
};

// Hanging pots (side view): picture + where the soil sits in it (cx, cy = centre of the soil, sw = its width), all in picture pixels.
export const HPOT_META = {
  macrame: { src: require('../../assets/hpots/r1_01.png'), w: 165, h: 411, cx: 81, cy: 233, sw: 162, cut: 34 },
  macramethin: { src: require('../../assets/hpots/r1_02.png'), w: 136, h: 404, cx: 68, cy: 242, sw: 134, cut: 34 },
  terracotta: { src: require('../../assets/hpots/r1_03.png'), w: 183, h: 385, cx: 86, cy: 235, sw: 181, cut: 34 },
  basket: { src: require('../../assets/hpots/r1_04.png'), w: 199, h: 363, cx: 100, cy: 242, sw: 198, cut: 34 },
  chain: { src: require('../../assets/hpots/r1_05.png'), w: 196, h: 363, cx: 97, cy: 241, sw: 194, cut: 34 },
  bowl: { src: require('../../assets/hpots/r1_06.png'), w: 149, h: 359, cx: 73, cy: 234, sw: 147, cut: 34 },
  barrel: { src: require('../../assets/hpots/r1_07.png'), w: 177, h: 362, cx: 90, cy: 239, sw: 176, cut: 0 },
};
export const HPOT_ORDER = ["macrame", "macramethin", "terracotta", "basket", "chain", "bowl", "barrel"];
// Plants made for the hanging pots (no pot in the picture): three growth stages each.
export const HPLANT_IMAGES = {
  Philodendron: [{ src: require('../../assets/hplants/philodendron_1.png'), w: 213, h: 334 }, { src: require('../../assets/hplants/philodendron_2.png'), w: 344, h: 357 }, { src: require('../../assets/hplants/philodendron_3.png'), w: 558, h: 375 }],
  petunia: [{ src: require('../../assets/hplants/petunia_1.png'), w: 215, h: 318 }, { src: require('../../assets/hplants/petunia_2.png'), w: 365, h: 342 }, { src: require('../../assets/hplants/petunia_3.png'), w: 657, h: 395 }],
  jasmine: [{ src: require('../../assets/hplants/jasmine_1.png'), w: 191, h: 313 }, { src: require('../../assets/hplants/jasmine_2.png'), w: 320, h: 358 }, { src: require('../../assets/hplants/jasmine_3.png'), w: 458, h: 374 }],
  Bougainvillea: [{ src: require('../../assets/hplants/bougainvillea_1.png'), w: 211, h: 297 }, { src: require('../../assets/hplants/bougainvillea_2.png'), w: 354, h: 343 }, { src: require('../../assets/hplants/bougainvillea_3.png'), w: 678, h: 395 }],
};

// Shelf pots (35 styles): picture + where the soil sits in it (cx, cy = centre of the soil, sw = its width), in picture pixels.
export const PPOT_META = {
  1: { src: require('../../assets/ppots/pot_01.png'), w: 195, h: 181, cx: 99, cy: 40, sw: 188 },
  2: { src: require('../../assets/ppots/pot_02.png'), w: 206, h: 188, cx: 102, cy: 43, sw: 200 },
  3: { src: require('../../assets/ppots/pot_03.png'), w: 170, h: 175, cx: 85, cy: 34, sw: 155 },
  4: { src: require('../../assets/ppots/pot_04.png'), w: 178, h: 191, cx: 85, cy: 39, sw: 174 },
  5: { src: require('../../assets/ppots/pot_05.png'), w: 172, h: 174, cx: 85, cy: 34, sw: 168 },
  6: { src: require('../../assets/ppots/pot_06.png'), w: 222, h: 205, cx: 109, cy: 46, sw: 216 },
  7: { src: require('../../assets/ppots/pot_07.png'), w: 191, h: 192, cx: 94, cy: 40, sw: 184 },
  8: { src: require('../../assets/ppots/pot_08.png'), w: 223, h: 181, cx: 112, cy: 38, sw: 218 },
  9: { src: require('../../assets/ppots/pot_09.png'), w: 183, h: 183, cx: 91, cy: 36, sw: 180 },
  10: { src: require('../../assets/ppots/pot_10.png'), w: 193, h: 183, cx: 96, cy: 42, sw: 190 },
  11: { src: require('../../assets/ppots/pot_11.png'), w: 183, h: 169, cx: 89, cy: 46, sw: 178 },
  12: { src: require('../../assets/ppots/pot_12.png'), w: 176, h: 187, cx: 89, cy: 35, sw: 166 },
  13: { src: require('../../assets/ppots/pot_13.png'), w: 184, h: 181, cx: 87, cy: 35, sw: 181 },
  14: { src: require('../../assets/ppots/pot_14.png'), w: 184, h: 178, cx: 91, cy: 36, sw: 181 },
  15: { src: require('../../assets/ppots/pot_15.png'), w: 208, h: 184, cx: 125, cy: 77, sw: 202 },
  16: { src: require('../../assets/ppots/pot_16.png'), w: 202, h: 166, cx: 103, cy: 37, sw: 199 },
  17: { src: require('../../assets/ppots/pot_17.png'), w: 172, h: 161, cx: 85, cy: 32, sw: 161 },
  18: { src: require('../../assets/ppots/pot_18.png'), w: 178, h: 177, cx: 88, cy: 33, sw: 174 },
  19: { src: require('../../assets/ppots/pot_19.png'), w: 174, h: 171, cx: 86, cy: 33, sw: 170 },
  20: { src: require('../../assets/ppots/pot_20.png'), w: 199, h: 179, cx: 125, cy: 92, sw: 193 },
  21: { src: require('../../assets/ppots/pot_21.png'), w: 181, h: 171, cx: 87, cy: 36, sw: 176 },
  22: { src: require('../../assets/ppots/pot_22.png'), w: 172, h: 176, cx: 85, cy: 32, sw: 167 },
  23: { src: require('../../assets/ppots/pot_23.png'), w: 225, h: 173, cx: 111, cy: 36, sw: 220 },
  24: { src: require('../../assets/ppots/pot_24.png'), w: 173, h: 186, cx: 85, cy: 31, sw: 169 },
  25: { src: require('../../assets/ppots/pot_25.png'), w: 194, h: 169, cx: 98, cy: 41, sw: 190 },
  26: { src: require('../../assets/ppots/pot_26.png'), w: 230, h: 220, cx: 116, cy: 43, sw: 222 },
  27: { src: require('../../assets/ppots/pot_27.png'), w: 176, h: 178, cx: 84, cy: 35, sw: 172 },
  28: { src: require('../../assets/ppots/pot_28.png'), w: 183, h: 186, cx: 90, cy: 36, sw: 179 },
  29: { src: require('../../assets/ppots/pot_29.png'), w: 183, h: 188, cx: 93, cy: 37, sw: 167 },
  30: { src: require('../../assets/ppots/pot_30.png'), w: 191, h: 187, cx: 93, cy: 35, sw: 172 },
  31: { src: require('../../assets/ppots/pot_31.png'), w: 179, h: 186, cx: 85, cy: 37, sw: 176 },
  32: { src: require('../../assets/ppots/pot_32.png'), w: 215, h: 189, cx: 107, cy: 33, sw: 212 },
  33: { src: require('../../assets/ppots/pot_33.png'), w: 187, h: 170, cx: 96, cy: 40, sw: 183 },
  34: { src: require('../../assets/ppots/pot_34.png'), w: 194, h: 188, cx: 97, cy: 45, sw: 189 },
  35: { src: require('../../assets/ppots/pot_35.png'), w: 206, h: 183, cx: 101, cy: 33, sw: 191 },
};
export const PPOT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
// Plants made for the shelf pots (no pot in the picture): three growth stages each.
export const PPLANT_IMAGES = {
  daisy: [{ src: require('../../assets/pplants/daisy_1.png'), w: 257, h: 265 }, { src: require('../../assets/pplants/daisy_2.png'), w: 415, h: 365 }, { src: require('../../assets/pplants/daisy_3.png'), w: 551, h: 413 }],
  snapdragon: [{ src: require('../../assets/pplants/snapdragon_1.png'), w: 244, h: 351 }, { src: require('../../assets/pplants/snapdragon_2.png'), w: 400, h: 432 }, { src: require('../../assets/pplants/snapdragon_3.png'), w: 564, h: 455 }],
  poppy: [{ src: require('../../assets/pplants/poppy_1.png'), w: 269, h: 325 }, { src: require('../../assets/pplants/poppy_2.png'), w: 447, h: 424 }, { src: require('../../assets/pplants/poppy_3.png'), w: 684, h: 439 }],
  marigold: [{ src: require('../../assets/pplants/marigold_1.png'), w: 275, h: 294 }, { src: require('../../assets/pplants/marigold_2.png'), w: 398, h: 346 }, { src: require('../../assets/pplants/marigold_3.png'), w: 617, h: 396 }],
  peony: [{ src: require('../../assets/pplants/peony_1.png'), w: 321, h: 280 }, { src: require('../../assets/pplants/peony_2.png'), w: 480, h: 401 }, { src: require('../../assets/pplants/peony_3.png'), w: 697, h: 430 }],
  hydrenga: [{ src: require('../../assets/pplants/hydrangea_1.png'), w: 423, h: 408 }, { src: require('../../assets/pplants/hydrangea_2.png'), w: 577, h: 606 }, { src: require('../../assets/pplants/hydrangea_3.png'), w: 736, h: 738 }],
  rose: [{ src: require('../../assets/pplants/rose_1.png'), w: 307, h: 303 }, { src: require('../../assets/pplants/rose_2.png'), w: 417, h: 372 }, { src: require('../../assets/pplants/rose_3.png'), w: 623, h: 450 }],
};

// Watering cans: blue (everyone has it) and the red premium one (sold at the nursery, waters twice as fast). up = resting, tilt = while pouring.
export const CAN_IMAGES = {
  blue: { up: { src: require('../../assets/cans2/blue_up.png'), w: 534, h: 416 }, tilt: { src: require('../../assets/cans2/blue_mid.png'), w: 497, h: 396 }, mid: { src: require('../../assets/cans2/blue_mid.png'), w: 497, h: 396 }, pour: [{ src: require('../../assets/cans2/blue_pour1.png'), w: 555, h: 583 }, { src: require('../../assets/cans2/blue_pour2.png'), w: 551, h: 638 }] },
  red: { up: { src: require('../../assets/cans2/red_up.png'), w: 534, h: 416 }, tilt: { src: require('../../assets/cans2/red_mid.png'), w: 497, h: 396 }, mid: { src: require('../../assets/cans2/red_mid.png'), w: 497, h: 396 }, pour: [{ src: require('../../assets/cans2/red_pour1.png'), w: 555, h: 583 }, { src: require('../../assets/cans2/red_pour2.png'), w: 551, h: 638 }] },
};
export const LOBBY_BG = require('../../assets/building/lobby.png');   // the apartment building's entrance hall
export const APT_ART = {   // the empty rooms: picture + its pixel size
  1: { src: require('../../assets/building/apt1.png'), w: 1672, h: 941 },
  2: { src: require('../../assets/building/apt2.png'), w: 2000, h: 625 },
  3: { src: require('../../assets/building/apt3.png'), w: 2000, h: 667 },
};
export const BUILDING_BG = require('../../assets/building/building.png');   // the apartment building, three floors
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

// The shop's two picture buttons (Add to Cart, Cashier).
export const PLAY_BTN = { src: require('../../assets/ui_shop/play.png'), w: 800, h: 326 };   // the first screen's Play button
export const SHOP_BTN = { add: require('../../assets/ui_shop/add_to_cart.png'), cashier: require('../../assets/ui_shop/cashier.png') };
