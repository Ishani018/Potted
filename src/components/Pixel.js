import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BOOK_BUTTONS } from '../engine/assets';

// Shared pixel-art look, matching the trading board / map signs:
// Press Start 2P text (white fill, black outline) on warm wood + cream panels.
export const PIXEL_FONT = 'PressStart2P';

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

export const pixelText = (size = 12, color = '#fff') => ({
  fontFamily: PIXEL_FONT,
  fontSize: size,
  color,
  textShadowColor: '#000',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 1.6,
});

export function PixelText({ size = 12, color, style, children, ...rest }) {
  return <Text {...rest} style={[pixelText(size, color), style]}>{children}</Text>;
}

// Wooden board with a dark border and an inner highlight — the "sign" look.
export function PixelPanel({ style, children, cream }) {
  return (
    <View style={[styles.panel, cream && styles.panelCream, style]}>
      <View style={[styles.panelInner, cream && styles.panelInnerCream]}>{children}</View>
    </View>
  );
}

// Painted button (text label on a flowered frame). tone: 'green' | 'wood' | 'red'.
// The frame is three pictures: left cap, stretchy middle, right cap.
export function PixelButton({ label, onPress, tone = 'green', disabled, style, size = 11, scale = 1 }) {
  const art = BOOK_BUTTONS[tone] ?? BOOK_BUTTONS.green;
  const H = Math.round(Math.max(30, size * 2.8) * (art.tall ?? 1) * scale);
  const capW = Math.round(H * art.cap);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        { height: H, minWidth: capW * 2 + 24, alignItems: 'center', justifyContent: 'center' },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Image source={art.l} style={{ position: 'absolute', left: 0, top: 0, width: capW, height: H }} resizeMode="stretch" pointerEvents="none" />
      <Image source={art.m} style={{ position: 'absolute', left: capW, right: capW, top: 0, height: H }} resizeMode="stretch" pointerEvents="none" />
      <Image source={art.r} style={{ position: 'absolute', right: 0, top: 0, width: capW, height: H }} resizeMode="stretch" pointerEvents="none" />
      <View style={{ paddingHorizontal: Math.round(capW * 1.05) + 2, paddingTop: tone === 'green' ? Math.round(H * 0.15) : 0 }}>
        <Text style={[styles.label, { fontSize: Math.round(size * 1.9 * Math.max(0.8, scale)) }]} numberOfLines={1}>{label}</Text>
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
  // Button labels use the same soft serif as the painted pop-ups (not the pixel font).
  label: {
    fontFamily: Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' }),
    color: '#fbf3da', textAlign: 'center',
    textShadowColor: 'rgba(40,24,6,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  // One border per box: a single dark edge, flat fill. Nested cream panels get a
  // soft edge only (no second dark frame) so boxes inside boxes don't stack borders.
  panel: {
    backgroundColor: COLORS.wood, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4, padding: 2,
  },
  panelCream: { backgroundColor: COLORS.cream, borderWidth: 2, borderColor: COLORS.creamEdge },
  panelInner: { padding: 12 },
  panelInnerCream: {},
  btn: {
    borderWidth: 3, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  toast: {
    position: 'absolute', bottom: 64, alignSelf: 'center', zIndex: 300,
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 10,
  },
});
