import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MAP_BG, UI_IMAGES } from '../engine/assets';

// The map background is plain art. These labeled buttons (label + triangle) are
// rendered ON TOP at the building positions. x/y = CENTER as fractions of screen.
// btnW = button width fraction. Tune to line each label up with its building.
// aspect = native height / width (so height = width * aspect, no stretching).
// ── Button calibration ─────────────────────────────────────────────────────
// Empirical model derived from 2 screenshot comparisons:
//   visual_x = 2.0 × code_x − 0.13
//   visual_y = 1.4 × code_y + 0.11  (0.11 offset = status-bar height eating sh)
// Solved backwards from actual building positions visible in device screenshot.
// Pass 2 — 2026-06-03.
const BUTTONS = [
  { key: 'home',    dest: 'Home',    img: 'homebutton', x: 0.06, y: 0.36, w: 0.080, aspect: 365 / 632 },
  { key: 'nursery', dest: 'Nursery', img: 'nurserybtn', x: 0.16, y: 0.24, w: 0.115, aspect: 348 / 818 },
  { key: 'adopt',   dest: 'PetShop', img: 'adoptbtn',   x: 0.30, y: 0.11, w: 0.085, aspect: 348 / 586 },
  { key: 'market',  dest: 'Trade',   img: 'marketbtn',  x: 0.40, y: 0.29, w: 0.095, aspect: 348 / 742 },
];

export default function MapScreen({ navigation }) {
  const { width: sw, height: sh } = useWindowDimensions();

  return (
    <View style={styles.root}>
      <Image source={MAP_BG} style={styles.bg} resizeMode="cover" />

      {BUTTONS.map((b) => {
        const w = sw * b.w;
        const h = w * b.aspect; // real per-image aspect — no stretching
        return (
          <TouchableOpacity
            key={b.key}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(b.dest)}
            style={{
              position: 'absolute',
              left: sw * b.x - w / 2,
              top: sh * b.y - h / 2,
              width: w,
              height: h,
              zIndex: 10,
            }}
          >
            <Image source={UI_IMAGES[b.img]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}

      {/* Settings gear (painted top-left in the art) — tap zone over it */}
      <TouchableOpacity style={styles.settingsZone} onPress={() => navigation.navigate('Room')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  settingsZone: { position: 'absolute', top: 8, left: 8, width: 60, height: 60, zIndex: 20 },
});
