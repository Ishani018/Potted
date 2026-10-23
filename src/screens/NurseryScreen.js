import React, { useState } from 'react';
import { View, Text, Image, PanResponder, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { NURSERY_BG, SEED_IMAGES, UI_IMAGES, PPOT_META, PPOT_IDS, HPOT_META, HPOT_ORDER, CAN_IMAGES, SET_UI } from '../engine/assets';
import { POTTED_FLOWERS, HANGING_PLANTS, seedType, FLOWER_GROWTH, formatDuration, HPOT_INFO, PPOT_PRICE, CAN_INFO } from '../constants/gameData';
import InventoryOverlay from '../components/InventoryOverlay';
import ScreenHud from '../components/ScreenHud';
import { useNotice } from '../components/PurchaseNotice';

// The nursery: seeds on the big left shelves, pots on the right shelves and hooks, the red watering can on the floor.
// Drag anything to the counter, then tap the register to pay for it all.

// All buyable seeds keyed by flowerKey → { name, price }.
const SEED_INFO = {};
[...Object.values(POTTED_FLOWERS).filter((f) => !f.rare), ...Object.values(HANGING_PLANTS)].forEach((s) => {
  SEED_INFO[s.key] = { name: s.name, price: s.seedPrice ?? 10 };
});

// The shop picture is 1672x941; every position below is in its own pixels. A spot is where an item's feet rest.
const IMG_W = 1672;
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const SEED_ORDER = ['daisy', 'snapdragon', 'poppy', 'marigold', 'peony', 'hydrenga', 'rose', 'stringofpearls', 'Philodendron', 'jasmine', 'petunia', 'Bougainvillea'];
const jit = (i, n) => (((i * 37 + n * 17) % 11) - 5);          // a steady little wobble, so things look put there by hand, not on a grid
const SHELF_Y = [262, 360, 460, 562];                       // top of each board on the big shelf unit
// seeds: four to a shelf on the top three boards, bunched towards the left, a little uneven
const SEED_SPOTS = SEED_ORDER.map((k, i) => [350 + (i % 4) * 92 + jit(i, 1) * 2, SHELF_Y[Math.floor(i / 4)] + 8 + (jit(i, 2) > 2 ? 2 : 0)]);
const POT_Y = [312, 410, 508, 604];                         // boards of the right shelf unit
// pots: four to a board on the lower three boards (the top board is left for the hooks' pots)
const POT_SPOTS = Array.from({ length: 12 }, (_, i) => [930 + (i % 4) * 80 + jit(i, 3) * 1.5, POT_Y[1 + Math.floor(i / 4)] + 8]);
const HOOK_SPOTS = [955, 1028, 1100, 1175].map((x) => [x, 236]);   // where a hanging pot's top sits
const CAN_SPOT = [330, 735];
const BAG = { w: 62, h: 56 };
const POT_W = 58;                                           // shelf pot width on the shelf
const HOOK_H = 66;                                          // hanging pot height on its hook
const COUNTER_TOP = 770;                                    // drop an item below this line to put it on the counter
const COUNTER_X = (i) => 150 + (i % 8) * 150;
const COUNTER_Y = (i) => 872 + Math.floor(i / 8) * 55;
const COUNTER_MUL = 1.5;
const REGISTER = { x0: 1360, y0: 690, x1: 1610, y1: 890 };
const LCD = { x: 1488, y: 755 };
const MAX_BASKET = 12;

// what an item id means: 's:daisy' seed, 'p:12' shelf pot, 'h:chain' hanging pot, 'c:red' can
function describe(id) {
  const [kind, key] = id.split(':');
  if (kind === 's') return { name: SEED_INFO[key].name, price: SEED_INFO[key].price, src: SEED_IMAGES[key], w: BAG.w, h: BAG.h };
  if (kind === 'p') { const m = PPOT_META[key]; return { name: 'A shelf pot', price: PPOT_PRICE[key], src: m.src, w: POT_W, h: POT_W * m.h / m.w }; }
  if (kind === 'h') { const m = HPOT_META[key]; return { name: HPOT_INFO[key].name, price: HPOT_INFO[key].price, src: m.src, w: HOOK_H * m.w / m.h, h: HOOK_H, hanging: true }; }
  return { name: 'The red watering can', price: CAN_INFO.red.price, src: CAN_IMAGES.red.up.src, w: 130, h: 118 };
}

// One thing you can pick up and drag (on a shelf or on the counter). at = feet position; k = screen px per picture px.
function DragItem({ it, at, k, onDrop, onTap, z, mul = 1 }) {
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
  const w = it.w * k * mul, h = it.h * k * mul;
  // a hanging pot hangs by its top, the rest stand on their feet
  const top = it.hanging && !pos ? y * k : y * k - h;
  return (
    <View {...pan.panHandlers} style={{ position: 'absolute', left: x * k - w / 2, top, width: w, height: h, zIndex: pos ? 500 : z }}>
      <Image source={it.src} pointerEvents="none" style={{ width: w, height: h }} resizeMode="contain" />
    </View>
  );
}

export default function NurseryScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const { coins, ownedPPots = [4], ownedHPots = ['macrame'], ownedCans = ['blue'] } = state.player;

  const [notice, notify] = useNotice();
  const [invOpen, setInvOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [basket, setBasket] = useState([]);                 // item ids put down on the counter
  const [potPage, setPotPage] = useState(0);
  const [hookPage, setHookPage] = useState(0);
  const sw = box.w;
  const k = sw / IMG_W;

  const INVENTORY_CAP = 35;
  const free = INVENTORY_CAP - (state.inventory?.length ?? 0);
  const total = basket.reduce((n, id) => n + describe(id).price, 0);

  // pots you do not own yet, shown 12 (shelf) and 4 (hooks) at a time
  const shelfPots = PPOT_IDS.filter((id) => !ownedPPots.includes(id));
  const hookPots = HPOT_ORDER.filter((id) => !ownedHPots.includes(id));
  const potPages = Math.max(1, Math.ceil(shelfPots.length / 12)), hookPages = Math.max(1, Math.ceil(hookPots.length / 4));
  const pPage = Math.min(potPage, potPages - 1), hPage = Math.min(hookPage, hookPages - 1);
  const seats = shelfPots.slice(pPage * 12, pPage * 12 + 12);
  const hooks = hookPots.slice(hPage * 4, hPage * 4 + 4);

  const dropOnCounter = (id, p) => {
    if (p[1] < COUNTER_TOP || basket.includes(id)) return;
    const seeds = basket.filter((b) => b.startsWith('s:')).length + (id.startsWith('s:') ? 1 : 0);
    if (seeds > free) { notify({ icon: UI_IMAGES.inventorybtn, title: 'Bag is full', subtitle: 'Plant some seeds to make room.' }); return; }
    if (basket.length >= MAX_BASKET) { notify({ title: 'The counter is full', subtitle: 'Pay for these first.' }); return; }
    setBasket((b) => [...b, id]);
  };
  const tellAbout = (id) => { const d = describe(id); notify({ icon: d.src, title: d.name, subtitle: `${d.price} coins. Drag it to the counter to buy.` }); };

  const checkout = () => {
    if (basket.length === 0) { notify({ icon: UI_IMAGES.goldcoins, title: 'The counter is empty', subtitle: 'Drag things from the shelves to the counter.' }); return; }
    if (coins < total) { notify({ icon: UI_IMAGES.goldcoins, title: 'Not enough coins', subtitle: `You need ${total - coins} more for these.` }); return; }
    basket.forEach((id) => {
      const [kind, key] = id.split(':');
      if (kind === 's') dispatch({ type: 'BUY_SEED', flowerKey: key, price: SEED_INFO[key].price });
      else if (kind === 'p') dispatch({ type: 'BUY_PPOT', pot: Number(key), price: PPOT_PRICE[key] });
      else if (kind === 'h') dispatch({ type: 'BUY_HPOT', pot: key, price: HPOT_INFO[key].price });
      else dispatch({ type: 'BUY_CAN', can: key, price: CAN_INFO[key].price });
    });
    const first = describe(basket[0]);
    notify({ icon: first.src, title: basket.length === 1 ? `Bought ${first.name}!` : `Bought ${basket.length} things!`, subtitle: `${total} coins. Pots and cans are yours to use in the rooms.` });
    setBasket([]);
  };

  const stock = (ids, spots, extra = {}) => ids.map((id, i) => (spots[i] ? { id, at: spots[i], ...extra } : null)).filter(Boolean).filter((e) => !basket.includes(e.id));
  const onShelf = [
    ...stock(SEED_ORDER.map((s) => 's:' + s), SEED_SPOTS),
    ...stock(seats.map((p) => 'p:' + p), POT_SPOTS),
    ...stock(hooks.map((h) => 'h:' + h), HOOK_SPOTS),
    ...(!ownedCans.includes('red') ? stock(['c:red'], [CAN_SPOT]) : []),
  ];

  const arrow = (key, x, y, on, label) => (
    <TouchableOpacity activeOpacity={0.8} onPress={on} style={{ position: 'absolute', left: (x - 22) * k, top: (y - 22) * k, zIndex: 12 }}>
      <Image source={SET_UI[key].src} resizeMode="contain" style={{ width: 44 * k * 1.1, height: 44 * k * 1.1 * SET_UI[key].h / SET_UI[key].w }} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={NURSERY_BG} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} resizeMode="stretch" />

      {sw > 0 && (
        <>
          {onShelf.map(({ id, at }) => {
            const d = describe(id);
            return (
              <React.Fragment key={id}>
                <DragItem it={d} at={at} k={k} z={6} onDrop={(p) => dropOnCounter(id, p)} onTap={() => tellAbout(id)} />
                <View pointerEvents="none" style={{ position: 'absolute', left: (at[0] + (d.hanging ? d.w / 2 - 10 : d.w / 2 - 22)) * k, top: (at[1] + (d.hanging ? d.h - 18 : -14)) * k, zIndex: 7 }}>
                  <View style={styles.priceChip}><Text style={styles.priceText}>{d.price}</Text></View>
                </View>
              </React.Fragment>
            );
          })}

          {/* page the pots */}
          {potPages > 1 && (
            <>
              {arrow('left', 960, 700, () => setPotPage((pPage + potPages - 1) % potPages))}
              <View pointerEvents="none" style={[styles.pageChip, { left: 1030 * k, top: 686 * k, width: 70 * k }]}><Text style={styles.priceText}>{pPage + 1} / {potPages}</Text></View>
              {arrow('right', 1175, 700, () => setPotPage((pPage + 1) % potPages))}
            </>
          )}
          {hookPages > 1 && (
            <>
              {arrow('left', 915, 140, () => setHookPage((hPage + hookPages - 1) % hookPages))}
              {arrow('right', 1218, 140, () => setHookPage((hPage + 1) % hookPages))}
            </>
          )}

          {/* what is on the counter: drag it off, or tap, to put it back */}
          {basket.map((id, i) => (
            <DragItem key={id} it={describe(id)} at={[COUNTER_X(i), COUNTER_Y(i)]} k={k} z={8} mul={COUNTER_MUL}
              onDrop={(p) => { if (p[1] < COUNTER_TOP) setBasket((b) => b.filter((x) => x !== id)); }}
              onTap={() => setBasket((b) => b.filter((x) => x !== id))} />
          ))}

          {/* the register: its screen shows the total; tap it to check out */}
          <TouchableOpacity activeOpacity={0.85} onPress={checkout}
            style={{ position: 'absolute', left: REGISTER.x0 * k, top: REGISTER.y0 * k, width: (REGISTER.x1 - REGISTER.x0) * k, height: (REGISTER.y1 - REGISTER.y0) * k, zIndex: 9 }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: (LCD.x - 60) * k, top: LCD.y * k - 12 * k, width: 120 * k, alignItems: 'center', zIndex: 10 }}>
            <Text style={{ fontFamily: SERIF, fontSize: 22 * k, color: '#9cff9c', fontWeight: 'bold' }}>{total}</Text>
          </View>
          {basket.length > 0 && (
            <View pointerEvents="none" style={{ position: 'absolute', left: (REGISTER.x0 - 80) * k, top: (REGISTER.y0 - 60) * k, width: (REGISTER.x1 - REGISTER.x0 + 160) * k, alignItems: 'center', zIndex: 10 }}>
              <View style={styles.hintChip}><Text style={styles.hintText}>Tap the register to pay</Text></View>
            </View>
          )}
        </>
      )}

      <ScreenHud
        sw={sw} sh={box.h}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
        onBook={() => navigation.navigate('FlowerBook')}
      />

      <View style={styles.coinBox}>
        <Image source={UI_IMAGES.goldcoins} style={styles.coinIcon} resizeMode="contain" />
        <Text style={styles.coinText}>{coins}</Text>
      </View>

      {notice}
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

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
  priceChip: { backgroundColor: 'rgba(243,224,182,0.95)', borderWidth: 1.5, borderColor: '#8a5a2a', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 0 },
  priceText: { userSelect: 'none', fontFamily: SERIF, fontSize: 10, color: '#4a2a10', fontWeight: 'bold' },
  pageChip: { position: 'absolute', alignItems: 'center', backgroundColor: 'rgba(243,224,182,0.95)', borderWidth: 2, borderColor: '#8a5a2a', borderRadius: 9, zIndex: 12 },
  hintChip: { backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  hintText: { fontFamily: SERIF, fontSize: 13, color: '#4a2a10' },
});
