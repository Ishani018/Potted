import React, { useState } from 'react';
import { View, Text, Image, PanResponder, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { NURSERY_BG, SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { POTTED_FLOWERS, HANGING_PLANTS, seedType, FLOWER_GROWTH, formatDuration } from '../constants/gameData';
import InventoryOverlay from '../components/InventoryOverlay';
import ScreenHud from '../components/ScreenHud';
import { useNotice } from '../components/PurchaseNotice';

// All buyable seeds keyed by flowerKey → { name, price }.
const SEED_INFO = {};
[...Object.values(POTTED_FLOWERS).filter((f) => !f.rare), ...Object.values(HANGING_PLANTS)].forEach((s) => {
  SEED_INFO[s.key] = { name: s.name, price: s.seedPrice ?? 10 };
});

// The shop picture is 1671x941. Each seed bag has a spot on the shelves (centre x, y of the plank it stands on).
const IMG_W = 1671;
const IMG_H = 941;
const BAG = { w: 74, h: 80 };
const SPOTS = {
  snapdragon:     [630, 188],
  peony:          [680, 294],
  hydrenga:       [470, 398],
  daisy:          [545, 398],
  poppy:          [440, 503],
  rose:           [665, 503],
  marigold:       [622, 593],
  stringofpearls: [917, 188],
  petunia:        [922, 294],
  jasmine:        [812, 398],
  Philodendron:   [1065, 398],
  Bougainvillea:  [1062, 503],
};
const COUNTER_TOP = 725;                                  // the counter's back edge: drop a bag below this line to put it down
const COUNTER_SLOTS = Array.from({ length: 12 }, (_, i) => [250 + (i % 6) * 150, 800 + Math.floor(i / 6) * 85]);   // where bags sit on the counter
const REGISTER = { x0: 1255, y0: 640, x1: 1545, y1: 880 };
const LCD = { x: 1425, y: 690 };                          // the register's little screen

// One seed bag you can pick up and drag (on a shelf or on the counter).
function DragBag({ item, at, k, onDrop, onTap, dim, z }) {
  const [pos, setPos] = useState(null);
  const start = React.useRef([0, 0]);
  const live = React.useRef({ at, k, onDrop, onTap });
  live.current = { at, k, onDrop, onTap };
  const pan = React.useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { start.current = [live.current.at[0], live.current.at[1]]; },
    onPanResponderMove: (_, g) => setPos([start.current[0] + g.dx / live.current.k, start.current[1] + g.dy / live.current.k]),
    onPanResponderRelease: (_, g) => {
      const moved = Math.abs(g.dx) + Math.abs(g.dy) > 6;
      const p = [start.current[0] + g.dx / live.current.k, start.current[1] + g.dy / live.current.k];
      setPos(null);
      if (moved) live.current.onDrop(p); else live.current.onTap();
    },
    onPanResponderTerminate: () => setPos(null),
  })).current;
  const [x, y] = pos ?? at;
  const w = BAG.w * k, h = BAG.h * k;
  return (
    <View {...pan.panHandlers} style={{ position: 'absolute', left: x * k - w / 2, top: y * k - h, width: w, height: h, zIndex: pos ? 500 : z, opacity: dim ? 0.4 : 1 }}>
      <Image source={SEED_IMAGES[item]} pointerEvents="none" style={{ width: w, height: h }} resizeMode="contain" />
    </View>
  );
}

