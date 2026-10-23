import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'react-native';
import PaintedButton from './PaintedButton';
import { useBook } from './BookNav';

// Shared pieces for the garden journal's pages.
// Type: headings, names, tabs and buttons use the game's pixel font; everything
// you read (descriptions, notes, stats) is set in a handwritten face, Patrick Hand.
export const INK = '#4a2a10';
export const SOFT = '#8a6a40';
export const PAPER = '#f3e3c0';
export const PIXEL_FONT = 'PressStart2P';
// headings: Almendra, a calligraphic face with a storybook, spell-book feel
export const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
export const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

// A page title: serif lettering between two little rules (the old parchment ribbon is gone).
export function RibbonTitle({ children, width = 196, size = 19 }) {
  return (
    <View style={{ width, alignSelf: 'center', alignItems: 'center' }}>
      <Text style={[s.titleTxt, { fontSize: size + 3 }]} numberOfLines={1}>{children}</Text>
      <View style={{ width: width * 0.8, height: 2, backgroundColor: '#cdae78', borderRadius: 1, marginTop: 1 }} />
    </View>
  );
}

// The chapter title at the top of a left page: small pixel lettering between two
// little rules, like a heading written into a journal. (Pages are turned with the
// arrows, a swipe, or the contents page, so there are no tabs.)
export function BookTabs() {
  const book = useBook();
  const title = book?.info?.title ?? '';
  return (
    <View style={s.tabs}>
      <RibbonTitle width={196}>{title}</RibbonTitle>
    </View>
  );
}

// An action button in the game's own pixel-button style. on = the chosen option
// (green); otherwise the dark wood one.
export function BookButton({ label, onPress, on, disabled, style }) {
  return <PaintedButton label={String(label)} onPress={onPress} tone={on ? 'btnCream' : 'btnCream'} disabled={disabled} h={30} fontSize={14} style={[on ? { opacity: 1 } : null, style]} />;
}

export const bookStyles = StyleSheet.create({
  pageInner: { flex: 1 },
  progress: { fontFamily: BODY, color: SOFT, fontSize: 13, textAlign: 'center', marginBottom: 3 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 5 },
  // the card itself is a painted picture (TileFrame) behind the tile's contents
  tile: {
    paddingTop: 10, paddingBottom: 10, paddingHorizontal: 9,
    alignItems: 'center', justifyContent: 'space-between',
  },
  tileFound: {},
  tileSel: {},
  tileArt: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  // names live on the right-hand page; a tile only carries the picture (and a seed level when locked)
  tileLevel: { position: 'absolute', bottom: 9, alignSelf: 'center', fontFamily: BODY, color: '#5a3410', fontSize: 12 },
  tileQ: { position: 'absolute', fontFamily: PIXEL_FONT, fontSize: 14, color: '#fbf0cf', textShadowColor: '#5a4630', textShadowRadius: 2 },
  silhouette: { tintColor: '#4a3a28', opacity: 0.4 },
  detail: { alignItems: 'center', paddingBottom: 8 },
  name: { fontFamily: HEAD, fontSize: 21, color: INK, marginBottom: 1, textAlign: 'center' },
  sub: { fontFamily: BODY, color: SOFT, fontSize: 13, textAlign: 'center', marginBottom: 3 },
  blurb: { fontFamily: BODY, color: INK, fontSize: 14, textAlign: 'center', marginBottom: 3, lineHeight: 16 },
  note: { fontFamily: BODY, color: '#5a7a2a', fontSize: 13, textAlign: 'center', marginBottom: 4, lineHeight: 15 },
  label: { fontFamily: HEAD, fontSize: 15, color: '#5a7a2a', marginTop: 3, marginBottom: 2 },
  // a short line of plain text under a name (replaces the little label pills)
  tagline: { fontFamily: BODY, color: SOFT, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  glow: { position: 'absolute', borderWidth: 3, borderColor: '#ecd48a', backgroundColor: '#fbeab0' },
  glowLocked: { backgroundColor: '#e6d6b0', borderColor: '#d2bd90' },
});

const s = StyleSheet.create({
  tabs: { marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleTxt: { fontFamily: HEAD, fontSize: 22, color: '#4a2a10', fontWeight: 'bold' },
  leaf: { width: 14, height: 14 },
});
