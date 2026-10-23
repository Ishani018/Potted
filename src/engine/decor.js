import { FURNITURE_ITEMS } from './furnitureItems';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES, PAINTING_IMAGES } from './assets';

// Everything you can put in a flat. kind: 'floor' (stands on the floor, y = its feet),
// 'hang' (hangs from the ceiling beams) or 'wall' (a painting on the wall). size = height as a fraction of the room.
const PLANTS = ['daisy', 'snapdragon', 'poppy', 'marigold', 'peony', 'hydrenga', 'rose'];
const HANGERS = ['stringofpearls', 'Philodendron', 'jasmine', 'petunia', 'Bougainvillea'];

export const DECOR = {};
// bf = where the pot's bottom edge sits inside the picture (0..1), so a stand can be slid right under it
const POT_BOTTOM = { daisy: 0.864, snapdragon: 0.864, marigold: 0.864, rose: 0.864, poppy: 1, peony: 1, hydrenga: 1 };
PLANTS.forEach((k) => { DECOR['p_' + k] = { key: 'p_' + k, kind: 'floor', img: POTTED_PLANT_IMAGES[k][2], size: 0.26, plant: true, bf: POT_BOTTOM[k] }; });
HANGERS.forEach((k) => { DECOR['h_' + k] = { key: 'h_' + k, kind: 'hang', img: HANGING_PLANT_IMAGES[k][2], size: 0.26 }; });
Object.keys(PAINTING_IMAGES).forEach((k) => { DECOR['w_' + k] = { key: 'w_' + k, kind: 'wall', img: PAINTING_IMAGES[k], size: 0.2, painting: k }; });

// What a potted plant stands on. w = stand width as a fraction of the plant's box, ratio = its height / width.
// Furniture cut from the sprite sheets. Height as a fraction of the room follows the picture's own pixel size,
// so pieces from one sheet keep their proportions. Rugs lie flat on the floor (drawn skewed, under everything).
FURNITURE_ITEMS.forEach((f) => {
  const n = Number(f.key.split('_')[1]);
  const set = f.key.startsWith('g_') ? 'green' : f.key.startsWith('pk_') ? 'pink' : n <= 26 ? 'purple' : 'red';
  DECOR[f.key] = { key: f.key, kind: 'floor', img: f.img, furniture: true, set, rug: f.rug, aspect: f.w / f.h, size: f.h * 0.0011 * (f.rug ? 1.9 : 1) };
});

export const STANDS = {
  stool:    { img: require('../../assets/building/stand_stool.png'), w: 0.55, ratio: 224 / 256 },
  tall:     { img: require('../../assets/building/stand_tall.png'),  w: 0.4,  ratio: 432 / 256 },
  pedestal: { img: require('../../assets/building/pedestal.png'),    w: 0.5,  ratio: 336 / 256 },
};
export const STAND_ORDER = ['stool', 'tall', 'pedestal', 'none'];
export const standOf = (item) => (item.stand === undefined ? 'stool' : item.stand);

// tabs: each furniture colour set, then plants, hanging plants and art
export const DECOR_TABS = [
  { id: 'green',  label: 'GREEN',   match: (d) => d.furniture && d.set === 'green' },
  { id: 'purple', label: 'PURPLE',  match: (d) => d.furniture && d.set === 'purple' },
  { id: 'red',    label: 'RED',     match: (d) => d.furniture && d.set === 'red' },
  { id: 'pink',   label: 'CREAM',   match: (d) => d.furniture && d.set === 'pink' },
  { id: 'floor',  label: 'PLANTS',  match: (d) => d.kind === 'floor' && !d.furniture },
  { id: 'hang',   label: 'HANGING', match: (d) => d.kind === 'hang' },
  { id: 'wall',   label: 'ART',     match: (d) => d.kind === 'wall' },
];

// where a new item first appears and how far it may be dragged (fractions of the room picture)
export const DECOR_START_Y = { floor: 0.86, hang: 0.2, wall: 0.3 };
export const DECOR_Y_RANGE = { floor: [0.68, 0.99], hang: [0.12, 0.45], wall: [0.18, 0.55] };
