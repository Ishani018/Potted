import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { SET_UI } from '../engine/assets';
import { useLayout } from '../context/LayoutContext';

// The BACK button (top-left): the painted arrow button. Size follows the game frame width.
export default function BackSign({ onPress, style }) {
  const { width: sw } = useLayout();
  const h = Math.max(38, sw * (62 / 1376));
  const w = h * SET_UI.left.w / SET_UI.left.h;
  return (
    <TouchableOpacity accessibilityLabel="Back" activeOpacity={0.8} onPress={onPress}
      style={[{ position: 'absolute', left: sw * (22 / 1376), top: 10, width: w, height: h, zIndex: 40 }, style]}>
      <Image source={SET_UI.left.src} style={{ width: w, height: h }} resizeMode="contain" />
    </TouchableOpacity>
  );
}
