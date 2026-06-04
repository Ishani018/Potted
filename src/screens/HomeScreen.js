import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { HOME_BG, UI_IMAGES } from '../engine/assets';
import InventoryOverlay from '../components/InventoryOverlay';

// Entry buttons laid out in Plopper (1376×768 base, sprite CENTER anchor).
// Render bg stretched + position against the measured box → exact placement.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const ENTRIES = [
  { img: 'greenhousebtn', room: 1, x: 163,  y: 170, w: 203, h: 65, z: 1 },
  { img: 'sunroombtn',    room: 3, x: 613,  y: 100, w: 157, h: 67, z: 2 },
  { img: 'balconybtn',    room: 2, x: 1001, y: 220, w: 163, h: 69, z: 3 },
];

export default function HomeScreen({ navigation }) {
  const { dispatch } = useGame();
  const [invOpen, setInvOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  const go = (entry) => {
    dispatch({ type: 'SET_ROOM', room: entry.room });
    navigation.navigate('Garden');
  };

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={HOME_BG} style={styles.bg} resizeMode="stretch" />

      {ENTRIES.map((e) => {
        const cx = (e.x / PLOPPER_W) * sw;
        const cy = (e.y / PLOPPER_H) * sh;
        const w = (e.w / PLOPPER_W) * sw;
        const h = (e.h / PLOPPER_H) * sh;
        return (
          <TouchableOpacity
            key={e.img}
            activeOpacity={0.75}
            onPress={() => go(e)}
            style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, zIndex: e.z }}
          >
            <Image source={UI_IMAGES[e.img]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}

      {/* Settings (top-left) */}
      <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Room')}>
        <Image source={UI_IMAGES.settingsnobg} style={styles.cornerImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Map (top-right) */}
      <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('Map')}>
        <Image source={UI_IMAGES.mapicon} style={styles.cornerImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Inventory (bottom-left) — view-only here */}
      <TouchableOpacity style={styles.inventoryBtn} onPress={() => setInvOpen(true)}>
        <Image source={UI_IMAGES.inventorybtn} style={styles.cornerImg} resizeMode="contain" />
      </TouchableOpacity>

      {invOpen && (
        <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  settingsBtn:  { position: 'absolute', top: 12, left: 14,   width: 48, height: 48, zIndex: 20 },
  mapBtn:        { position: 'absolute', top: 12, right: 14,  width: 48, height: 48, zIndex: 20 },
  inventoryBtn:  { position: 'absolute', bottom: 14, left: 14, width: 48, height: 48, zIndex: 20 },
  cornerImg: { width: '100%', height: '100%' },
});
