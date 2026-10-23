import React from 'react';
import { View, Image } from 'react-native';
import { PPOT_META, PPLANT_IMAGES } from '../engine/assets';

// A shelf pot with its plant growing out of the soil. potW = the pot picture's width in screen pixels.
// stage 0 = bare pot with soil, 1-3 = growth. The plant stands on the soil line; it is wider than the pot at the bigger stages.
const STAGE_W = [0, 0.8, 1.05, 1.3];   // plant width / soil width, per stage
const SINK = 0.06;                      // how far the plant's feet sit below the soil's centre line, as a share of its height

export function pottedLayout(pot, plantKey, stage, potW) {
  const m = PPOT_META[pot] || PPOT_META[4];
  const s = potW / m.w, potH = Math.round(m.h * s);
  const pl = plantKey && stage > 0 ? (PPLANT_IMAGES[plantKey] || [])[Math.min(stage, 3) - 1] : null;
  let pw = 0, ph = 0, plLeft = 0, plTop = 0;
  if (pl) {
    pw = m.sw * s * STAGE_W[Math.min(stage, 3)];
    ph = pw * pl.h / pl.w;
    plLeft = m.cx * s - pw / 2;
    plTop = m.cy * s - ph + ph * SINK;
  }
  // bounding box of pot + plant, so the whole thing can be tapped
  const left = Math.min(0, plLeft), top = Math.min(0, plTop);
  const right = Math.max(potW, plLeft + pw), bottom = potH;
  return { m, s, potH, pl, pw, ph, plLeft, plTop, boxLeft: left, boxTop: top, boxW: Math.round(right - left), boxH: Math.round(bottom - top), anchorX: m.cx * s - left, anchorBottom: bottom - top };
}

export default function PottedArt({ pot = 4, plantKey, stage = 0, potW, wilting, layout }) {
  const L = layout || pottedLayout(pot, plantKey, stage, potW);
  return (
    <View style={{ width: L.boxW, height: L.boxH, opacity: wilting ? 0.6 : 1 }} pointerEvents="none">
      <Image source={L.m.src} style={{ position: 'absolute', left: -L.boxLeft, top: -L.boxTop, width: potW, height: L.potH }} resizeMode="stretch" />
      {L.pl && <Image source={L.pl.src} style={{ position: 'absolute', left: L.plLeft - L.boxLeft, top: L.plTop - L.boxTop, width: L.pw, height: L.ph }} resizeMode="stretch" />}
    </View>
  );
}
