import { FURNITURE_ITEMS } from './furnitureItems';
import { ROT_IMAGES, POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES, PAINTING_IMAGES } from './assets';

// Everything you can put in a flat. kind: 'floor' (stands on the floor, y = its feet),
// 'hang' (hangs from the ceiling beams) or 'wall' (a painting on the wall). size = height as a fraction of the room.
const PLANTS = ['daisy', 'snapdragon', 'poppy', 'marigold', 'peony', 'hydrenga', 'rose'];
const HANGERS = ['stringofpearls', 'Philodendron', 'jasmine', 'petunia', 'Bougainvillea'];

export const DECOR = {};
// bf = where the pot's bottom edge sits inside the picture (0..1), so a stand can be slid right under it
const POT_BOTTOM = { daisy: 0.864, snapdragon: 0.864, marigold: 0.864, rose: 0.864, poppy: 1, peony: 1, hydrenga: 1 };
// Plants are drawn with the new art: a shelf pot + its bloom (PottedArt) or a hanging pot + its bloom (HangingArt).
PLANTS.forEach((k) => { DECOR['p_' + k] = { key: 'p_' + k, kind: 'floor', img: POTTED_PLANT_IMAGES[k][2], size: 0.26, plant: true, bf: 1, newPlant: true, plantKey: k }; });
HANGERS.forEach((k) => { DECOR['h_' + k] = { key: 'h_' + k, kind: 'hang', img: HANGING_PLANT_IMAGES[k][2], size: 0.26, newHang: true, plantKey: k }; });
Object.keys(PAINTING_IMAGES).forEach((k) => { DECOR['w_' + k] = { key: 'w_' + k, kind: 'wall', img: PAINTING_IMAGES[k], size: 0.2, painting: k }; });