export default function NurseryScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const coins = state.player.coins;

  const [notice, notify] = useNotice();
  const [invOpen, setInvOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [basket, setBasket] = useState([]);                 // seed keys put down on the counter
  const sw = box.w, sh = box.h;
  const kx = sw / IMG_W;   // the picture fills the box (its shape is within 1% of the box's), so one scale serves both axes

  const INVENTORY_CAP = 35;
  const free = INVENTORY_CAP - (state.inventory?.length ?? 0);
  const total = basket.reduce((n, key) => n + (SEED_INFO[key]?.price ?? 0), 0);

  // drop a bag: onto the counter puts it in the basket; anywhere else sends it back to its shelf
  const dropOnCounter = (key, p) => {
    if (p[1] < COUNTER_TOP) return;
    const info = SEED_INFO[key];
    if (basket.includes(key)) return;
    if (basket.length >= Math.min(12, free)) { notify({ icon: UI_IMAGES.inventorybtn, title: 'Bag is full', subtitle: 'Plant some seeds to make room.' }); return; }
    setBasket((b) => [...b, key]);
  };

  const checkout = () => {
    if (basket.length === 0) { notify({ icon: UI_IMAGES.goldcoins, title: 'The counter is empty', subtitle: 'Drag seed bags from the shelves to the counter.' }); return; }
    if (coins < total) { notify({ icon: UI_IMAGES.goldcoins, title: 'Not enough coins', subtitle: `You need ${total - coins} more for these.` }); return; }
    basket.forEach((key) => dispatch({ type: 'BUY_SEED', flowerKey: key, price: SEED_INFO[key].price }));
    notify({ icon: SEED_IMAGES[basket[0]], title: basket.length === 1 ? `Bought ${SEED_INFO[basket[0]].name}!` : `Bought ${basket.length} seed bags!`, subtitle: `${total} coins. They are in your bag.` });
    setBasket([]);
  };

  const shelfBags = Object.keys(SPOTS).filter((key) => SEED_INFO[key] && !basket.includes(key));

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image
        source={NURSERY_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        resizeMode="stretch"
      />

      {sw > 0 && (
        <>
          {/* seed bags on the shelves: drag one to the counter (or tap to see its price) */}
          {shelfBags.map((key) => {
            const info = SEED_INFO[key];
            return (
              <React.Fragment key={key}>
                <DragBag item={key} at={SPOTS[key]} k={kx} z={6}
                  onDrop={(p) => dropOnCounter(key, p)}
                  onTap={() => notify({ icon: SEED_IMAGES[key], title: info.name, subtitle: `${info.price} coins. Drag it to the counter to buy.` })} />
                <View pointerEvents="none" style={{ position: 'absolute', left: SPOTS[key][0] * kx - 26 * kx, top: (SPOTS[key][1] + 4) * kx, width: 52 * kx, alignItems: 'center', zIndex: 7 }}>
                  <View style={styles.priceChip}><Text style={styles.priceText}>{info.price}</Text></View>
                </View>
              </React.Fragment>
            );
          })}

          {/* the bags put down on the counter: drag them off, or tap, to put one back */}
          {basket.map((key, i) => (
            <DragBag key={key} item={key} at={COUNTER_SLOTS[i]} k={kx} z={8}
              onDrop={(p) => { if (p[1] < COUNTER_TOP) setBasket((b) => b.filter((x) => x !== key)); }}
              onTap={() => setBasket((b) => b.filter((x) => x !== key))} />
          ))}

          {/* the register: its screen shows the total; tap it to check out */}
          <TouchableOpacity activeOpacity={0.85} onPress={checkout}
            style={{ position: 'absolute', left: REGISTER.x0 * kx, top: REGISTER.y0 * kx, width: (REGISTER.x1 - REGISTER.x0) * kx, height: (REGISTER.y1 - REGISTER.y0) * kx, zIndex: 9 }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: (LCD.x - 55) * kx, top: LCD.y * kx - 12 * kx, width: 110 * kx, alignItems: 'center', zIndex: 10 }}>
            <Text style={{ fontFamily: Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' }), fontSize: 20 * kx, color: '#9cff9c', fontWeight: 'bold' }}>{total}</Text>
          </View>
          {basket.length > 0 && (
            <View pointerEvents="none" style={{ position: 'absolute', left: (REGISTER.x0 - 10) * kx, top: (REGISTER.y0 - 52) * kx, width: (REGISTER.x1 - REGISTER.x0 + 20) * kx, alignItems: 'center', zIndex: 10 }}>
              <View style={styles.hintChip}><Text style={styles.hintText}>Tap the register to pay</Text></View>
            </View>
          )}
        </>
      )}

      {/* Standard HUD — settings (TL) + map (TR) + inventory (BL) */}
      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
        onBook={() => navigation.navigate('FlowerBook')}
      />

      {/* Coins — top, beside the HUD */}
      <View style={styles.coinBox}>
        <Image source={UI_IMAGES.goldcoins} style={styles.coinIcon} resizeMode="contain" />
        <Text style={styles.coinText}>{coins}</Text>
      </View>

      {notice}

      {invOpen && (
        <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />
      )}
    </View>
  );
}

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0f00', overflow: 'hidden', userSelect: 'none' },
  coinBox: {
    position: 'absolute', top: 14, left: 0, right: 0, alignSelf: 'center', zIndex: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 3, width: 96, marginLeft: 'auto', marginRight: 'auto',
  },
  coinIcon: { width: 22, height: 22 },
  coinText: { fontFamily: SERIF, fontSize: 18, color: '#4a2a10', fontWeight: 'bold' },
  priceChip: { backgroundColor: 'rgba(243,224,182,0.95)', borderWidth: 2, borderColor: '#8a5a2a', borderRadius: 9, paddingHorizontal: 6, paddingVertical: 0 },
  priceText: { userSelect: 'none', fontFamily: SERIF, fontSize: 12, color: '#4a2a10', fontWeight: 'bold' },
  hintChip: { backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  hintText: { fontFamily: SERIF, fontSize: 13, color: '#4a2a10' },
});
