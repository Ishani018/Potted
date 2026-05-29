// Base resolution the snap coordinates were designed against
const BASE_W = 1376;
const BASE_H = 768;

export function scalePoint(rawX, rawY, screenWidth, screenHeight) {
  return {
    x: rawX * (screenWidth / BASE_W),
    y: rawY * (screenHeight / BASE_H),
  };
}

// Returns array of { id, x, y } for the given room and type, scaled to screen
export function getSnapPoints(room, type, screenWidth, screenHeight) {
  const raw = RAW_SNAP_POINTS[room]?.[type] ?? [];
  return raw.map((pt) => ({
    id: pt.id,
    x: pt.x * (screenWidth / BASE_W),
    y: pt.y * (screenHeight / BASE_H),
  }));
}

// Raw snap coordinates — anchor: bottom-center for pots, top-center for hanging
const RAW_SNAP_POINTS = {
  1: {
    potted: [
      { id: 'r1_p1', x: 230,  y: 442 },
      { id: 'r1_p2', x: 414,  y: 442 },
      { id: 'r1_p3', x: 601,  y: 442 },
      { id: 'r1_p4', x: 786,  y: 442 },
      { id: 'r1_p5', x: 970,  y: 442 },
      { id: 'r1_p6', x: 323,  y: 598 },
      { id: 'r1_p7', x: 514,  y: 598 },
      { id: 'r1_p8', x: 692,  y: 598 },
      { id: 'r1_p9', x: 899,  y: 598 },
    ],
    hanging: [],
  },
  2: {
    potted: [],
    hanging: [
      { id: 'r2_h1', x: 235, y: 54  },
      { id: 'r2_h2', x: 385, y: 54  },
      { id: 'r2_h3', x: 528, y: 54  },
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

// Watering can decorative positions per room
export const WATERING_CAN_POSITIONS = {
  1: { x: 1067, y: 283 },
  2: { x: 1099, y: 469 },
  3: { x: 1118, y: 420 },
};

// Room 2 decor positions
export const DECOR_POSITIONS = {
  room2: {
    photoFrame: { x: 1093, y: 130 },
  },
};

export const SNAP_RADIUS = 40;
