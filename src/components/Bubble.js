import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { BUBBLE_WIDE } from '../engine/assets';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

// A painted speech bubble with a tail. `width` is its width in screen pixels; the height follows the picture.
export default function Bubble({ width, text, style }) {
  const height = width * BUBBLE_WIDE.h / BUBBLE_WIDE.w;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width, height }, style]}>
      <Image source={BUBBLE_WIDE.src} resizeMode="stretch" style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', left: width * 0.1, right: width * 0.06, top: height * 0.1, bottom: height * 0.26, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: SERIF, fontSize: Math.max(10, width * 0.058), color: '#4a2a10', textAlign: 'center' }}>{text}</Text>
      </View>
    </View>
  );
}