// What a potted plant stands on. w = stand width as a fraction of the plant's box, ratio = its height / width.
// Furniture cut from the sprite sheets. The sheets draw every piece to fit its cell, so a bookshelf and a sofa came out
// the same size; heights here are real-world metres by piece type (1 m = 0.25 of the room's height).
// Rugs lie flat on the floor (drawn skewed, under everything).
const M = {
  sofa: 0.95, armchair: 1.05, coffeetable: 0.62, console: 0.85, lamp: 1.7, sidetable: 0.6, tvstand: 0.6, bookshelf: 2, cabinet: 1.9,
  wardrobe: 2.1, dresser: 1.25, desk: 0.9, chair: 1, roundtable: 0.75, bed: 1.25, nightstand: 0.65, vanity: 1.6, mirror: 1.8,
  bigdresser: 1, fireplace: 1.35, window: 1.35, ottoman: 0.55, coatrack: 1.8, sink: 1, stove: 1, potrack: 0.6, hutch: 1.9, diningtable: 0.8, fridge: 1.8, bench: 0.5, plant: 0.7,
};
const T = {
  g: ['sofa', 'armchair', 'armchair', 'coffeetable', 'console', 'lamp', 'sidetable', 'tvstand', 'bookshelf', 'cabinet', 'wardrobe', 'dresser', 'desk', 'chair', 'roundtable', 'chair', 'bed', 'bed', 'nightstand', 'nightstand', 'vanity', 'mirror', 'bigdresser', 'coatrack', 'sink', 'stove', 'potrack', 'console', 'hutch', 'diningtable', 'chair', 'chair', 'fridge'],
  pr: ['sofa', 'armchair', 'coffeetable', 'bookshelf', 'lamp', 'sidetable', 'tvstand', 'mirror', 'bed', 'wardrobe', 'vanity', 'desk', 'cabinet', 'dresser', 'rug', 'sink', 'stove', 'potrack', 'fridge', 'diningtable', 'chair', 'bench', 'console', 'coatrack', 'coatrack', 'plant',
       'sofa', 'armchair', 'coffeetable', 'bookshelf', 'lamp', 'sidetable', 'tvstand', 'mirror', 'bed', 'nightstand', 'wardrobe', 'vanity', 'rug', 'cabinet', 'bigdresser', 'rug', 'sink', 'stove', 'potrack', 'fridge', 'chair', 'bench', 'console', 'plant'],
  // sharper sheets (gb/gl green, rl/rb red, pp pink); where one exists, the old piece of the same colour and type is hidden
  gb: ['bed', 'dresser', 'armchair', 'sidetable', 'cabinet', 'lamp', 'ottoman', 'tvstand', 'rug'],
  gl: ['sofa', 'armchair', 'coffeetable', 'bookshelf', 'lamp', 'sidetable', 'tvstand', 'rug'],
  rl: ['fireplace', 'window', 'armchair', 'hutch', 'armchair', 'ottoman', 'coffeetable', 'plant', 'rug', 'tvstand'],
  rb: ['bed', 'dresser', 'vanity', 'wardrobe', 'ottoman', 'lamp', 'nightstand', 'bench', 'rug'],
  pp: ['sofa', 'armchair', 'coffeetable', 'bookshelf', 'lamp', 'sidetable', 'tvstand', 'rug'],
  pk: [null, null, null, null, null, null, null, null, 'sofa', 'armchair', 'coffeetable', 'bookshelf', 'lamp', 'sidetable', 'tvstand', 'rug'],
};
// pr numbering skips 39 and 42 (pieces that stuck together), so its list above runs 1-38 then 40-41 then 43-50
const PR_NUMS = [...Array(38).keys()].map((i) => i + 1).concat([40, 41], [...Array(8).keys()].map((i) => i + 43));
const typeOf = (key) => {
  const [pre, num] = key.split('_'); const n = Number(num);
  if (pre === 'pr') return T.pr[PR_NUMS.indexOf(n)];
  return T[pre][n - 1];
};
const NEW_SETS = { gb: 'green', gl: 'green', rl: 'red', rb: 'red', pp: 'pink' };
const setOf = (f) => (NEW_SETS[f.key.split('_')[0]] || (f.key.startsWith('g_') ? 'green' : f.key.startsWith('pk_') ? 'pink' : Number(f.key.split('_')[1]) <= 26 ? 'purple' : 'red'));
const isNew = (f) => !!NEW_SETS[f.key.split('_')[0]];
const covered = new Set();   // `${set}:${type}` that a sharper piece already provides
FURNITURE_ITEMS.filter(isNew).forEach((f) => covered.add(`${setOf(f)}:${typeOf(f.key)}`));
FURNITURE_ITEMS.forEach((f) => {
  const set = setOf(f);
  const type = typeOf(f.key);
  const wallPiece = type === 'potrack' || type === 'window';
  DECOR[f.key] = {
    key: f.key, kind: wallPiece ? 'wall' : 'floor', mount: wallPiece ? 'wall' : undefined, img: f.img, furniture: true, set, rug: f.rug, aspect: f.w / f.h,
    size: f.rug ? f.h * 0.0011 * 1.9 * (isNew(f) ? 0.58 : 1) : (M[type] ?? 0.9) * 0.25,
    hidden: !isNew(f) && covered.has(`${set}:${type}`) ? true : undefined,
  };
});

const VASE_IMG = {
  vase_01: require('../../assets/stands/vase_01.png'),
  vase_02: require('../../assets/stands/vase_02.png'),
  vase_03: require('../../assets/stands/vase_03.png'),
  vase_04: require('../../assets/stands/vase_04.png'),
  vase_05: require('../../assets/stands/vase_05.png'),
  vase_06: require('../../assets/stands/vase_06.png'),
  vase_07: require('../../assets/stands/vase_07.png'),
  vase_08: require('../../assets/stands/vase_08.png'),
};

