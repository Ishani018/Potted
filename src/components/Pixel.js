import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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

// Chunky pixel button (text label). tone: 'green' | 'wood'
export function PixelButton({ label, onPress, tone = 'green', disabled, style, size = 11 }) {
  const green = tone === 'green';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: green ? COLORS.green : COLORS.woodDark, borderColor: green ? COLORS.greenEdge : COLORS.woodEdge },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <PixelText size={size}>{label}</PixelText>
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
  panel: {
    backgroundColor: COLORS.wood, borderWidth: 4, borderColor: COLORS.woodEdge, borderRadius: 6, padding: 4,
  },
  panelCream: { backgroundColor: COLORS.cream, borderColor: COLORS.creamEdge },
  panelInner: {
    borderWidth: 2, borderColor: '#c98a3c', borderRadius: 3, padding: 12,
  },
  panelInnerCream: { borderColor: '#e0a860' },
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
