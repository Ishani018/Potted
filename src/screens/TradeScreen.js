import React, { useState } from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet,
  Text, useWindowDimensions,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_BG, UI_IMAGES } from '../engine/assets';
import InventoryOverlay from '../components/InventoryOverlay';

// TRADE_BTN: center coords as fraction of SCREEN, not image.
// Background (flowertradeshop.png) has aspect ~16:9 matching device,
// so image x/y fractions ≈ screen x/y fractions (minimal cover-crop).
// Scale center post ≈ x:0.48; RIGHT pan ≈ x:0.67 y:0.68.
// Button center placed just above the right pan.
const TRADE_BTN = { x: 0.61, y: 0.54, w: 0.12, aspect: 1.0 }; // aspect ~1:1 from actual PNG

export default function TradeScreen({ navigation }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const [invOpen, setInvOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  };

  const tradeBtnW = sw * TRADE_BTN.w;
  const tradeBtnH = tradeBtnW * TRADE_BTN.aspect;

  return (
    <View style={styles.root}>
      <Image source={TRADE_BG} style={styles.bg} resizeMode="cover" />

      {/* ── TRADE button above the scale ─────────────────────────────── */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          left: sw * TRADE_BTN.x - tradeBtnW / 2,
          top:  sh * TRADE_BTN.y - tradeBtnH / 2,
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
