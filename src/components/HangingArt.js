import React from 'react';
import { View, Image } from 'react-native';
import { HPOT_META, HPLANT_IMAGES } from '../engine/assets';

// A hanging pot with its plant on top. `h` = the pot picture's height in screen pixels.
// The plant sits on the soil line and is as wide as the soil (a little more for the bigger stages), so it drapes over the rim.
// stage: 0 = bare pot with soil, 1-3 = growth. plantKey: a key of HPLANT_IMAGES (or null for an empty pot).
const STAGE_W = [0, 0.98, 1.1, 1.18];       // plant width / soil width, per stage
const RAISE = [0, 0.34, 0.3, 0.28];         // how much of the plant's height sits above the soil line

export function hangingBox(pot, h) {
  const m = HPOT_META[pot] || HPOT_META.macrame;
  const s = h / m.h;
  return { w: Math.round(m.w * s), h, hookX: m.cx * s };   // the hook is over the middle of the soil
}

export default function HangingArt({ pot = 'macrame', plantKey, stage = 0, h, wilting }) {
  const m = HPOT_META[pot] || HPOT_META.macrame;
  const s = h / m.h, w = Math.round(m.w * s);
  const pl = plantKey && stage > 0 ? (HPLANT_IMAGES[plantKey] || [])[Math.min(stage, 3) - 1] : null;
  let pw = 0, ph = 0, left = 0, top = 0;
  if (pl) {
    pw = m.sw * s * STAGE_W[Math.min(stage, 3)];
    ph = pw * pl.h / pl.w;
    left = m.cx * s - pw / 2;
    top = m.cy * s - ph * RAISE[Math.min(stage, 3)];
  }
  return (
    <View style={{ width: Math.max(w, pw + Math.max(0, left)), height: h, opacity: wilting ? 0.6 : 1 }} pointerEvents="none">
      <Image source={m.src} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }} resizeMode="stretch" />
      {pl && <Image source={pl.src} style={{ position: 'absolute', left, top, width: pw, height: ph }} resizeMode="stretch" />}
    </View>
  );
}
