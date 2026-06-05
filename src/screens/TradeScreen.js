import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { TRADE_BG, UI_IMAGES } from '../engine/assets';
import ScreenHud from '../components/ScreenHud';

// Market exterior (flowertradeshop.png) — the scales scene. Tapping the painted
// TRADE button opens the trading page (the 6-slot flower exchange).
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const TRADE_BTN = { x: 890, y: 450, w: 264, h: 218 };

export default function TradeScreen({ navigation }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  const btnW = (TRADE_BTN.w / PLOPPER_W) * sw;
  const btnH = (TRADE_BTN.h / PLOPPER_H) * sh;

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={TRADE_BG} style={styles.bg} resizeMode="stretch" />

      {/* TRADE button → opens the trading page */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          left: (TRADE_BTN.x / PLOPPER_W) * sw - btnW / 2,
          top:  (TRADE_BTN.y / PLOPPER_H) * sh - btnH / 2,
          width: btnW, height: btnH, zIndex: 10,
        }}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Trading')}
      >
        <Image source={UI_IMAGES.tradebtn} style={{ width: btnW, height: btnH }} resizeMode="contain" />
      </TouchableOpacity>

      {/* Standard HUD — settings (TL) + map (TR) */}
      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0800' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
});
