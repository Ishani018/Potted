import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MAP_BG } from '../engine/assets';
import GrannyWalker from '../components/GrannyWalker';
import HerbalistMenu, { useHerbalistFlag } from '../components/HerbalistCorner';
import { MapTagButton } from '../components/MapTag';
import ScreenHud from '../components/ScreenHud';

// Town buttons laid out in Plopper (1376×768 base, sprite CENTER anchor).
// Render the bg stretched + position buttons against the measured box, so they
// land exactly where placed in Plopper. img = UI_IMAGES key, dest = nav target.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
// label = sign text; x/y = centre of the sign (text + arrow); dest = nav target.
const BUTTONS = [
  { label: 'MARKET',  dest: 'Trade',   x: 700,  y: 440 },
  { label: 'NURSERY', dest: 'Nursery', x: 354,  y: 330 },
  { label: 'HOME',    dest: 'Home',    x: 70,   y: 500 },
  { label: 'ADOPT',   dest: 'PetShop', x: 543,  y: 262 },
  { label: 'APARTMENTS', dest: 'Lobby', x: 1173, y: 625 },
  { label: 'FLORIST', dest: 'Counter', x: 741,  y: 255 },
];

export default function MapScreen({ navigation }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;
  const [granny, setGranny] = useState(false);
  const flag = useHerbalistFlag();

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={MAP_BG} style={styles.bg} resizeMode="stretch" />

      {/* Granny Mae strolls up and down the street */}
      {sw > 0 && <GrannyWalker k={sw / PLOPPER_W} flag={flag} onOpen={() => setGranny(true)} />}

      {BUTTONS.map((b, i) => (
        <MapTagButton
          key={b.label} label={b.label} x={b.x} y={b.y} box={box} z={10 + i} delay={i * 180}
          onPress={() => navigation.navigate(b.dest)}
        />
      ))}

      <HerbalistMenu sw={sw} sh={sh} open={granny} setOpen={setGranny} />

      {/* Standard HUD — settings (top-left). Map has no inventory button. */}
      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Settings')} onBook={() => navigation.navigate('FlowerBook')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
});
