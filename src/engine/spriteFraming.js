// Where each customer sprite's figure sits inside its 400×600 canvas, as fractions
// (measured from the PNGs): top = where the head starts, h = figure height,
// cx = horizontal centre of the head. Used to frame face portraits — the kids
// (Finn, Posy) stand lower in the canvas than the adults.
export const SPRITE_FRAMING = {
  ben:     { top: 0.155, h: 0.82,  cx: 0.493 },
  clara:   { top: 0.158, h: 0.817, cx: 0.521 },
  finn:    { top: 0.295, h: 0.68,  cx: 0.521 },
  iris:    { top: 0.148, h: 0.827, cx: 0.527 },
  maemae:  { top: 0.163, h: 0.81,  cx: 0.458 },
  marisol: { top: 0.153, h: 0.822, cx: 0.518 },
  nori:    { top: 0.187, h: 0.788, cx: 0.487 },
  posy:    { top: 0.307, h: 0.668, cx: 0.481 },
  theo:    { top: 0.157, h: 0.818, cx: 0.529 },
  walt:    { top: 0.14,  h: 0.833, cx: 0.496 },
};
export const DEFAULT_FRAMING = { top: 0.14, h: 0.82, cx: 0.5 };
