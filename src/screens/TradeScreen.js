import React, { useState } from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet, Text,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_BG, UI_IMAGES } from '../engine/assets';
import InventoryOverlay from '../components/InventoryOverlay';

// TRADE button laid out in Plopper (1376×768 base, sprite CENTER anchor).
// Render bg stretched + position against the measured box → exact placement.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const TRADE_BTN = { x: 890, y: 450, w: 264, h: 218 };

export default function TradeScreen({ navigation }) {
  const [invOpen, setInvOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  };

  const tradeBtnW = (TRADE_BTN.w / PLOPPER_W) * sw;
  const tradeBtnH = (TRADE_BTN.h / PLOPPER_H) * sh;

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={TRADE_BG} style={styles.bg} resizeMode="stretch" />

      {/* ── TRADE button above the scale ─────────────────────────────── */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          left: (TRADE_BTN.x / PLOPPER_W) * sw - tradeBtnW / 2,
          top:  (TRADE_BTN.y / PLOPPER_H) * sh - tradeBtnH / 2,
          width: tradeBtnW,
          height: tradeBtnH,
          zIndex: 10,
        }}
        activeOpacity={0.75}
        onPress={() => showToast('Trading coming soon!')}
      >
        <Image
          source={UI_IMAGES.tradebtn}
          style={{ width: tradeBtnW, height: tradeBtnH }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* ── Standard HUD ────────────────────────────────────────────── */}
      {/* Settings — top-left */}
      <TouchableOpacity style={styles.hudTL} onPress={() => navigation.navigate('Room')}>
        <Image source={UI_IMAGES.settingsnobg} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Map — top-right */}
      <TouchableOpacity style={styles.hudTR} onPress={() => navigation.navigate('Map')}>
        <Image source={UI_IMAGES.mapicon} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Inventory — bottom-left */}
      <TouchableOpacity style={styles.hudBL} onPress={() => setInvOpen(true)}>
        <Image source={UI_IMAGES.inventorybtn} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Toast */}
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastTxt}>{toast}</Text>
        </View>
      )}

      {/* Inventory overlay */}
      {invOpen && (
        <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0800' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },

  // Standard HUD
  hudTL: { position: 'absolute', top: 10, left: 14,   width: 48, height: 48, zIndex: 20 },
  hudTR: { position: 'absolute', top: 10, right: 14,  width: 48, height: 48, zIndex: 20 },
  hudBL: { position: 'absolute', bottom: 14, left: 14, width: 48, height: 48, zIndex: 20 },
  hudImg: { width: '100%', height: '100%' },

  toast: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: 'rgba(10,6,0,0.94)',
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9,
    borderWidth: 1.5, borderColor: '#c8873a', zIndex: 50,
  },
  toastTxt: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },
});
