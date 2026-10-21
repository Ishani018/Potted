import React from 'react';
import { View } from 'react-native';
import { SPRITE_FRAMING, DEFAULT_FRAMING } from '../engine/spriteFraming';
import CustomerSprite, { SPRITE_ASPECT } from './CustomerSprite';
import { COLORS } from './Pixel';

// A square face portrait of a customer sprite: the sprite is scaled and shifted so
// the box frames head and shoulders, whatever the figure's size in its canvas.
export default function Portrait({ customerKey, size = 64, silhouette = false }) {
  const f = SPRITE_FRAMING[customerKey] ?? DEFAULT_FRAMING;
  const inner = size - 6;                              // inside the 3px border
  const regionTop = Math.max(0, f.top - 0.015);
  const regionH = 0.44 * f.h;                          // the part of the canvas to show
  const displayH = inner / regionH;
  const displayW = displayH * SPRITE_ASPECT;
  return (
    <View style={{
      width: size, height: size, overflow: 'hidden', borderRadius: 4,
      backgroundColor: '#e8d4a8', borderWidth: 3, borderColor: COLORS.woodEdge,
    }}>
      <View style={{ position: 'absolute', left: inner / 2 - f.cx * displayW, top: -regionTop * displayH }}>
        <CustomerSprite customerKey={customerKey} height={displayH} bob={false} silhouette={silhouette} />
      </View>
    </View>
  );
}
