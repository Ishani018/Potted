import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Shared pieces for the flower book's pages.
export const INK = '#4a2a10';
export const SOFT = '#8a6a40';
export const PAPER = '#f3e3c0';
export const PIXEL_FONT = 'PressStart2P';

export const TABS = [
  ['flowers', 'Flowers'], ['bouquets', 'Bouquets'], ['care', 'Care'],
  ['customers', 'Customers'], ['pets', 'Pets'], ['paintings', 'Paintings'],
];

// The six tabs in two rows of three, at the top of the left page.
export function BookTabs({ tab, setTab }) {
  const rows = [TABS.slice(0, 3), TABS.slice(3)];
  return (
    <View style={s.tabs}>
      {rows.map((row, i) => (
        <View key={i} style={s.tabRow}>
          {row.map(([key, label]) => (
            <TouchableOpacity key={key} style={[s.tab, tab === key && s.tabOn]} onPress={() => setTab(key)} activeOpacity={0.8}>
              <Text style={[s.tabTxt, tab === key && s.tabTxtOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

// A small parchment-style button. on = highlighted (selected), disabled = dimmed.
export function BookButton({ label, onPress, on, disabled, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[s.btn, on && s.btnOn, disabled && { opacity: 0.45 }, style]}
    >
      <Text style={[s.btnTxt, on && s.btnTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

export const bookStyles = StyleSheet.create({
  pageInner: { flex: 1 },
  progress: { color: SOFT, fontSize: 10, textAlign: 'center', marginBottom: 4 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 5 },
  tile: {
    borderRadius: 8, paddingTop: 3, paddingBottom: 2,
    backgroundColor: '#e8d4a8', borderWidth: 1.5, borderColor: '#c9a86a',
    alignItems: 'center', justifyContent: 'space-between',
  },
  tileFound: { backgroundColor: '#fbf0cf', borderColor: '#d8b872' },
  tileSel: { borderColor: '#5a8a2a', borderWidth: 2.5, backgroundColor: '#eef0c8' },
  tileArt: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  tileName: { color: INK, fontSize: 8, fontWeight: 'bold', maxWidth: '96%' },
  tileNameLocked: { color: '#a08860' },
  tileQ: { position: 'absolute', fontFamily: PIXEL_FONT, fontSize: 14, color: '#fbf0cf', textShadowColor: '#5a4630', textShadowRadius: 2 },
  silhouette: { tintColor: '#4a3a28', opacity: 0.4 },
  detail: { alignItems: 'center', paddingBottom: 8 },
  name: { fontFamily: PIXEL_FONT, fontSize: 12, color: INK, marginBottom: 4, textAlign: 'center' },
  sub: { color: SOFT, fontSize: 10, textAlign: 'center', marginBottom: 4 },
  blurb: { color: INK, fontSize: 11, textAlign: 'center', marginBottom: 4, lineHeight: 15 },
  note: { color: '#5a7a2a', fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginBottom: 4, lineHeight: 13 },
  label: { fontFamily: PIXEL_FONT, fontSize: 8, color: '#5a7a2a', marginTop: 3, marginBottom: 3 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, marginBottom: 4 },
  chipTxt: { color: INK, fontSize: 10, fontWeight: 'bold' },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  glow: {
    position: 'absolute', borderWidth: 3, borderColor: '#ecd48a', backgroundColor: '#fbeab0',
  },
  glowLocked: { backgroundColor: '#e6d6b0', borderColor: '#d2bd90' },
});

const s = StyleSheet.create({
  tabs: { gap: 3, marginBottom: 4 },
  tabRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tab: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#c9a86a' },
  tabOn: { backgroundColor: '#7a3e1a', borderColor: '#7a3e1a' },
  tabTxt: { color: SOFT, fontSize: 9, fontWeight: 'bold' },
  tabTxtOn: { color: PAPER },
  btn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1.5, borderColor: '#c9a86a', backgroundColor: '#fbf0cf', alignItems: 'center' },
  btnOn: { backgroundColor: '#5a8a2a', borderColor: '#3d6a1c' },
  btnTxt: { color: INK, fontSize: 10, fontWeight: 'bold' },
  btnTxtOn: { color: '#fff' },
});
