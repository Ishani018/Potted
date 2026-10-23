import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { HOME_BG } from '../engine/assets';
import { MapTagButton } from '../components/MapTag';
import InventoryOverlay from '../components/InventoryOverlay';
import ScreenHud from '../components/ScreenHud';
import HerbalistCorner from '../components/HerbalistCorner';
import Goose from '../components/Goose';

// Entry buttons laid out in Plopper (1376×768 base, sprite CENTER anchor).
// Render bg stretched + position against the measured box → exact placement.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
// label = sign text; x/y = centre of the sign (text + arrow).
const ENTRIES = [
  { label: 'GREENHOUSE', room: 1, x: 163,  y: 170 },
  { label: 'SUNROOM',    room: 3, x: 613,  y: 100 },
  { label: 'BALCONY',    room: 2, x: 1001, y: 220 },
];
// The pet bowls by the stairs → the pet lounge.
const PET_TAG = { label: 'PETS', x: 445, y: 566 };

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

      {ENTRIES.map((e, i) => (
        <MapTagButton key={e.label} label={e.label} x={e.x} y={e.y} box={box} z={10 + i} delay={i * 180} onPress={() => go(e)} />
      ))}
      <MapTagButton label={PET_TAG.label} x={PET_TAG.x} y={PET_TAG.y} box={box} z={14} delay={600} onPress={() => navigation.navigate('PetRoom')} />

      {/* the goose lives here too: it has the run of the living-room floor (home picture is 1671×941) */}
      {sw > 0 && <Goose k={sw / 1671} bounds={{ x0: 250, x1: 1480, y0: 735, y1: 812 }} imgH={941} base={0.6} zOf={() => 12} />}

      {/* Granny Mae the herbalist: free daily remedy + herb swaps (tap her) */}
      <HerbalistCorner sw={sw} sh={sh} />

      {/* Standard HUD — settings (TL) + map (TR) + inventory (BL) */}
      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
        onBook={() => navigation.navigate('FlowerBook')}
      />

      {invOpen && (
        <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
});
