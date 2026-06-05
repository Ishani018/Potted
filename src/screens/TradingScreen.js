import React, { useState, useMemo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADING_BG, TRADE_IMAGES, UI_IMAGES } from '../engine/assets';
import { getDailyTrades, TRADE_FLOWERS } from '../constants/gameData';
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

export default function TradingScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  // Today's 6 featured flowers + rates — stable within the day. Display only;
  // you trade by pulling flowers from your inventory below.
  const offers = useMemo(() => getDailyTrades(), []);
  const offerByKey = useMemo(() => {
    const m = {};
    offers.forEach((o) => { m[o.key] = o; });
    return m;
  }, [offers]);

  const [invOpen, setInvOpen] = useState(false);
  const [active, setActive] = useState(null); // offer being traded
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 1500); };

  // Pull a harvested flower from inventory → trade it (only if featured today).
  const pickHarvested = (flowerKey) => {
    const offer = offerByKey[flowerKey];
    if (!offer) { showToast('Not wanted at the market today'); return; }
    setInvOpen(false);
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

  // The harvested flowers you own (for the inventory panel).
  const ownedFlowers = Object.entries(harvested).filter(([, n]) => n > 0);

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={TRADING_BG} style={styles.bg} resizeMode="stretch" />

      {/* Daily rate board — 6 featured flowers + today's price (display only) */}
      {offers.map((offer, i) => {
        const s = SLOTS[i];
        if (!s) return null;
        const cx = (s.x / PLOPPER_W) * sw;
        const cy = (s.y / PLOPPER_H) * sh;
        const iw = (s.w / PLOPPER_W) * sw;
        const ih = (s.h / PLOPPER_H) * sh;
        return (
          <View
            key={offer.key}
            style={{ position: 'absolute', left: cx - iw / 2, top: cy - ih / 2, width: iw, height: ih, alignItems: 'center', justifyContent: 'flex-end', zIndex: 10 }}
            pointerEvents="none"
          >
            <Image source={TRADE_IMAGES[offer.img]} style={{ width: iw, height: ih, position: 'absolute' }} resizeMode="contain" />
            {/* Today's rate, top of the box */}
            <View style={[styles.rateTag, { top: -ih * 0.18 }]}>
              <Image source={UI_IMAGES.goldcoins} style={styles.rateCoin} resizeMode="contain" />
              <Text style={[styles.rateTxt, outline]}>{offer.price}</Text>
            </View>
          </View>
        );
      })}

      {/* Open harvested-flower inventory to trade from */}
      <TouchableOpacity style={styles.sellBtn} onPress={() => setInvOpen(true)} activeOpacity={0.85}>
        <Text style={styles.sellBtnTxt}>My Flowers</Text>
      </TouchableOpacity>

      {/* Standard HUD — settings (TL) + map (TR) */}
      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
      />

      {/* ── Harvested flowers inventory ─────────────────────────────── */}
      {invOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.invPanel}>
            <View style={styles.invHeader}>
              <Text style={styles.invTitle}>My Flowers</Text>
              <TouchableOpacity onPress={() => setInvOpen(false)}>
                <Image source={UI_IMAGES.cancelbutton} style={styles.invClose} resizeMode="contain" />
              </TouchableOpacity>
            </View>
            <Text style={styles.invHint}>Tap a flower the market wants today to sell it.</Text>
            {ownedFlowers.length === 0 ? (
              <Text style={styles.invEmpty}>No harvested flowers yet — grow & harvest some!</Text>
            ) : (
              <View style={styles.invGrid}>
                {ownedFlowers.map(([key, n]) => {
                  const tf = TRADE_FLOWERS[key];
                  const featured = !!offerByKey[key];
                  if (!tf) return null;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.invCell, !featured && styles.invCellDim]}
                      activeOpacity={0.8}
                      onPress={() => pickHarvested(key)}
                    >
                      <Image source={TRADE_IMAGES[tf.img]} style={styles.invCellImg} resizeMode="contain" />
                      <Text style={[styles.invCellCount, outline]}>{n}</Text>
                      {featured && (
                        <View style={styles.invCellRate}>
                          <Text style={styles.invCellRateTxt}>{offerByKey[key].price}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {toast && (
        <View style={styles.toast}><Text style={styles.toastTxt}>{toast}</Text></View>
      )}

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

  // Rate board tags above each featured flower
  rateTag: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(18,8,0,0.78)', borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  rateCoin: { width: 12, height: 12 },
  rateTxt: { color: '#fff', fontSize: 11 },

  sellBtn: {
    position: 'absolute', bottom: 18, alignSelf: 'center',
    backgroundColor: 'rgba(30,60,10,0.94)', borderRadius: 12,
    paddingHorizontal: 26, paddingVertical: 11,
    borderWidth: 2, borderColor: '#70a840', zIndex: 25,
  },
  sellBtnTxt: { color: '#d8ffa0', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },

  // Harvested-flowers inventory panel
  invPanel: {
    backgroundColor: '#2a1608', borderRadius: 16, borderWidth: 2, borderColor: '#c8873a',
    padding: 16, width: '80%', maxWidth: 520, maxHeight: '80%',
  },
  invHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  invTitle: { color: '#ffe8a0', fontSize: 17, fontWeight: 'bold', letterSpacing: 1 },
  invClose: { width: 70, height: 34 },
  invHint: { color: '#b89a6a', fontSize: 11, marginBottom: 12 },
  invEmpty: { color: '#b89a6a', fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  invGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  invCell: {
    width: 70, height: 70, borderRadius: 10,
    backgroundColor: '#3d2810', borderWidth: 1.5, borderColor: '#7a4a18',
    alignItems: 'center', justifyContent: 'center',
  },
  invCellDim: { opacity: 0.4 },
  invCellImg: { width: 52, height: 52 },
  invCellCount: { position: 'absolute', right: 4, bottom: 2, color: '#fff', fontSize: 12, fontWeight: 'bold' },
  invCellRate: {
    position: 'absolute', top: -6, left: -4,
    backgroundColor: '#2a5c1e', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1, borderColor: '#88dd40',
  },
  invCellRateTxt: { color: '#d0ff80', fontSize: 10, fontWeight: 'bold' },

  toast: {
    position: 'absolute', bottom: 70, alignSelf: 'center',
    backgroundColor: 'rgba(10,6,0,0.94)', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 9,
    borderWidth: 1.5, borderColor: '#c8873a', zIndex: 60,
  },
  toastTxt: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },

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
