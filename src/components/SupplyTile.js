import React from 'react';
import { View, Image } from 'react-native';

// The row of supplies along the bottom of a garden room: the bag, then the pots you can drag out, then the remedies.
// Every tile is the same size on the same line (1376x768 base), one cream tile each.
const W = 1376, H = 768;
const ROW = { x0: 60, y: 715, size: 76, pitch: 90 };

export function supplySlot(i, sw, sh) {
  return { cx: ((ROW.x0 + i * ROW.pitch) / W) * sw, cy: (ROW.y / H) * sh, size: (ROW.size / W) * sw };
}

export default function SupplyTile({ slot, sw, sh, source, aspect = 1 }) {
  const t = supplySlot(slot, sw, sh);
  const pic = t.size * 0.68;
  return (
    <View pointerEvents="none" style={{
      position: 'absolute', left: t.cx - t.size / 2, top: t.cy - t.size / 2, width: t.size, height: t.size, zIndex: 29,
      backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    }}>
      <Image source={source} resizeMode="contain" style={{ width: pic, height: pic * aspect }} />
    </View>
  );
}
