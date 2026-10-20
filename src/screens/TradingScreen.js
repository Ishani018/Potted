import React, { useState, useMemo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADING_BG, TRADE_IMAGES, UI_IMAGES } from '../engine/assets';
import { getDailyTrades, TRADE_FLOWERS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import BouquetMaker from '../components/BouquetMaker';
import { PixelText, PixelButton, PixelPanel, PixelToast, COLORS, PIXEL_FONT } from '../components/Pixel';

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

// Cream trade panel on tradingscreen.png (base 1376x768) and the painted coin stack.
const PANEL = { x: 270, y: 283, w: 840, h: 316 }; // x/y = left/top
const COIN_STACK = { x: 996, y: 436, w: 150, h: 190 };
// The background has the previous market's prices baked in above each tile. We
// cover them with a plaque and print the live price on top, so they never overlap.
const TAG = { dx: 12, dy: -58, w: 106, h: 34 };

export default function TradingScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;
  const fx = (v) => (v / PLOPPER_W) * sw;
  const fy = (v) => (v / PLOPPER_H) * sh;

  // Today's 6 featured flowers + rates — stable within the day.
  const offers = useMemo(() => getDailyTrades(), []);
  const offerByKey = useMemo(() => {
    const m = {};
    offers.forEach((o) => { m[o.key] = o; });
    return m;
  }, [offers]);

  const [invOpen, setInvOpen] = useState(false);
  const [bouquetOpen, setBouquetOpen] = useState(false);
  const [active, setActive] = useState(null); // offer being traded
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 1500); };

  const select = (flowerKey) => {
    const offer = offerByKey[flowerKey];
    if (!offer) { showToast('NOT WANTED TODAY'); return; }
    if ((harvested[flowerKey] ?? 0) <= 0) { showToast("YOU HAVE NONE"); return; }
    setInvOpen(false);
    setActive(offer);
    setQty(1);
  };

  const have = active ? (harvested[active.key] ?? 0) : 0;
  const total = active ? qty * active.price : 0;

  const confirmTrade = () => {
    if (!active || have <= 0) return;
    dispatch({ type: 'TRADE_FLOWERS', flowerKey: active.key, qty, unitPrice: active.price });
    showToast(`SOLD ${qty} ${active.name.toUpperCase()}`);
    setActive(null);
  };

  const ownedFlowers = Object.entries(harvested).filter(([k, n]) => n > 0 && TRADE_FLOWERS[k]);

  const panelL = fx(PANEL.x), panelT = fy(PANEL.y);
  const panelW = fx(PANEL.w), panelH = fy(PANEL.h);
  const coinW = fx(COIN_STACK.w), coinH = fy(COIN_STACK.h);

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={TRADING_BG} style={styles.bg} resizeMode="stretch" />

      {/* Daily board — flower in each tile, live price on a plaque over the old print */}
      {offers.map((offer, i) => {
        const s = SLOTS[i];
        if (!s) return null;
        const iw = fx(s.w), ih = fy(s.h);
        const owned = harvested[offer.key] ?? 0;
        return (
          <React.Fragment key={offer.key}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => select(offer.key)}
              style={[{ position: 'absolute', left: fx(s.x) - fx(60), top: fy(s.y) - fy(52), width: fx(120), height: fy(104), alignItems: 'center', justifyContent: 'center', zIndex: 10 }, active?.key === offer.key && styles.tileOn]}
            >
              <Image source={TRADE_IMAGES[offer.img]} style={{ width: iw, height: ih }} resizeMode="contain" />
              {owned > 0 && (
                <View style={styles.ownedBadge}><PixelText size={Math.max(7, fx(9))}>{owned}</PixelText></View>
              )}
            </TouchableOpacity>
            <View
              pointerEvents="none"
              style={[styles.tag, { left: fx(s.x + TAG.dx - TAG.w / 2), top: fy(s.y + TAG.dy - TAG.h / 2), width: fx(TAG.w), height: fy(TAG.h) }]}
            >
              <Image source={UI_IMAGES.goldcoins} style={{ width: fy(22), height: fy(22) }} resizeMode="contain" />
              <PixelText size={Math.max(8, fx(12))} style={{ marginLeft: 4 }}>{offer.price}</PixelText>
            </View>
          </React.Fragment>
        );
      })}

      {/* Trade controls live in the big cream panel, beside the coin stack */}
      <View style={{ position: 'absolute', left: panelL, top: panelT, width: panelW, height: panelH, zIndex: 12, flexDirection: 'row' }} pointerEvents="box-none">
        <View style={{ flex: 1, paddingRight: coinW + fx(24), paddingLeft: fx(18), justifyContent: 'center' }}>
          {!active ? (
            <View style={{ alignItems: 'center' }}>
              <PixelText size={Math.max(9, fx(14))} color="#5a3410" style={styles.dark}>PICK A FLOWER TO SELL</PixelText>
              <PixelText size={Math.max(7, fx(10))} color="#8a5a24" style={[styles.dark, { marginTop: fy(14) }]}>TAP ONE ABOVE OR OPEN MY FLOWERS</PixelText>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* 1. What you're selling */}
              <View style={{ alignItems: 'center', width: fx(170) }}>
                <Image source={TRADE_IMAGES[active.img]} style={{ width: fx(110), height: fy(110) }} resizeMode="contain" />
                <PixelText size={Math.max(8, fx(12))} color="#5a3410" style={styles.dark}>{active.name.toUpperCase()}</PixelText>
                <PixelText size={Math.max(7, fx(9))} color="#8a5a24" style={[styles.dark, { marginTop: fy(6) }]}>YOU HAVE {have}</PixelText>
              </View>

              {/* 2. How many + confirm */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <PixelText size={Math.max(7, fx(10))} color="#8a5a24" style={[styles.dark, { marginBottom: fy(8) }]}>HOW MANY?</PixelText>
                <View style={styles.qtyRow}>
                  <PixelButton label="-" tone="wood" onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn} size={14} />
                  <View style={styles.qtyBox}>
                    <PixelText size={Math.max(14, fx(22))} color="#5a3410" style={styles.qtyNum}>{qty}</PixelText>
                  </View>
                  <PixelButton label="+" tone="wood" onPress={() => setQty((q) => Math.min(have, q + 1))} style={styles.qtyBtn} size={14} />
                  <PixelButton label="ALL" tone="wood" onPress={() => setQty(have)} size={9} />
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={confirmTrade} activeOpacity={0.8}>
                    <Image source={UI_IMAGES.tradebtn} style={{ width: fx(150), height: fy(92) }} resizeMode="contain" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActive(null)} activeOpacity={0.8}>
                    <Image source={UI_IMAGES.cancelbutton} style={{ width: fx(52), height: fy(52) }} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 3. What you get — printed around the coin stack */}
      {active && (
        <>
          <View pointerEvents="none" style={{ position: 'absolute', left: fx(COIN_STACK.x) - coinW / 2, top: fy(COIN_STACK.y) - coinH / 2 - fy(26), width: coinW, alignItems: 'center', zIndex: 13 }}>
            <PixelText size={Math.max(7, fx(10))} color="#5a3410" style={styles.dark}>YOU GET</PixelText>
          </View>
          <View pointerEvents="none" style={[styles.totalPlate, { left: fx(COIN_STACK.x) - fx(52), top: fy(COIN_STACK.y) + coinH / 2 - fy(2), width: fx(104) }]}>
            <PixelText size={Math.max(10, fx(16))} color={COLORS.gold}>{total}</PixelText>
          </View>
        </>
      )}

      {/* Sell single flowers (featured today) or tie any 3 into a bouquet */}
      <View style={styles.btnRow}>
        <PixelButton label="MY FLOWERS" onPress={() => setInvOpen(true)} />
        <PixelButton label="MAKE BOUQUET" tone="wood" onPress={() => setBouquetOpen(true)} />
      </View>

      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
      />

      {invOpen && (
        <View style={styles.modalOverlay}>
          <PixelPanel style={styles.invPanel}>
            <View style={styles.invHeader}>
              <PixelText size={14}>MY FLOWERS</PixelText>
              <TouchableOpacity onPress={() => setInvOpen(false)} activeOpacity={0.8}>
                <Image source={UI_IMAGES.cancelbutton} style={styles.invClose} resizeMode="contain" />
              </TouchableOpacity>
            </View>
            <PixelText size={8} color="#e8c890" style={{ marginBottom: 12 }}>TAP A FLOWER THE MARKET WANTS TODAY</PixelText>
            {ownedFlowers.length === 0 ? (
              <PixelText size={9} color="#e8c890" style={{ textAlign: 'center', paddingVertical: 24 }}>NO HARVESTED FLOWERS YET</PixelText>
            ) : (
              <View style={styles.invGrid}>
                {ownedFlowers.map(([key, n]) => {
                  const tf = TRADE_FLOWERS[key];
                  const featured = !!offerByKey[key];
                  return (
                    <TouchableOpacity key={key} style={[styles.invCell, !featured && styles.invCellDim]} activeOpacity={0.8} onPress={() => select(key)}>
                      <Image source={TRADE_IMAGES[tf.img]} style={styles.invCellImg} resizeMode="contain" />
                      <PixelText size={10} style={styles.invCellCount}>{n}</PixelText>
                      {featured && (
                        <View style={styles.invCellRate}><PixelText size={8}>{offerByKey[key].price}</PixelText></View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </PixelPanel>
        </View>
      )}

      {bouquetOpen && (
        <BouquetMaker onClose={() => setBouquetOpen(false)} onSold={showToast} />
      )}

      <PixelToast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0800' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },

  // Plaque that hides the baked-in price and carries the live one
  tag: {
    position: 'absolute', zIndex: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#a36122', borderWidth: 3, borderColor: '#5a3410', borderRadius: 4,
  },
  ownedBadge: {
    position: 'absolute', right: 0, bottom: 0,
    backgroundColor: COLORS.woodDark, borderWidth: 2, borderColor: COLORS.woodEdge, borderRadius: 3,
    paddingHorizontal: 4, paddingVertical: 2,
  },

  dark: { textShadowColor: 'rgba(255,240,200,0.7)', textShadowRadius: 0, textShadowOffset: { width: 1, height: 1 } },
  tileOn: { borderWidth: 3, borderColor: '#3d7a2a', borderRadius: 4, backgroundColor: 'rgba(61,122,42,0.18)' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  qtyBox: {
    minWidth: 64, paddingVertical: 6, alignItems: 'center',
    backgroundColor: '#fff3d6', borderWidth: 3, borderColor: '#b8793a', borderRadius: 4,
  },
  qtyNum: { textShadowColor: 'transparent', textShadowRadius: 0 },
  totalPlate: {
    position: 'absolute', zIndex: 13, alignItems: 'center', paddingVertical: 4,
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  btnRow: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 12, zIndex: 25 },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  invPanel: { width: '80%', maxWidth: 560, maxHeight: '86%' },
  invHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  invClose: { width: 36, height: 36 },
  invGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  invCell: {
    width: 76, height: 76, borderRadius: 4, backgroundColor: COLORS.cream,
    borderWidth: 3, borderColor: COLORS.creamEdge, alignItems: 'center', justifyContent: 'center',
  },
  invCellDim: { opacity: 0.4 },
  invCellImg: { width: 54, height: 54 },
  invCellCount: { position: 'absolute', right: 3, bottom: 2 },
  invCellRate: {
    position: 'absolute', top: -8, left: -6, backgroundColor: COLORS.green,
    borderWidth: 2, borderColor: COLORS.greenEdge, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 2,
  },
});
