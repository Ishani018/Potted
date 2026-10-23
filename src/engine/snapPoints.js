import { projectPoint, projectSize } from './project';

// Base resolution the snap coordinates were designed against
const BASE_W = 1376;
const BASE_H = 768;

// Project an authored point to screen space, matching resizeMode="cover" on the
// background image (so overlays line up with background features regardless of
// container aspect ratio).
export function scalePoint(rawX, rawY, screenWidth, screenHeight) {
  return projectPoint(rawX, rawY, screenWidth, screenHeight);
}

// Returns array of { id, x, y } for the given room and type, projected to screen
export function getSnapPoints(room, type, screenWidth, screenHeight) {
  const raw = RAW_SNAP_POINTS[room]?.[type] ?? [];
  return raw.map((pt) => {
    const p = projectPoint(pt.x, pt.y, screenWidth, screenHeight);
    return { id: pt.id, x: p.x, y: p.y, wire: pt.wire ? projectSize(pt.wire, screenWidth, screenHeight) : 0 };
  });
}

// Raw snap coordinates — anchor: bottom-center for pots, top-center for hanging
const RAW_SNAP_POINTS = {
  1: {
    // the greenhouse: four pots on the window ledge, five on the long bench
    potted: [
      { id: 'r1_p1', x: 222, y: 317 },
      { id: 'r1_p2', x: 333, y: 317 },
      { id: 'r1_p3', x: 444, y: 317 },
      { id: 'r1_p4', x: 556, y: 317 },
      { id: 'r1_p5', x: 148, y: 441 },
      { id: 'r1_p6', x: 411, y: 441 },
      { id: 'r1_p7', x: 675, y: 441 },
      { id: 'r1_p8', x: 938, y: 441 },
      { id: 'r1_p9', x: 1202, y: 441 },
    ],
    hanging: [],
  },
  2: {
    // the balcony: four pots hang from the painted hooks (y 100) and four straight from the rod (y 66)
    potted: [],
    hanging: [
      { id: 'r2_h1', x: 329, y: 92, wire: 17 },
      { id: 'r2_h2', x: 445, y: 110 },
      { id: 'r2_h3', x: 578, y: 110 },
      { id: 'r2_h4', x: 695, y: 92, wire: 17 },
      { id: 'r2_h5', x: 813, y: 110 },
      { id: 'r2_h6', x: 905, y: 92, wire: 17 },
      { id: 'r2_h7', x: 1000, y: 110 },
      { id: 'r2_h8', x: 1103, y: 92, wire: 17 },
    ],
  },
  3: {
    // the sunroom: eight pots along the sill, twelve on the stone floor, four hooks on the rod
    potted: [
      { id: 'r3_p1', x: 346, y: 467 },
      { id: 'r3_p2', x: 449, y: 467 },
      { id: 'r3_p3', x: 551, y: 467 },
      { id: 'r3_p4', x: 654, y: 467 },
      { id: 'r3_p5', x: 757, y: 467 },
      { id: 'r3_p6', x: 860, y: 467 },
      { id: 'r3_p7', x: 963, y: 467 },
      { id: 'r3_p8', x: 1066, y: 467 },
      { id: 'r3_p9', x: 395, y: 645 },
      { id: 'r3_p10', x: 518, y: 645 },
      { id: 'r3_p11', x: 642, y: 645 },
      { id: 'r3_p12', x: 765, y: 645 },
      { id: 'r3_p13', x: 889, y: 645 },
      { id: 'r3_p14', x: 1012, y: 645 },
      { id: 'r3_p15', x: 461, y: 726 },
      { id: 'r3_p16', x: 584, y: 726 },
      { id: 'r3_p17', x: 708, y: 726 },
      { id: 'r3_p18', x: 831, y: 726 },
      { id: 'r3_p19', x: 955, y: 726 },
      { id: 'r3_p20', x: 1078, y: 726 },
    ],
    hanging: [
      // from the rings on the inner rod
      { id: 'r3_h1', x: 630, y: 135 },
      { id: 'r3_h2', x: 729, y: 135 },
      { id: 'r3_h3', x: 823, y: 135 },
      { id: 'r3_h4', x: 918, y: 135 },
      // straight from the back rod
      { id: 'r3_h5', x: 480, y: 112, wire: 18 },
      { id: 'r3_h6', x: 570, y: 112, wire: 18 },
      { id: 'r3_h7', x: 1000, y: 112, wire: 18 },
      { id: 'r3_h8', x: 1080, y: 112, wire: 18 },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// ROOM 1 — WATERING CAN rest position (anchor: center of can image)
// ──────────────────────────────────────────────────────────────────────────────
// Where the watering can sits when NOT being dragged.
// x = 1235 → near the right edge.  Decrease to move left.
// y = 280  → upper area.           Increase to move down.
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// WATERING CAN rest positions (anchor: center of can image)
// Increase x to move right, increase y to move down.
// ──────────────────────────────────────────────────────────────────────────────
export const WATERING_CAN_POSITIONS = {
  1: { x: 1029, y: 677 },   // greenhouse: on the floor by the bench
  2: { x: 1144, y: 384 },  // balcony: on the rail
  3: { x: 1169, y: 428 },   // sunroom: at the end of the sill
};

// ──────────────────────────────────────────────────────────────────────────────
// ROOM 2 — FLOOR SEED BAG SLOTS (anchor: center of bag)
// Arranged as 2 rows × 3, clustered bottom-left.
//   Back row  (slots 1-3): higher up, smaller y.
//   Front row (slots 4-6): lower & nudged right so bags interlock like a pile.
// y = floor level (increase to move DOWN). x = horizontal (increase to move RIGHT).
// ──────────────────────────────────────────────────────────────────────────────
export const FLOOR_SILL_POINTS = {
  2: [
    { id: 'r2_sill_1', x: 370, y: 661 },
    { id: 'r2_sill_2', x: 469, y: 661 },
    { id: 'r2_sill_3', x: 568, y: 661 },
    { id: 'r2_sill_4', x: 321, y: 710 },
    { id: 'r2_sill_5', x: 420, y: 710 },
    { id: 'r2_sill_6', x: 518, y: 710 },
  ],
};

// Room 2 decor positions
export const DECOR_POSITIONS = {
  room2: {
    photoFrame: { x: 1093, y: 130 },
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// ROOM 1 — DRAGGABLE POT SOURCE on the window sill (anchor: bottom-center)
// ──────────────────────────────────────────────────────────────────────────────
// This is the "infinite pot" the user drags FROM to place pots on shelves.
// x = 100  → near the left edge.  Increase to move right.
// y = 348  → on the sill ledge.   Increase to move down.
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// DRAGGABLE POT SOURCE positions (anchor: bottom-center)
// Room 1: empty pot on window sill (infinite source)
// Room 2: hanging pot on stool (infinite source)
// Increase x to move right, increase y to move down.
// ──────────────────────────────────────────────────────────────────────────────
export const POT_SOURCE_POSITIONS = {
  1: { x: 741, y: 702 },   // greenhouse: floor, right of the seed bags
  2: { x: 214, y: 653 },   // balcony: floor by the door
  3: { x: 247, y: 661 },   // sunroom: floor, left
};

// Hanging-pot source (stool) for rooms with hooks AND a separate shelf pot
// source. Room 2 uses POT_SOURCE_POSITIONS[2] for its only (hanging) pot.
export const HANGING_POT_SOURCE_POSITIONS = {
  3: { x: 247, y: 726 },   // sunroom: floor, below the pot
};

export const SNAP_RADIUS = 40;

// ──────────────────────────────────────────────────────────────────────────────
// ROOM 1 — WINDOW SILL seed bag slots (anchor: center of bag)
// ──────────────────────────────────────────────────────────────────────────────
// These are where seed bags sit on the window sill (up to 4 bags).
// All share the same y = 275 (vertical position on the ledge).
// x values are spaced ~130 px apart. Decrease gap to pack tighter.
//
// ALSO: the Ghost Bag (pulsing hint) uses sill_1's position.
//       It's hardcoded in GardenScreen.js line ~203 as projectPoint(190, 275).
//       If you change sill_1 here, update GardenScreen.js too!
// ──────────────────────────────────────────────────────────────────────────────
const RAW_SILL_POINTS = [
  { id: 'sill_1', x: 132, y: 694 },
  { id: 'sill_2', x: 247, y: 694 },
  { id: 'sill_3', x: 362, y: 694 },
  { id: 'sill_4', x: 477, y: 694 },
  { id: 'sill_5', x: 593, y: 694 },
];

export function getSillPoints(screenWidth, screenHeight) {
  return RAW_SILL_POINTS.map((pt) => {
    const p = projectPoint(pt.x, pt.y, screenWidth, screenHeight);
    return { id: pt.id, x: p.x, y: p.y };
  });
}

// Ordered list of storage-bag slot IDs for a room (room 1 = window sill,
// room 2 = floor bags). Used to find the first free spot when buying a seed.
export function getSillSlotIds(room) {
  if (room === 2) return (FLOOR_SILL_POINTS[2] ?? []).map((p) => p.id);
  if (room === 1) return RAW_SILL_POINTS.map((p) => p.id);
  return [];
}

