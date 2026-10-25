import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SET_UI } from '../engine/assets';

// Shared pixel-art look, matching the trading board / map signs:
// Press Start 2P text (white fill, black outline) on warm wood + cream panels.
export const PIXEL_FONT = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });   // the game's one soft serif (the old pixel font is retired)

export const COLORS = {
  wood: '#a46122',
  woodDark: '#5a3410',
  woodEdge: '#2a1608',
  cream: '#f3cf94',
  creamEdge: '#b8793a',
  green: '#3d7a2a',
  greenEdge: '#1d4a14',
  gold: '#ffd060',
};

export const pixelText = (size = 12, color = '#4a2a10') => ({
  fontFamily: PIXEL_FONT,
  fontSize: Math.round(size * 1.5),
  color,
  fontWeight: 'bold',
});

export function PixelText({ size = 12, color, style, children, ...rest }) {
  return <Text {...rest} style={[pixelText(size, color), style]}>{children}</Text>;
}

// A cream card with one brown border: the same look as the nursery and order cards.
export function PixelPanel({ style, children }) {
  return (
    <View style={[styles.panel, style]}>
      <View style={styles.panelInner}>{children}</View>
    </View>
  );
}

// A button drawn on the UI sheet's blank plates. tone: 'green' (main action) | 'wood' (cream, secondary) | 'red' (careful).
export function PixelButton({ label, onPress, tone = 'green', disabled, style, size = 11, scale = 1 }) {
  const plate = tone === 'red' ? 'btnRed' : tone === 'wood' ? 'btnCream' : 'btnGreen';
  const art = SET_UI[plate];
  const H = Math.round(Math.max(34, size * 3.1) * scale);
  const [bw, setBw] = useState(0);
  const dark = plate === 'btnCream';
  return (
    <TouchableOpacity
      onLayout={(e) => setBw(Math.round(e.nativeEvent.layout.width))}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[{ height: H, minWidth: Math.round(H * 2.2), alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, disabled && { opacity: 0.55 }, style]}
    >
      <Image source={art.src} style={{ position: 'absolute', left: 0, top: 0, width: bw || '100%', height: H }} resizeMode="stretch" pointerEvents="none" />
      <View style={{ paddingHorizontal: 22 }}>
        <Text style={[styles.label, { fontSize: Math.round(Math.max(13, size * 1.45 * Math.max(0.85, scale))), color: dark ? '#4a2a10' : '#fff3d0' }]} numberOfLines={1}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Bottom-centre toast in the same style.
export function PixelToast({ message }) {
  if (!message) return null;
  return (
    <View style={styles.toast} pointerEvents="none">
      <PixelText size={10}>{message}</PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: PIXEL_FONT, fontWeight: 'bold', textAlign: 'center' },
  panel: { backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18 },
  panelInner: { padding: 14 },
  toast: {
    position: 'absolute', bottom: 64, alignSelf: 'center', zIndex: 300,
    backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 8,
  },
});
