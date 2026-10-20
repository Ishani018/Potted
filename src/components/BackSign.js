import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { UI_IMAGES } from '../engine/assets';
import { useLayout } from '../context/LayoutContext';
import { PixelText } from './Pixel';

// The hanging wooden BACK sign (top-left). Size follows the game frame width.
export default function BackSign({ onPress, style }) {
  const { width: sw } = useLayout();
  const w = Math.max(96, sw * (190 / 1376));
  const h = w / 2;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[{ position: 'absolute', left: sw * (34 / 1376), top: 8, width: w, height: h, zIndex: 40 }, style]}
    >
      <Image source={UI_IMAGES.backSign} style={styles.fill} resizeMode="stretch" />
      <View style={{ ...StyleSheet.absoluteFillObject, top: '20%', paddingRight: '10%', alignItems: 'center', justifyContent: 'center' }}>
        <PixelText size={Math.max(9, Math.round(w * 0.116))}>{'< BACK'}</PixelText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
});
