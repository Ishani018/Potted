// Where the floor and walls are in each flat's picture (fractions of the picture), measured by eye from the art.
// back = the y where the back wall meets the floor; backL / backR = the floor's back corners (x);
// sideY = the y where the floor's edge reaches the picture's left / right edge; wall = the plaster band wall pieces hang in.
export const APT_GEO = {
  1: { back: 0.70, backL: 0.16, backR: 0.88, sideYL: 0.80, sideYR: 0.78, wall: [0.14, 0.60] },
  2: { back: 0.745, backL: 0.11, backR: 0.96, sideYL: 0.83, sideYR: 0.82, wall: [0.14, 0.66] },
  3: { back: 0.74, backL: 0.06, backR: 0.98, sideYL: 0.80, sideYR: 0.80, wall: [0.14, 0.66] },
};
const BACK_SCALE = 0.7, FRONT_SCALE = 1.15;   // how big a piece is at the back wall vs the front edge, compared with its drawn size

const geo = (aptId) => APT_GEO[aptId] || APT_GEO[1];

// Pieces get smaller toward the back wall, like the room does.
export function depthScale(aptId, y) {
  const g = geo(aptId);
  const t = Math.max(0, Math.min(1, (y - g.back) / (1 - g.back)));
  return BACK_SCALE + (FRONT_SCALE - BACK_SCALE) * t;
}

// Keep a floor piece's feet inside the floor.
export function clampToFloor(aptId, x, y) {
  const g = geo(aptId);
  const yy = Math.max(g.back + 0.005, Math.min(0.995, y));
  const fl = (yy - g.back) / Math.max(0.001, g.sideYL - g.back);
  const fr = (yy - g.back) / Math.max(0.001, g.sideYR - g.back);
  const xmin = g.backL * (1 - Math.min(1, fl)), xmax = g.backR + (1 - g.backR) * Math.min(1, fr);
  return { x: Math.max(xmin + 0.02, Math.min(xmax - 0.02, x)), y: yy };
}

// Wall pieces (paintings, racks) hang on the plaster, not below the wainscot.
export function clampToWall(aptId, x, y, halfH = 0) {
  const g = geo(aptId);
  return { x: Math.max(0.03, Math.min(0.97, x)), y: Math.max(g.wall[0] + halfH, Math.min(g.wall[1] - halfH, y)) };
}
