import { projectPoint } from './project';

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
    return { id: pt.id, x: p.x, y: p.y };
  });
}

// Raw snap coordinates — anchor: bottom-center for pots, top-center for hanging
const RAW_SNAP_POINTS = {
  1: {
    potted: [
      // ── Room 1 pot positions (base coords, 1376×768 image) ──────────────────
      // y = shelf surface (pot bottoms anchor here). Increase y to move pots DOWN.
      // x spacing between pots on top shelf = ~186px. Decrease to pack tighter.
      // Top shelf: 5 pots. Shelf surface y ≈ 490.
      { id: 'r1_p1', x: 340, y: 400 }, // leftmost
      { id: 'r1_p2', x: 516, y: 400 },
      { id: 'r1_p3', x: 709, y: 400 }, // center
      { id: 'r1_p4', x: 896, y: 400 },
      { id: 'r1_p5', x: 1060, y: 400 }, // rightmost
      // Bottom shelf: 4 pots. Shelf surface y ≈ 638. x spacing ≈ 192px.
      { id: 'r1_p6', x: 424, y: 630 }, // leftmost
      { id: 'r1_p7', x: 616, y: 630 },
      { id: 'r1_p8', x: 806, y: 630 },
      { id: 'r1_p9', x: 998, y: 630 }, // rightmost
      // ────────────────────────────────────────────────────────────────────────
    ],
    hanging: [],
  },
  2: {
    potted: [],
    hanging: [
      // ── Room 2 hanging snap points (base coords, 1376×768) ──────────────────
      // Anchor: top-center (where the rope meets the rod).
      // y = rod height. Increase y to move hooks DOWN the rod.
      // x = horizontal position. Adjust spacing to spread across the rod.
      //
      // Rod 1 (top rod) — 4 hooks
      { id: 'r2_h1', x: 310, y: 60 }, // leftmost
      { id: 'r2_h2', x: 415, y: 60 },
      { id: 'r2_h3', x: 520, y: 60 },
      { id: 'r2_h4', x: 625, y: 60 }, // rightmost
      //
      // Rod 2 (bottom rod) — 4 hooks
      { id: 'r2_h5', x: 310, y: 360 }, // leftmost
      { id: 'r2_h6', x: 415, y: 360 },
      { id: 'r2_h7', x: 520, y: 360 },
      { id: 'r2_h8', x: 625, y: 360 }, // rightmost
      // ────────────────────────────────────────────────────────────────────────
    ],
  },
  3: {
    potted: [
      { id: 'r3_p1', x: 215, y: 584 },
      { id: 'r3_p2', x: 334, y: 584 },
      { id: 'r3_p3', x: 470, y: 584 },
      { id: 'r3_p4', x: 579, y: 584 },
      { id: 'r3_p5', x: 695, y: 584 },
      { id: 'r3_p6', x: 975, y: 412 },
    ],
    hanging: [
      { id: 'r3_h1', x: 379, y: 72 },
      { id: 'r3_h2', x: 544, y: 72 },
      { id: 'r3_h3', x: 706, y: 72 },
      { id: 'r3_h4', x: 852, y: 72 },
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
  1: { x: 1135, y: 130 },  // ← Room 1: on window sill right side
  2: { x: 1255, y: 405 },  // ← Room 2: on stool, left of pot — CHANGE THIS
  3: { x: 1118, y: 420 },  // ← Room 3
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
    // Back row — offset RIGHT (nestles into the gaps of the front row)
    { id: 'r2_sill_1', x: 160, y: 655 },
    { id: 'r2_sill_2', x: 265, y: 655 },
    { id: 'r2_sill_3', x: 370, y: 655 },
    // Front row — offset LEFT & down (opposite diagonal to the back row)
    { id: 'r2_sill_4', x: 110, y: 700 },
    { id: 'r2_sill_5', x: 215, y: 700 },
    { id: 'r2_sill_6', x: 320, y: 700 },
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
  1: { x: 222, y: 190 },   // ← Room 1 window sill pot — CHANGE THIS
  2: { x: 105, y: 440 },    // ← Room 2 railing pot — CHANGE THIS
  3: { x: 120, y: 600 },
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
  { id: 'sill_1', x: 300, y: 125 },  // slot 1 — leftmost (ghost bag position)
  { id: 'sill_2', x: 415, y: 125 },  // slot 2  (115px gap)
  { id: 'sill_3', x: 530, y: 125 },  // slot 3  (115px gap)
  { id: 'sill_4', x: 645, y: 125 },  // slot 4
  { id: 'sill_5', x: 760, y: 125 },  // slot 5 — rightmost
];

export function getSillPoints(screenWidth, screenHeight) {
  return RAW_SILL_POINTS.map((pt) => {
    const p = projectPoint(pt.x, pt.y, screenWidth, screenHeight);
    return { id: pt.id, x: p.x, y: p.y };
  });
}

// ─── Nursery cart drop zone (the cart bed in the nursery background) ──────────
// Poly corners: (943.7,576.6) (856.6,637.3) (1257.9,641.9) (1309.5,577.7)
// Treated as a rectangle covering the cart bed — seeds can be dropped anywhere
// inside it and stay where they're dropped.
const RAW_CART_ZONE = { x1: 856, y1: 540, x2: 1310, y2: 595 };

export function getCartZone(screenWidth, screenHeight) {
  const tl = projectPoint(RAW_CART_ZONE.x1, RAW_CART_ZONE.y1, screenWidth, screenHeight);
  const br = projectPoint(RAW_CART_ZONE.x2, RAW_CART_ZONE.y2, screenWidth, screenHeight);
  return { x1: tl.x, y1: tl.y, x2: br.x, y2: br.y };
}

export function isInCartZone(x, y, screenWidth, screenHeight) {
  const z = getCartZone(screenWidth, screenHeight);
  return x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2;
}

// Fixed grid slots on the cart bed: 2 rows × 4 cols = 8 slots.
export function getCartBedSlots(screenWidth, screenHeight) {
  const z = getCartZone(screenWidth, screenHeight);
  const cols = 4, rows = 2;
  const slots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        x: z.x1 + (z.x2 - z.x1) * (c + 0.5) / cols,
        y: z.y1 + (z.y2 - z.y1) * (r + 0.5) / rows,
      });
    }
  }
  return slots;
}
