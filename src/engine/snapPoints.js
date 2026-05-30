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
      { id: 'r1_p1', x: 208, y: 530 }, // leftmost
      { id: 'r1_p2', x: 374, y: 530 },
      { id: 'r1_p3', x: 567, y: 530 }, // center
      { id: 'r1_p4', x: 754, y: 530 },
      { id: 'r1_p5', x: 944, y: 530 }, // rightmost
      // Bottom shelf: 4 pots. Shelf surface y ≈ 638. x spacing ≈ 192px.
      { id: 'r1_p6', x: 282, y: 730 }, // leftmost
      { id: 'r1_p7', x: 474, y: 730 },
      { id: 'r1_p8', x: 664, y: 730 },
      { id: 'r1_p9', x: 856, y: 730 }, // rightmost
      // ────────────────────────────────────────────────────────────────────────
    ],
    hanging: [],
  },
  2: {
    potted: [],
    hanging: [
      { id: 'r2_h1', x: 235, y: 54 },
      { id: 'r2_h2', x: 385, y: 54 },
      { id: 'r2_h3', x: 528, y: 54 },
      { id: 'r2_h4', x: 234, y: 311 },
      { id: 'r2_h5', x: 386, y: 311 },
      { id: 'r2_h6', x: 527, y: 311 },
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

// Watering can decorative positions per room (anchor: center of can)
export const WATERING_CAN_POSITIONS = {
  1: { x: 1235, y: 280 },
  2: { x: 1099, y: 469 },
  3: { x: 1118, y: 420 },
};

// Room 2 decor positions
export const DECOR_POSITIONS = {
  room2: {
    photoFrame: { x: 1093, y: 130 },
  },
};

// Draggable pot source positions per room (anchor: bottom-center, like pots)
export const POT_SOURCE_POSITIONS = {
  1: { x: 100, y: 348 },
  3: { x: 120, y: 600 },
};

export const SNAP_RADIUS = 40;

// Window sill storage slots — room 1 only
// Bags bottom-anchored to ledge surface (y≈330), center = 330-70 = 260
// Daisy hint at x=170, slots step by exactly one bag width (140)
const RAW_SILL_POINTS = [
  { id: 'sill_1', x: 190, y: 275 }, // matches ghost bag position exactly
  { id: 'sill_2', x: 320, y: 275 },
  { id: 'sill_3', x: 450, y: 275 },
  { id: 'sill_4', x: 580, y: 275 },
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
const RAW_CART_ZONE = { x1: 856, y1: 560, x2: 1310, y2: 615 };

export function getCartZone(screenWidth, screenHeight) {
  const tl = projectPoint(RAW_CART_ZONE.x1, RAW_CART_ZONE.y1, screenWidth, screenHeight);
  const br = projectPoint(RAW_CART_ZONE.x2, RAW_CART_ZONE.y2, screenWidth, screenHeight);
  return { x1: tl.x, y1: tl.y, x2: br.x, y2: br.y };
}

export function isInCartZone(x, y, screenWidth, screenHeight) {
  const z = getCartZone(screenWidth, screenHeight);
  return x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2;
}

// Fixed grid slots on the cart bed: 2 rows × 4 cols.
// Returns array of { x, y } screen positions for up to 8 items.
export function getCartBedSlots(screenWidth, screenHeight) {
  const z = getCartZone(screenWidth, screenHeight);
  const cols = 4;
  const rows = 2;
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
