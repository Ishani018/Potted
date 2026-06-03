import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useGame } from '../context/GameContext';
import { HOME_BG, UI_IMAGES } from '../engine/assets';
import InventoryOverlay from '../components/InventoryOverlay';

// Entry buttons — positions solved via HomeScreen-specific empirical model:
//   visual_x = 2 × code_x − 0.13
//   visual_y = 1.55 × code_y − 0.034
// (derived from 2 screenshot data points; different from MapScreen due to image crop)
const ENTRIES = [
  { key: 'greenhouse', img: 'greenhousebtn', room: 1, x: 0.12, y: 0.16, w: 0.16, aspect: 368 / 1147 },
  { key: 'sunroom',    img: 'sunroombtn',    room: 3, x: 0.22, y: 0.08, w: 0.12, aspect: 348 / 821  },
  { key: 'balcony',    img: 'balconybtn',    room: 2, x: 0.34, y: 0.10, w: 0.12, aspect: 348 / 820  },
];

export default function HomeScreen({ navigation }) {
  const { dispatch } = useGame();
  const { width: sw, height: sh } = useWindowDimensions();
  const [invOpen, setInvOpen] = useState(false);

  const go = (entry) => {
    dispatch({ type: 'SET_ROOM', room: entry.room });
    navigation.navigate('Garden');
  };

  return (
    <View style={styles.root}>
      <Image source={HOME_BG} style={styles.bg} resizeMode="cover" />

      {ENTRIES.map((e) => {
        const w = sw * e.w;
        const h = w * e.aspect;
        return (
          <TouchableOpacity
            key={e.key}
            activeOpacity={0.75}
            onPress={() => go(e)}
            style={{
              position: 'absolute',
              left: sw * e.x - w / 2,
              top: sh * e.y - h / 2,
              width: w,
              height: h,
              zIndex: 10,
            }}
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
