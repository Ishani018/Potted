import React from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { BUBBLE_WIDE } from '../engine/assets';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

// A painted speech bubble with a tail. `width` is its width in screen pixels; the height follows the picture.
// flip mirrors the picture so the tail sits on the left (the text is never mirrored)
export default function Bubble({ width, text, style, flip }) {
  const height = width * BUBBLE_WIDE.h / BUBBLE_WIDE.w;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width, height }, style]}>
      <Image source={BUBBLE_WIDE.src} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, width, height, transform: flip ? [{ scaleX: -1 }] : undefined }} />
      <View style={{ position: 'absolute', left: flip ? width * 0.07 : width * 0.12, top: height * 0.1, width: width * 0.78, height: height * 0.64, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: SERIF, fontSize: Math.max(10, Math.min(20, width * 0.058)), width: '100%', color: '#4a2a10', textAlign: 'center' }}>{text}</Text>
      </View>
    </View>
  );
}
