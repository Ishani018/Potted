import { POTTED_FLOWERS, HANGING_PLANTS } from './gameData';

export const RAW_SHELF_SLOTS = [
  // Row 0 — above the top shelf
  { x: 270, y: 100 }, // P1
  { x: 400, y: 100 }, // P2
  { x: 530, y: 100 }, // P3
  { x: 660, y: 100 }, // P4
  { x: 790, y: 100 }, // P5
  // Shelf 1 (top)
  { x: 270, y: 285 }, // P6
  { x: 400, y: 285 }, // P7
  { x: 530, y: 285 }, // P8
  { x: 660, y: 285 }, // P9
  { x: 790, y: 285 }, // P10
  // Shelf 2 (middle)
  { x: 270, y: 445 }, // P11
  { x: 400, y: 445 }, // P12
  { x: 530, y: 445 }, // P13
  { x: 660, y: 445 }, // P14
  { x: 790, y: 445 }, // P15
];

const SEED_TYPES = [
  ...Object.values(POTTED_FLOWERS).map((f) => ({ key: f.key, name: f.name })),
  ...Object.values(HANGING_PLANTS).map((p) => ({ key: p.key, name: p.name })),
];

// One entry per seed type — no repeats. Add new types to POTTED_FLOWERS or
// HANGING_PLANTS in gameData.js and they appear automatically.
export const ALL_SEEDS = SEED_TYPES;

export const BASE_SEED_SIZE = 140;

// Cart GIF dims — authored against these for CartTransitionScreen positioning, do not change
export const BASE_CART_W = 460;
export const BASE_CART_H = 1040;

// Still cart PNG (landscape, 500×390 native) — used only in RoomCart (garden)
export const BASE_STILL_CART_W = 500;
export const BASE_STILL_CART_H = 390;
