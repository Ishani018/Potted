import React, { useState, useMemo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_BG, TRADE_IMAGES, UI_IMAGES } from '../engine/assets';
import { getDailyTrades } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';

// Slot positions on tradingscreen.png — base 1376×768, CENTER anchor. The 6 daily
// flowers fill these 6 boxes in order. (From Plopper; the two overlapping sets of
// 6 collapse to these shared slots.)
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const SLOTS = [
  { x: 349,  y: 201, w: 86,  h: 83 },
  { x: 484,  y: 203, w: 82,  h: 78 },
  { x: 618,  y: 199, w: 78,  h: 86 },
  { x: 756,  y: 203, w: 96,  h: 79 },
  { x: 892,  y: 199, w: 77,  h: 77 },
  { x: 1026, y: 201, w: 85,  h: 82 },
];

// Press Start 2P (falls back to monospace until the .ttf is added to assets/fonts
// and loaded). White fill + thick black outline via layered text shadows.
const PIXEL_FONT = 'PressStart2P';
const outline = (() => {
  const c = '#000', o = 1.6;
  return {
    fontFamily: PIXEL_FONT,
    color: '#fff',
    textShadowColor: c,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: o,
  };
})();

export default function TradeScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  // Today's 6 offers — stable within the day.
  const offers = useMemo(() => getDailyTrades(), []);

  const [active, setActive] = useState(null); // { key, name, img, price } being traded
  const [qty, setQty] = useState(1);

  const openTrade = (offer) => {
    if ((harvested[offer.key] ?? 0) <= 0) return; // nothing to trade
    setActive(offer);
    setQty(1);
  };

  const have = active ? (harvested[active.key] ?? 0) : 0;
  const total = active ? qty * active.price : 0;

  const confirmTrade = () => {
    if (!active) return;
    dispatch({ type: 'TRADE_FLOWERS', flowerKey: active.key, qty, unitPrice: active.price });
    setActive(null);
  };

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={TRADE_BG} style={styles.bg} resizeMode="stretch" />

      {/* Daily flower slots */}
      {offers.map((offer, i) => {
        const s = SLOTS[i];
        if (!s) return null;
        const cx = (s.x / PLOPPER_W) * sw;
        const cy = (s.y / PLOPPER_H) * sh;
        const iw = (s.w / PLOPPER_W) * sw;
        const ih = (s.h / PLOPPER_H) * sh;
        const owned = harvested[offer.key] ?? 0;
        return (
          <TouchableOpacity
            key={offer.key}
            style={{ position: 'absolute', left: cx - iw / 2, top: cy - ih / 2, width: iw, height: ih, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            activeOpacity={owned > 0 ? 0.7 : 1}
            onPress={() => openTrade(offer)}
          >
            <Image
              source={TRADE_IMAGES[offer.img]}
              style={{ width: iw, height: ih, opacity: owned > 0 ? 1 : 0.7 }}
              resizeMode="contain"
            />
            {/* How many you hold, bottom-left of the flower */}
            {owned > 0 && (
              <Text style={[styles.holdCount, outline, { fontSize: Math.max(8, iw * 0.16) }]}>
                {owned}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Standard HUD — settings (TL) + map (TR) */}
      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
      />

      {/* ── Trade popup ─────────────────────────────────────────────── */}
      {active && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Image source={TRADE_IMAGES[active.img]} style={styles.modalImg} resizeMode="contain" />
            <Text style={styles.modalName}>{active.name}</Text>
            <View style={styles.priceRow}>
              <Image source={UI_IMAGES.goldcoins} style={styles.coin} resizeMode="contain" />
              <Text style={styles.priceTxt}>{active.price} each</Text>
            </View>

            {/* Quantity selector */}
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                <Text style={styles.qtyBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.min(have, q + 1))}>
                <Text style={styles.qtyBtnTxt}>＋</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.allBtn} onPress={() => setQty(have)}>
                <Text style={styles.allTxt}>All ({have})</Text>
              </TouchableOpacity>
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <Image source={UI_IMAGES.goldcoins} style={styles.coin} resizeMode="contain" />
              <Text style={styles.totalTxt}>{total}</Text>
            </View>

            {/* Trade + Cancel */}
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={confirmTrade} activeOpacity={0.8}>
                <Image source={UI_IMAGES.tradebtn} style={styles.actionImg} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActive(null)} activeOpacity={0.8}>
                <Image source={UI_IMAGES.cancelbutton} style={styles.actionImg} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0800' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },

  holdCount: { position: 'absolute', left: 2, bottom: 0, color: '#fff' },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    backgroundColor: '#2a1608', borderRadius: 16,
    borderWidth: 2, borderColor: '#c8873a',
    padding: 20, alignItems: 'center', minWidth: 250,
  },
  modalImg: { width: 96, height: 96, marginBottom: 6 },
  modalName: { color: '#ffe8a0', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 12 },
  coin: { width: 18, height: 18 },
  priceTxt: { color: '#ffd060', fontSize: 13, fontWeight: 'bold' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  qtyBtn: {
    width: 38, height: 38, borderRadius: 8,
    backgroundColor: '#3d2810', borderWidth: 1.5, borderColor: '#7a4a18',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnTxt: { color: '#ffe8a0', fontSize: 20, fontWeight: 'bold' },
  qtyNum: { color: '#ffe8a0', fontSize: 20, fontWeight: 'bold', minWidth: 34, textAlign: 'center' },
  allBtn: {
    paddingHorizontal: 10, height: 34, borderRadius: 8,
    backgroundColor: '#3d2810', borderWidth: 1.5, borderColor: '#7a4a18',
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },
  allTxt: { color: '#ffe8a0', fontSize: 12, fontWeight: 'bold' },

  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  totalTxt: { color: '#ffd060', fontSize: 22, fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', gap: 14 },
  actionImg: { width: 110, height: 48 },
});