// Empty vases and planters (a decor tab of their own)
const VASES = { vase_01: 0.9, vase_02: 0.38, vase_03: 0.4, vase_04: 0.55, vase_05: 0.4, vase_06: 0.4, vase_07: 0.55, vase_08: 0.3 };
Object.keys(VASES).forEach((k) => {
  const sz = { vase_01: [254, 463], vase_02: [379, 314], vase_03: [349, 322], vase_04: [293, 362], vase_05: [366, 308], vase_06: [343, 325], vase_07: [317, 344], vase_08: [407, 252] }[k];
  DECOR[k] = { key: k, kind: 'floor', img: VASE_IMG[k], furniture: true, set: 'vase', aspect: sz[0] / sz[1], size: VASES[k] * 0.25 };
});

// Pieces that can be turned: pick one in the tray, then press TURN to walk it round its four views.
export const ROT_VIEWS = ['front', 'left', 'right', 'side'];
const ROT_M = { sofa: 0.95, armchair: 1.05, bed: 1.25, bookshelf: 2 };
Object.keys(ROT_M).forEach((n) => {
  const fh = ROT_IMAGES[`rot_${n}_front`].h;
  ROT_VIEWS.forEach((v) => {
    const f = ROT_IMAGES[`rot_${n}_${v}`], key = `rot_${n}_${v}`;
    DECOR[key] = { key, kind: 'floor', img: f.src, furniture: true, set: 'turn', hidden: v !== 'front', rotGroup: n, aspect: f.w / f.h, size: ROT_M[n] * 0.25 * (f.h / fh) };
  });
});

export const STANDS = {
  stool: { img: require('../../assets/stands/stand_01.png'), w: 0.64, ratio: 206 / 303 },
  pedestal: { img: require('../../assets/stands/stand_03.png'), w: 0.5, ratio: 450 / 222 },
  column: { img: require('../../assets/stands/stand_04.png'), w: 0.5, ratio: 394 / 222 },
  crate: { img: require('../../assets/stands/stand_05.png'), w: 0.62, ratio: 251 / 333 },
  wicker: { img: require('../../assets/stands/stand_06.png'), w: 0.56, ratio: 349 / 273 },
  iron: { img: require('../../assets/stands/stand_07.png'), w: 0.5, ratio: 355 / 276 },
  tiers: { img: require('../../assets/stands/stand_02.png'), w: 0.4, ratio: 452 / 255 },
  ladder: { img: require('../../assets/stands/stand_08.png'), w: 0.6, ratio: 396 / 336 },
};
// only the stands that sat naturally under the pots (the stool, wicker, crate, tiers and ladder were dropped)
export const STAND_ORDER = ['pedestal', 'column', 'iron', 'none'];
export const standOf = (item) => (item.stand === 'none' ? 'none' : (STAND_ORDER.includes(item.stand) ? item.stand : 'pedestal'));

// tabs: each furniture colour set, then plants, hanging plants and art
export const DECOR_TABS = [
  { id: 'green',  label: 'GREEN',   match: (d) => d.furniture && d.set === 'green' && !d.hidden },
  { id: 'purple', label: 'PURPLE',  match: (d) => d.furniture && d.set === 'purple' && !d.hidden },
  { id: 'red',    label: 'RED',     match: (d) => d.furniture && d.set === 'red' && !d.hidden },
  { id: 'pink',   label: 'CREAM',   match: (d) => d.furniture && d.set === 'pink' && !d.hidden },
  { id: 'turn',   label: 'TURN',    match: (d) => d.furniture && d.set === 'turn' && !d.hidden },
  { id: 'vase',   label: 'VASES',   match: (d) => d.furniture && d.set === 'vase' },
  { id: 'floor',  label: 'PLANTS',  match: (d) => d.kind === 'floor' && !d.furniture },
  { id: 'hang',   label: 'HANGING', match: (d) => d.kind === 'hang' },
  { id: 'wall',   label: 'ART',     match: (d) => d.kind === 'wall' },
];

// where a new item first appears and how far it may be dragged (fractions of the room picture)
export const DECOR_START_Y = { floor: 0.86, hang: 0.2, wall: 0.3 };
export const DECOR_Y_RANGE = { floor: [0.1, 0.99], hang: [0.08, 0.5], wall: [0.14, 0.66] };   // see aptGeometry.js for the per-flat floor and wall
