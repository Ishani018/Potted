import React from 'react';
import { View, Image } from 'react-native';
import { HPOT_META, HPLANT_IMAGES } from '../engine/assets';

// A hanging pot with its plant on top. `h` = the whole pot picture's height in screen pixels.
// The pot's own S-hook is cropped off (it looked stuck on top of the rod); the pot hangs from a thin iron wire with a small clip on
// the rod instead, like the painted hooks. `wire` = the wire's length in px (0 when the pot hangs straight from a painted hook).
// The plant sits on the soil line and is as wide as the soil (a little more for the bigger stages), so it drapes over the rim.
// stage: 0 = bare pot with soil, 1-3 = growth. plantKey: a key of HPLANT_IMAGES (or null for an empty pot).
const STAGE_W = [0, 0.98, 1.1, 1.18];       // plant width / soil width, per stage
const RAISE = [0, 0.34, 0.3, 0.28];         // how much of the plant's height sits above the soil line

export function hangingBox(pot, h) {
  const m = HPOT_META[pot] || HPOT_META.macrame;
  const s = h / m.h;
  return { w: Math.round(m.w * s), h: Math.round((m.h - m.cut) * s), hookX: m.cx * s };
}

export default function HangingArt({ pot = 'macrame', plantKey, stage = 0, h, wilting, wire = 0 }) {
  const m = HPOT_META[pot] || HPOT_META.macrame;
  const s = h / m.h, w = Math.round(m.w * s), cut = m.cut * s, vis = Math.round(h - cut);
  const pl = plantKey && stage > 0 ? (HPLANT_IMAGES[plantKey] || [])[Math.min(stage, 3) - 1] : null;
  let pw = 0, ph = 0, left = 0, top = 0;
  if (pl) {
    pw = m.sw * s * STAGE_W[Math.min(stage, 3)];
    ph = pw * pl.h / pl.w;
    left = m.cx * s - pw / 2;
    top = m.cy * s - ph * RAISE[Math.min(stage, 3)] - cut;
  }
  const cx = m.cx * s;
  return (
    <View style={{ width: Math.max(w, pw + Math.max(0, left)), height: vis, opacity: wilting ? 0.6 : 1 }} pointerEvents="none">
      <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: vis, overflow: 'hidden' }}>
        <Image source={m.src} style={{ position: 'absolute', left: 0, top: -cut, width: w, height: h }} resizeMode="stretch" />
      </View>
      {wire > 0 && (
        <>
          <View style={{ position: 'absolute', left: cx - 1.5, top: -wire, width: 3, height: wire + 3, backgroundColor: '#2b2118', borderRadius: 1 }} />
          <View style={{ position: 'absolute', left: cx - 4, top: -wire - 3, width: 8, height: 7, backgroundColor: '#3a2d20', borderRadius: 2, borderWidth: 1, borderColor: '#1c140d' }} />
        </>
      )}
      {pl && <Image source={pl.src} style={{ position: 'absolute', left, top, width: pw, height: ph }} resizeMode="stretch" />}
    </View>
  );
}
