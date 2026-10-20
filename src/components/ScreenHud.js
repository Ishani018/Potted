import React from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { UI_IMAGES } from '../engine/assets';

// Standard corner HUD, positioned at fixed Plopper coords (1376×768 base, CENTER
// anchor) so the buttons sit in the exact same spot on every screen. Pass the
// measured container size (sw/sh). Each button is optional — pass its handler to
// show it: onSettings (top-left), onMap (top-right), onInventory (bottom-left),
// onBook (top-right, under the map).
const PLOPPER_W = 1376;
const PLOPPER_H = 768;

// { x, y, w, h } centre + size in base px (laid out in Plopper with safe margins).
const HUD = {
  settings:  { x: 58,   y: 47,  w: 70, h: 66 },
  map:       { x: 1310, y: 43,  w: 77, h: 58 },
  inventory: { x: 60,   y: 717, w: 87, h: 75 },
  book:      { x: 1310, y: 120, w: 62, h: 62 },
};

function place(slot, sw, sh) {
  const w = (slot.w / PLOPPER_W) * sw;
  const h = (slot.h / PLOPPER_H) * sh;
  const cx = (slot.x / PLOPPER_W) * sw;
  const cy = (slot.y / PLOPPER_H) * sh;
  return { position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, zIndex: 30 };
}

export default function ScreenHud({ sw, sh, onSettings, onMap, onInventory, onBook }) {
  if (!sw || !sh) return null;
  return (
    <>
      {onSettings && (
        <TouchableOpacity style={place(HUD.settings, sw, sh)} onPress={onSettings} activeOpacity={0.8}>
          <Image source={UI_IMAGES.settingsnobg} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </TouchableOpacity>
      )}
      {onMap && (
        <TouchableOpacity style={place(HUD.map, sw, sh)} onPress={onMap} activeOpacity={0.8}>
          <Image source={UI_IMAGES.mapicon} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </TouchableOpacity>
      )}
      {onInventory && (
        <TouchableOpacity style={place(HUD.inventory, sw, sh)} onPress={onInventory} activeOpacity={0.8}>
          <Image source={UI_IMAGES.inventorybtn} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </TouchableOpacity>
      )}
      {onBook && (
        // Drawn book (no image asset yet): leather cover, cream page edge, flower.
        <TouchableOpacity style={place(HUD.book, sw, sh)} onPress={onBook} activeOpacity={0.8}>
          <View style={styles.book}>
            <View style={styles.spine} />
            <View style={styles.pages} />
            <Text style={[styles.flower, { fontSize: (HUD.book.h / PLOPPER_H) * sh * 0.42 }]}>✿</Text>
          </View>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  book: {
    flex: 1, margin: '8%', borderRadius: 6,
    backgroundColor: '#7a3e1a', borderWidth: 2, borderColor: '#c8873a',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '18%', backgroundColor: '#4e2410' },
  pages: { position: 'absolute', right: 0, top: '8%', bottom: '8%', width: '10%', backgroundColor: '#f3e3c0' },
  flower: { color: '#ffd060', marginLeft: '10%', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
});
