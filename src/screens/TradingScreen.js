import React, { useState, useMemo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_BG, TRADE_IMAGES, UI_IMAGES, SET_UI } from '../engine/assets';
import { getDailyTrades } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import { useNotice } from '../components/PurchaseNotice';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

// A button drawn with the UI sheet's blank plates.
function PlateBtn({ tone = 'btnCream', label, onPress, w = 120, h = 40, disabled, color = '#4a2a10' }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={disabled ? undefined : onPress} style={{ width: w, height: h, opacity: disabled ? 0.5 : 1 }}>
      <Image source={SET_UI[tone].src} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }} />
      <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
        <Text numberOfLines={1} style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 'bold', color }}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// The flower market: today's six wanted flowers on the left; pick one and sell it on the right.
export default function TradingScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const offers = useMemo(() => getDailyTrades(), []);
  const [invOpen, setInvOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [qty, setQty] = useState(1);
  const [notice, notify] = useNotice();
  const [box, setBox] = useState({ w: 0, h: 0 });

  const active = offers.find((o) => o.key === activeKey) || null;
  const have = active ? (harvested[active.key] ?? 0) : 0;
  const total = active ? qty * active.price : 0;

  const pick = (offer) => {
    if ((harvested[offer.key] ?? 0) <= 0) { notify({ icon: TRADE_IMAGES[offer.img], title: offer.name, subtitle: 'You have none to sell yet.' }); return; }
    setActiveKey(offer.key); setQty(1);
  };

  const sell = () => {
    if (!active || have <= 0) return;
    dispatch({ type: 'TRADE_FLOWERS', flowerKey: active.key, qty, unitPrice: active.price });
    notify({ icon: TRADE_IMAGES[active.img], title: `Sold ${qty} ${active.name}`, subtitle: `You earned ${total} coins.` });
    setActiveKey(null);
  };

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={TRADE_BG} style={styles.bg} resizeMode="stretch" />
      <View style={styles.haze} />

      <View style={styles.panel}>
        <Text style={styles.title}>Flower market</Text>
        <Text style={styles.sub}>Today the market wants these. Prices change every day.</Text>

        <View style={{ flexDirection: 'row', gap: 14 }}>
          {/* today's six */}
          <View style={styles.grid}>
            {offers.map((o) => {
              const n = harvested[o.key] ?? 0;
              return (
                <TouchableOpacity key={o.key} activeOpacity={0.85} onPress={() => pick(o)} style={[styles.tile, active?.key === o.key && styles.tileOn, n <= 0 && { opacity: 0.55 }]}>
                  <Image source={TRADE_IMAGES[o.img]} style={{ width: 54, height: 50 }} resizeMode="contain" />
                  <View style={styles.priceRow}>
                    <Image source={UI_IMAGES.goldcoins} style={{ width: 16, height: 16 }} resizeMode="contain" />
                    <Text style={styles.tilePrice}>{o.price}</Text>
                  </View>
                  {n > 0 ? <View style={styles.badge}><Text style={styles.badgeTxt}>{n}</Text></View> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* what you are selling */}
          <View style={styles.detail}>
            {!active ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={UI_IMAGES.goldcoins} style={{ width: 60, height: 60, marginBottom: 6 }} resizeMode="contain" />
                <Text style={styles.name}>Pick a flower to sell</Text>
                <Text style={styles.sub}>Tap one on the left, or open My flowers.</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
                <View style={styles.pic}><Image source={TRADE_IMAGES[active.img]} style={{ width: 84, height: 80 }} resizeMode="contain" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{active.name}</Text>
                  <View style={styles.rowLine}><Text style={styles.key}>Price each</Text><Text style={styles.val}>{active.price} coins</Text></View>
                  <View style={styles.rowLine}><Text style={styles.key}>You have</Text><Text style={styles.val}>{have}</Text></View>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} activeOpacity={0.8}><Image source={SET_UI.left.src} style={styles.arrow} resizeMode="contain" /></TouchableOpacity>
                    <View style={styles.qtyBox}><Text style={styles.qtyNum}>{qty}</Text></View>
                    <TouchableOpacity onPress={() => setQty((q) => Math.min(have, q + 1))} activeOpacity={0.8}><Image source={SET_UI.right.src} style={styles.arrow} resizeMode="contain" /></TouchableOpacity>
                    <PlateBtn label="All" onPress={() => setQty(have)} w={64} h={34} />
                  </View>
                </View>
              </View>
            )}
            {active ? (
              <View style={styles.footer}>
                <View style={styles.priceRow}>
                  <Image source={UI_IMAGES.goldcoins} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  <Text style={styles.total}>{total}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <PlateBtn label="Cancel" onPress={() => setActiveKey(null)} w={92} h={38} />
                  <PlateBtn tone="btnGreen" label={`Sell ${qty}`} onPress={sell} w={112} h={38} color="#fff3d0" />
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <PlateBtn label="My flowers" onPress={() => setInvOpen(true)} w={140} h={40} />
        </View>
      </View>

      <ScreenHud sw={box.w} sh={box.h} onSettings={() => navigation.navigate('Settings')} onMap={() => navigation.navigate('Map')} />

      {invOpen && (
        <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setInvOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.panel, { width: '60%' }]}>
            <TouchableOpacity onPress={() => setInvOpen(false)} style={styles.close}><Image source={SET_UI.close.src} style={{ width: 32, height: 31 }} resizeMode="contain" /></TouchableOpacity>
            <Text style={styles.title}>My flowers</Text>
            <Text style={styles.sub}>Tap one the market wants today to sell it.</Text>
            {Object.entries(harvested).filter(([, n]) => n > 0).length === 0 ? (
              <Text style={[styles.sub, { textAlign: 'center', paddingVertical: 20 }]}>No harvested flowers yet.</Text>
            ) : (
              <View style={styles.invGrid}>
                {offers.concat([]).length >= 0 && Object.entries(harvested).filter(([, n]) => n > 0).map(([key, n]) => {
                  const o = offers.find((x) => x.key === key);
                  const img = o ? TRADE_IMAGES[o.img] : null;
                  return (
                    <TouchableOpacity key={key} disabled={!o} activeOpacity={0.85} onPress={() => { setInvOpen(false); pick(o); }} style={[styles.tile, !o && { opacity: 0.4 }]}>
                      {img ? <Image source={img} style={{ width: 54, height: 50 }} resizeMode="contain" /> : <Text style={styles.sub}>{key}</Text>}
                      <View style={styles.badge}><Text style={styles.badgeTxt}>{n}</Text></View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      {notice}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1208' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  haze: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30,18,6,0.45)' },
  panel: { position: 'absolute', alignSelf: 'center', top: '9%', width: '80%', backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18, padding: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  title: { fontFamily: SERIF, fontSize: 22, fontWeight: 'bold', color: '#4a2a10' },
  sub: { fontFamily: SERIF, fontSize: 14, color: '#7a5030', marginBottom: 12 },
  grid: { width: 226, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' },
  tile: { width: 68, height: 84, borderRadius: 12, backgroundColor: '#e8cf9a', borderWidth: 2, borderColor: '#b98a4e', alignItems: 'center', justifyContent: 'center' },
  tileOn: { borderColor: '#2f5a22', backgroundColor: '#d6e2a8' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tilePrice: { fontFamily: SERIF, fontSize: 14, fontWeight: 'bold', color: '#4a2a10' },
  badge: { position: 'absolute', right: -4, top: -6, backgroundColor: '#8a5a2a', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeTxt: { fontFamily: SERIF, fontSize: 12, color: '#fff3d0', fontWeight: 'bold' },
  detail: { flex: 1, minHeight: 210, justifyContent: 'space-between', paddingLeft: 6 },
  pic: { width: 100, height: 100, borderRadius: 14, backgroundColor: '#e8cf9a', borderWidth: 2, borderColor: '#b98a4e', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: SERIF, fontSize: 22, fontWeight: 'bold', color: '#4a2a10' },
  rowLine: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#d9bd86', paddingVertical: 5 },
  key: { fontFamily: SERIF, fontSize: 14, color: '#7a5030' },
  val: { fontFamily: SERIF, fontSize: 14, color: '#4a2a10', fontWeight: 'bold' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  arrow: { width: 34, height: 31 },
  qtyBox: { minWidth: 52, paddingVertical: 4, alignItems: 'center', backgroundColor: '#fff6df', borderWidth: 2, borderColor: '#b98a4e', borderRadius: 10 },
  qtyNum: { fontFamily: SERIF, fontSize: 20, fontWeight: 'bold', color: '#4a2a10' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  total: { fontFamily: SERIF, fontSize: 24, fontWeight: 'bold', color: '#4a2a10' },
  close: { position: 'absolute', right: 10, top: 8, zIndex: 5 },
  invGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingTop: 6 },
});
