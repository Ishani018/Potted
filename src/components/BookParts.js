import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { PixelButton } from './Pixel';

// Shared pieces for the flower book's pages.
// Type: headings, names, tabs and buttons use the game's pixel font; everything
// you read (descriptions, notes, stats) is set in a handwritten face, Patrick Hand.
export const INK = '#4a2a10';
export const SOFT = '#8a6a40';
export const PAPER = '#f3e3c0';
export const PIXEL_FONT = 'PressStart2P';
export const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

export const TABS = [
  ['flowers', 'Flowers'], ['bouquets', 'Bouquets'], ['care', 'Care'],
  ['customers', 'Customers'], ['pets', 'Pets'], ['paintings', 'Paintings'],
];

// The six tabs as plain lettering in two rows of three: the open one is dark with
// an ink underline, the others are faded.
export function BookTabs({ tab, setTab }) {
  const rows = [TABS.slice(0, 3), TABS.slice(3)];
  return (
    <View style={s.tabs}>
      {rows.map((row, i) => (
        <View key={i} style={s.tabRow}>
          {row.map(([key, label]) => (
            <TouchableOpacity key={key} onPress={() => setTab(key)} activeOpacity={0.7} style={s.tab}>
              <Text style={[s.tabTxt, tab === key && s.tabTxtOn]}>{label.toUpperCase()}</Text>
              <View style={[s.tabLine, tab === key && s.tabLineOn]} />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

// An action button in the game's own pixel-button style. on = the chosen option
// (green); otherwise the dark wood one.
export function BookButton({ label, onPress, on, disabled, style }) {
  return (
    <PixelButton
      label={String(label).toUpperCase()}
      onPress={onPress}
      tone={on ? 'green' : 'wood'}
      disabled={disabled}
      size={7}
      style={[{ paddingHorizontal: 10, paddingVertical: 7 }, style]}
    />
  );
}

export const bookStyles = StyleSheet.create({
  pageInner: { flex: 1 },
  progress: { fontFamily: BODY, color: SOFT, fontSize: 13, textAlign: 'center', marginBottom: 3 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 5 },
  tile: {
    borderRadius: 8, paddingTop: 3, paddingBottom: 2,
    backgroundColor: '#e8d4a8', borderWidth: 1.5, borderColor: '#c9a86a',
    alignItems: 'center', justifyContent: 'space-between',
  },
  tileFound: { backgroundColor: '#fbf0cf', borderColor: '#d8b872' },
  tileSel: { borderColor: '#5a8a2a', borderWidth: 2.5, backgroundColor: '#eef0c8' },
  tileArt: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  tileName: { fontFamily: BODY, color: INK, fontSize: 12, maxWidth: '96%' },
  tileNameLocked: { color: '#a08860' },
  tileQ: { position: 'absolute', fontFamily: PIXEL_FONT, fontSize: 14, color: '#fbf0cf', textShadowColor: '#5a4630', textShadowRadius: 2 },
  silhouette: { tintColor: '#4a3a28', opacity: 0.4 },
  detail: { alignItems: 'center', paddingBottom: 8 },
  name: { fontFamily: PIXEL_FONT, fontSize: 10, color: INK, marginBottom: 4, textAlign: 'center' },
  sub: { fontFamily: BODY, color: SOFT, fontSize: 13, textAlign: 'center', marginBottom: 3 },
  blurb: { fontFamily: BODY, color: INK, fontSize: 14, textAlign: 'center', marginBottom: 3, lineHeight: 16 },
  note: { fontFamily: BODY, color: '#5a7a2a', fontSize: 13, textAlign: 'center', marginBottom: 4, lineHeight: 15 },
  label: { fontFamily: PIXEL_FONT, fontSize: 7, color: '#5a7a2a', marginTop: 3, marginBottom: 3 },
  // a short line of plain text under a name (replaces the little label pills)
  tagline: { fontFamily: BODY, color: SOFT, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  glow: { position: 'absolute', borderWidth: 3, borderColor: '#ecd48a', backgroundColor: '#fbeab0' },
  glowLocked: { backgroundColor: '#e6d6b0', borderColor: '#d2bd90' },
});

const s = StyleSheet.create({
  tabs: { gap: 2, marginBottom: 4 },
  tabRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  tab: { alignItems: 'center', paddingVertical: 2 },
  tabTxt: { fontFamily: PIXEL_FONT, fontSize: 7, color: '#b39a72' },
  tabTxtOn: { color: INK },
  tabLine: { height: 2, alignSelf: 'stretch', marginTop: 2, backgroundColor: 'transparent' },
  tabLineOn: { backgroundColor: '#7a3e1a' },
});
