import React from 'react';
import { View, Image } from 'react-native';
import { HERBALIST_IMAGES } from '../engine/assets';

// Icon for a remedy: 'balm' (a little green jar) or 'sachet' (a tied cloth
// pouch). Uses the real art once it's registered in HERBALIST_IMAGES, otherwise
// draws a stand-in. `size` is the square it fits in.
export default function RemedyIcon({ kind, size = 32 }) {
  const img = HERBALIST_IMAGES[kind];
  if (img) return <Image source={img} style={{ width: size, height: size }} resizeMode="contain" />;

  if (kind === 'sachet') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* tie */}
        <View style={{ position: 'absolute', top: size * 0.08, width: size * 0.2, height: size * 0.2, borderRadius: size, backgroundColor: '#a0642a' }} />
        <View style={{ position: 'absolute', top: size * 0.2, width: size * 0.34, height: size * 0.07, backgroundColor: '#a0642a', borderRadius: 2 }} />
        {/* pouch */}
        <View style={{ width: size * 0.78, height: size * 0.66, borderRadius: size * 0.34, backgroundColor: '#ecd9a6', borderWidth: Math.max(1.5, size * 0.05), borderColor: '#8a6a3a', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: size * 0.22, height: size * 0.22, borderRadius: size, backgroundColor: '#f2a81e', borderWidth: 1.5, borderColor: '#c9780a' }} />
        </View>
      </View>
    );
  }
  // balm jar
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', top: size * 0.06, width: size * 0.5, height: size * 0.18, borderRadius: 3, backgroundColor: '#a0642a', borderWidth: 1.5, borderColor: '#5a3410' }} />
      <View style={{ width: size * 0.7, height: size * 0.66, borderRadius: size * 0.16, backgroundColor: '#78b84e', borderWidth: Math.max(1.5, size * 0.05), borderColor: '#3d6a22', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.38, height: size * 0.3, borderRadius: 3, backgroundColor: '#f6ebc6', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: size * 0.16, height: size * 0.1, borderRadius: size, backgroundColor: '#5a9a3a' }} />
        </View>
      </View>
    </View>
  );
}
