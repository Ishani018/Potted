import React from 'react';
import { HERBALIST } from '../constants/gameData';
import CustomerSprite, { SPRITE_ASPECT } from './CustomerSprite';

// The herbalist reuses a customer sprite (HERBALIST.sprite — Granny Mae), so she
// needs no art of her own. `height` is the full height.
export const HERBALIST_ASPECT = SPRITE_ASPECT;

export default function HerbalistSprite({ height = 220, bob = true }) {
  return <CustomerSprite customerKey={HERBALIST.sprite} height={height} bob={bob} />;
}
