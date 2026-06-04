import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MAP_BG, UI_IMAGES } from '../engine/assets';
import ScreenHud from '../components/ScreenHud';

// Town buttons laid out in Plopper (1376×768 base, sprite CENTER anchor).
// Render the bg stretched + position buttons against the measured box, so they
// land exactly where placed in Plopper. img = UI_IMAGES key, dest = nav target.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const BUTTONS = [
  { img: 'marketbtn',  dest: 'Trade',   x: 1059, y: 392, w: 179, h: 84, flip: false, z: 1 },
  { img: 'nurserybtn', dest: 'Nursery', x: 474,  y: 319, w: 192, h: 82, flip: false, z: 2 },
  { img: 'homebutton', dest: 'Home',    x: 111,  y: 516, w: 140, h: 81, flip: false, z: 3 },
  { img: 'adoptbtn',   dest: 'PetShop', x: 855,  y: 200, w: 144, h: 86, flip: false, z: 4 },
  { img: 'gallerybtn', dest: 'Gallery', x: 761,  y: 587, w: 192, h: 73, flip: false, z: 5 },
];

export default function MapScreen({ navigation }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={MAP_BG} style={styles.bg} resizeMode="stretch" />

      {BUTTONS.map((b) => {
        const cx = (b.x / PLOPPER_W) * sw;
        const cy = (b.y / PLOPPER_H) * sh;
        const w = (b.w / PLOPPER_W) * sw;
        const h = (b.h / PLOPPER_H) * sh;
        return (
          <TouchableOpacity
            key={b.img}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(b.dest)}
            style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, zIndex: b.z }}
          >
            <Image source={UI_IMAGES[b.img]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}

      {/* Standard HUD — settings (top-left). Map has no inventory button. */}
      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Room')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
});
