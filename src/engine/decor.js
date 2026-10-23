import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES, PAINTING_IMAGES } from './assets';

// Everything you can put in a flat. kind: 'floor' (stands on the floor, y = its feet),
// 'hang' (hangs from the ceiling beams) or 'wall' (a painting on the wall). size = height as a fraction of the room.
const PLANTS = ['daisy', 'snapdragon', 'poppy', 'marigold', 'peony', 'hydrenga', 'rose'];
const HANGERS = ['stringofpearls', 'Philodendron', 'jasmine', 'petunia', 'Bougainvillea'];

export const DECOR = {};
PLANTS.forEach((k) => { DECOR['p_' + k] = { key: 'p_' + k, kind: 'floor', img: POTTED_PLANT_IMAGES[k][2], size: 0.26 }; });
HANGERS.forEach((k) => { DECOR['h_' + k] = { key: 'h_' + k, kind: 'hang', img: HANGING_PLANT_IMAGES[k][2], size: 0.26 }; });
Object.keys(PAINTING_IMAGES).forEach((k) => { DECOR['w_' + k] = { key: 'w_' + k, kind: 'wall', img: PAINTING_IMAGES[k], size: 0.2, painting: k }; });

export const DECOR_TABS = [
  { id: 'floor', label: 'PLANTS' },
  { id: 'hang',  label: 'HANGING' },
  { id: 'wall',  label: 'ART' },
];

// where a new item first appears and how far it may be dragged (fractions of the room picture)
export const DECOR_START_Y = { floor: 0.86, hang: 0.2, wall: 0.3 };
export const DECOR_Y_RANGE = { floor: [0.68, 0.99], hang: [0.12, 0.45], wall: [0.18, 0.55] };
