import React from 'react';
import { Image } from 'react-native';
import { BTN_PLATES } from '../engine/assets';

// The cream plate button picture that fits a w x h button best (so the rounded ends never get squashed).
export default function PlateImage({ w, h, style }) {
  const r = w / h;
  let best = BTN_PLATES[0];
  for (const p of BTN_PLATES) if (Math.abs(Math.log(p.ratio / r)) < Math.abs(Math.log(best.ratio / r))) best = p;
  return <Image source={best.src} resizeMode="stretch" pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, style]} />;
}
