import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, Animated, PanResponder, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { NURSERY_BG, SEED_ICONS, SEED_IMAGES, UI_IMAGES, PPOT_META, PPOT_IDS, PPLANT_IMAGES, HPOT_META, HPOT_ORDER, CAN_IMAGES, SET_UI } from '../engine/assets';
import { POTTED_FLOWERS, HANGING_PLANTS, seedType, FLOWER_GROWTH, formatDuration, HPOT_INFO, PPOT_PRICE, PPOT_NAME, CAN_INFO } from '../constants/gameData';
import InventoryOverlay from '../components/InventoryOverlay';
import ScreenHud from '../components/ScreenHud';
import { useNotice } from '../components/PurchaseNotice';
import PottedArt, { pottedLayout } from '../components/PottedArt';

// The nursery: seeds on the big left shelves, pots on the right shelves and hooks, the red watering can on the floor.
// Drag anything to the counter, then tap the register to pay for it all.

// All buyable seeds keyed by flowerKey → { name, price }.
const SEED_INFO = {};
[...Object.values(POTTED_FLOWERS).filter((f) => !f.rare), ...Object.values(HANGING_PLANTS)].forEach((s) => {
  SEED_INFO[s.key] = { name: s.name, price: s.seedPrice ?? 10 };
});

// The shop picture is 1672x941; every position below is in its own pixels. A spot is where an item's feet rest.
const IMG_W = 1672;
const IMG_H = 941;
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const SEED_ORDER = ['daisy', 'snapdragon', 'poppy', 'marigold', 'peony', 'hydrenga', 'rose', 'stringofpearls', 'Philodendron', 'jasmine', 'petunia', 'Bougainvillea'];
// The shop picture has everything painted in. Each painted bag, pot and hanging pot gets an invisible handle laid over it;
// when it is bought, a copy of the picture without it ("bare") is shown through that spot, so the spot looks empty.
// Nine bags are painted on the counter (their flowers are our seeds'); the other three seeds are sold from the POTS panel.
const COUNTER_SEEDS = ['daisy', 'marigold', 'rose', 'hydrenga', 'jasmine', 'peony', 'poppy', 'petunia', 'snapdragon'];
const EXTRA_SEEDS = SEED_ORDER.filter((kk) => !COUNTER_SEEDS.includes(kk));
const SEED_BOX = (n) => { const cx = 263 + [0, 126, 248, 374, 500, 623, 748, 874, 1000][n]; return [cx - 50, 750, cx + 50, 862]; };
const POT_SLOTS = [
  { id: 'p:2', box: [325, 200, 405, 266] },
  { id: 'p:6', box: [420, 205, 512, 267] },
  { id: 'p:7', box: [530, 200, 612, 265] },
  { id: 'p:3', box: [633, 202, 710, 265] },
  { id: 'p:4', box: [732, 198, 800, 267] },
  { id: 'p:8', box: [326, 312, 420, 385] },
  { id: 'p:16', box: [435, 322, 522, 385] },
  { id: 'p:11', box: [535, 318, 612, 385] },
  { id: 'p:5', box: [635, 316, 710, 385] },
  { id: 'p:13', box: [733, 318, 808, 385] },
  { id: 'p:12', box: [330, 428, 415, 500] },
  { id: 'p:14', box: [430, 435, 507, 497] },
  { id: 'p:15', box: [520, 432, 620, 503] },
  { id: 'p:10', box: [630, 428, 717, 500] },
  { id: 'p:18', box: [732, 428, 812, 503] },
  { id: 'p:23', box: [322, 548, 428, 625] },
  { id: 'p:24', box: [435, 543, 510, 627] },
  { id: 'p:17', box: [524, 551, 612, 622] },
  { id: 'p:21', box: [633, 546, 715, 621] },
  { id: 'p:22', box: [735, 548, 815, 625] },
  { id: 'p:19', box: [905, 388, 985, 450] },
  { id: 'p:9', box: [1000, 382, 1080, 450] },
  { id: 'p:31', box: [1098, 385, 1180, 450] },
  { id: 'p:28', box: [1195, 385, 1275, 450] },
  { id: 'p:29', box: [908, 495, 982, 550] },
  { id: 'p:35', box: [1000, 490, 1072, 550] },
  { id: 'p:26', box: [1085, 485, 1185, 552] },
  { id: 'p:25', box: [1190, 487, 1272, 550] },
  { id: 'p:32', box: [900, 578, 998, 650] },
  { id: 'p:30', box: [1003, 583, 1078, 650] },
  { id: 'p:27', box: [1092, 583, 1175, 648] },
  { id: 'p:34', box: [1188, 584, 1268, 645] },
];
const HANG_SLOTS = [
  { id: 'h:macramethin', box: [898, 238, 992, 350] },
  { id: 'h:terracotta', box: [990, 236, 1082, 352] },
  { id: 'h:basket', box: [1080, 236, 1175, 352] },
  { id: 'h:chain', box: [1170, 236, 1268, 344] },
];
const CAN_SPOT = [1318, 700];
const BAG = { w: 88, h: 114 };
const REGISTER = { x0: 1360, y0: 690, x1: 1610, y1: 890 };
const LCD = { x: 1488, y: 755 };
const MAX_BASKET = 12;

// what an item id means: 's:daisy' seed, 'p:12' shelf pot, 'h:chain' hanging pot, 'c:red' can
function describe(id) {
  const [kind, key] = id.split(':');
  if (kind === 's') return { name: SEED_INFO[key].name, price: SEED_INFO[key].price, src: SEED_IMAGES[key], icon: SEED_ICONS[key], w: BAG.w, h: BAG.h };
  if (kind === 'p') { const m = PPOT_META[key]; return { name: PPOT_NAME[key], price: PPOT_PRICE[key], src: m.src, w: 80, h: 80 * m.h / m.w }; }
  if (kind === 'h') { const m = HPOT_META[key]; return { name: HPOT_INFO[key].name, price: HPOT_INFO[key].price, src: m.src, w: 60, h: 60 * m.h / m.w }; }
  return { name: 'The red watering can', price: CAN_INFO.red.price, src: CAN_IMAGES.red.up.src, w: 105, h: 94 };
}

// One thing you can pick up and drag (on a shelf or on the counter). at = feet position; k = screen px per picture px.
function DragItem({ it, at, k, onDrop, onTap, z, mul = 1, ghost = false }) {
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
      {it.seedling
        ? null
        : <Image source={it.src} pointerEvents="none" style={{ width: w, height: h, opacity: ghost && !pos ? 0 : 1 }} resizeMode="contain" />}
    </View>
  );
}

// A button drawn with the UI sheet's blank plate and a label on top.
function PlateBtn({ tone = 'btnCream', label, onPress, w = 150, h = 40, style, color = '#4a2a10', fs = 15 }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[{ width: w, height: h }, style]}>
      <Image source={SET_UI[tone].src} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }} />
      <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
        <Text numberOfLines={1} style={{ fontFamily: SERIF, fontSize: fs, color, fontWeight: 'bold' }}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NurseryScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const { coins, ownedPPots = [4], ownedHPots = ['macrame'], ownedCans = ['blue'] } = state.player;

  const [notice, notify] = useNotice();
  const [invOpen, setInvOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [basket, setBasket] = useState([]);                 // item ids in the cart
  const [potPage, setPotPage] = useState(0);
  const [hookPage, setHookPage] = useState(0);
  // LAYOUT mode: arrange the shop by hand. lay[id] = { x, y, s } overrides an item's spot and size.
  const [edit, setEdit] = useState(false);
  const [lay, setLay] = useState({});
  const [sel, setSel] = useState(null);
  const [dump, setDump] = useState('');
  const [receipt, setReceipt] = useState(null);   // the order summary shown after paying
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 450, useNativeDriver: false }),
      Animated.timing(bounce, { toValue: 0, duration: 450, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bounce]);
  const [cartOpen, setCartOpen] = useState(false);  // the cart (same card, with a Pay button)
  const [panel, setPanel] = useState(false);   // the POTS panel
  const sw = box.w;
  const k = sw / IMG_W;

  const INVENTORY_CAP = 35;
  const free = INVENTORY_CAP - (state.inventory?.length ?? 0);
  const total = basket.reduce((n, id) => n + describe(id).price, 0);

  // the painted pots stay where they are; you just cannot buy one you already own
  const owns = (id) => { const [kind, key] = id.split(':'); return kind === 'p' ? ownedPPots.includes(Number(key)) : kind === 'h' ? ownedHPots.includes(key) : kind === 'c' ? ownedCans.includes(key) : false; };

  const addToCart = (id) => {
    const d = describe(id);
    if (basket.includes(id)) { notify({ icon: d.src, title: d.name, subtitle: 'Already in your cart.' }); return; }
    if (owns(id)) { notify({ icon: d.src, title: d.name, subtitle: 'You already have this one.' }); return; }
    const seeds = basket.filter((b) => b.startsWith('s:')).length + (id.startsWith('s:') ? 1 : 0);
    if (seeds > free) { notify({ icon: UI_IMAGES.inventorybtn, title: 'Bag is full', subtitle: 'Plant some seeds to make room.' }); return; }
    if (basket.length >= MAX_BASKET) { notify({ title: 'Your cart is full', subtitle: 'Pay for these first.' }); return; }
    setBasket((b) => [...b, id]);
    notify({ icon: d.icon || d.src, title: `Added ${d.name}`, subtitle: `${d.price} coins. Tap the cart to pay.` });
  };

  const checkout = () => {
    if (basket.length === 0) { notify({ icon: UI_IMAGES.goldcoins, title: 'Your cart is empty', subtitle: 'Tap a bag or a pot to add it.' }); return; }
    if (coins < total) { notify({ icon: UI_IMAGES.goldcoins, title: 'Not enough coins', subtitle: `You need ${total - coins} more for these.` }); return; }
    basket.forEach((id) => {
      const [kind, key] = id.split(':');
      if (kind === 's') dispatch({ type: 'BUY_SEED', flowerKey: key, price: SEED_INFO[key].price });
      else if (kind === 'p') dispatch({ type: 'BUY_PPOT', pot: Number(key), price: PPOT_PRICE[key] });
      else if (kind === 'h') dispatch({ type: 'BUY_HPOT', pot: key, price: HPOT_INFO[key].price });
      else dispatch({ type: 'BUY_CAN', can: key, price: CAN_INFO[key].price });
    });
    const lines = [];
    basket.forEach((id) => {
      const d = describe(id), at = lines.find((l) => l.id === id);
      if (at) { at.qty += 1; } else lines.push({ id, src: d.icon || d.src, name: d.name, price: d.price, qty: 1 });
    });
    setReceipt({ lines, total, left: coins - total });
    setCartOpen(false);
    setBasket([]);
  };

  const boxItem = (id, box, extra = {}) => ({ id, box, at: [(box[0] + box[2]) / 2, box[3]], ...extra });
  const onShelf = [
    ...COUNTER_SEEDS.map((kk, n) => boxItem('s:' + kk, SEED_BOX(n))),
    ...POT_SLOTS.map((sl) => boxItem(sl.id, sl.box)),
    ...HANG_SLOTS.map((sl) => boxItem(sl.id, sl.box)),
  ].map((e) => (lay[e.id] ? { ...e, at: [lay[e.id].x, lay[e.id].y] } : e));
  const showCan = !(ownedCans.includes('red') || basket.includes('c:red'));
  // the POTS panel also sells everything (and the seeds that are not on the counter)
  const addToCounter = (id) => { addToCart(id); setPanel(false); };

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
          {onShelf.map(({ id, at, box: [bx0, by0, bx1, by1] }) => {
            const d = { ...describe(id), w: bx1 - bx0, h: by1 - by0 };
            return (
              <React.Fragment key={id}>
                <DragItem it={d} ghost at={at} k={k} z={6}
                  onDrop={(p) => (edit ? (setSel(id), setLay((l) => ({ ...l, [id]: { x: Math.round(p[0]), y: Math.round(p[1]), s: 1 } }))) : addToCart(id))}
                  onTap={() => (edit ? setSel(id) : addToCart(id))} />
                {edit && sel === id && <View pointerEvents="none" style={{ position: 'absolute', left: (at[0] - d.w / 2 - 3) * k, top: (at[1] - d.h) * k - 3, width: (d.w + 6) * k, height: (d.h + 6) * k, borderWidth: 2, borderColor: '#ffe29a', borderStyle: 'dashed', zIndex: 20 }} />}
              </React.Fragment>
            );
          })}

          {showCan && (
            <DragItem it={describe('c:red')} at={CAN_SPOT} k={k} z={6}
              onDrop={() => addToCart('c:red')} onTap={() => addToCart('c:red')} />
          )}

          {/* the register: its screen shows the total; tap it to check out */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => setCartOpen(true)}
            style={{ position: 'absolute', left: REGISTER.x0 * k, top: REGISTER.y0 * k, width: (REGISTER.x1 - REGISTER.x0) * k, height: (REGISTER.y1 - REGISTER.y0) * k, zIndex: 9 }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: (LCD.x - 60) * k, top: LCD.y * k - 12 * k, width: 120 * k, alignItems: 'center', zIndex: 10 }}>
            <Text style={{ fontFamily: SERIF, fontSize: 22 * k, color: '#9cff9c', fontWeight: 'bold' }}>{total}</Text>
          </View>
        </>
      )}

      <ScreenHud
        sw={sw} sh={box.h}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
        onBook={() => navigation.navigate('FlowerBook')}
      />

      {/* LAYOUT mode (for arranging the shop): drag items anywhere, + / - resize the selected one, COPY shows the numbers */}
      <PlateBtn label={edit ? 'Done' : 'Layout'} onPress={() => { setEdit(!edit); setSel(null); }} w={96} h={34} fs={13} style={{ position: 'absolute', left: 12, top: 76, zIndex: 60 }} />
      {edit && (
        <View style={styles.layoutBar}>
          <TouchableOpacity style={styles.layoutBtn2} onPress={() => sel && setLay((l) => ({ ...l, [sel]: { ...(l[sel] || { x: (onShelf.find((o) => o.id === sel) || { at: [0, 0] }).at[0], y: (onShelf.find((o) => o.id === sel) || { at: [0, 0] }).at[1] }), s: Math.max(0.3, (l[sel]?.s ?? 1) / 1.1) } }))}><Text style={styles.layoutTxt}>–</Text></TouchableOpacity>
          <TouchableOpacity style={styles.layoutBtn2} onPress={() => sel && setLay((l) => ({ ...l, [sel]: { ...(l[sel] || { x: (onShelf.find((o) => o.id === sel) || { at: [0, 0] }).at[0], y: (onShelf.find((o) => o.id === sel) || { at: [0, 0] }).at[1] }), s: Math.min(4, (l[sel]?.s ?? 1) * 1.1) } }))}><Text style={styles.layoutTxt}>+</Text></TouchableOpacity>
          <TouchableOpacity style={styles.layoutBtn2} onPress={() => { const t = JSON.stringify(onShelf.reduce((o, e) => ({ ...o, [e.id]: { x: Math.round(e.at[0]), y: Math.round(e.at[1]), s: Math.round((lay[e.id]?.s ?? 1) * 100) / 100 } }), {})); setDump(t); try { navigator.clipboard && navigator.clipboard.writeText(t); } catch (e) { /* the text is shown below anyway */ } }}><Text style={styles.layoutTxt}>COPY</Text></TouchableOpacity>
          <TouchableOpacity style={styles.layoutBtn2} onPress={() => { setLay({}); setSel(null); setDump(''); }}><Text style={styles.layoutTxt}>RESET</Text></TouchableOpacity>
        </View>
      )}
      {edit && dump !== '' && <View style={styles.dumpBox}><Text selectable style={styles.dumpTxt}>{dump}</Text></View>}

      <PlateBtn label="Pots & Cans" onPress={() => setPanel(true)} w={124} h={38} fs={14} style={{ position: 'absolute', left: 12, bottom: 94, zIndex: 60 }} />
      {panel && (
        <TouchableOpacity activeOpacity={1} style={styles.panelWrap} onPress={() => setPanel(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.panel}>
            <Text style={styles.panelTitle}>Pots & watering cans</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelGrid}>
              {[...PPOT_IDS.map((p) => 'p:' + p), ...HPOT_ORDER.map((h) => 'h:' + h), 'c:red', ...EXTRA_SEEDS.map((x) => 's:' + x)].map((id) => {
                const d = describe(id), [kind, key] = id.split(':');
                const have = kind === 's' ? false : kind === 'p' ? ownedPPots.includes(Number(key)) : kind === 'h' ? ownedHPots.includes(key) : ownedCans.includes(key);
                return (
                  <TouchableOpacity key={id} activeOpacity={0.8} disabled={have || basket.includes(id)} onPress={() => addToCounter(id)} style={[styles.tile, (have || basket.includes(id)) && { opacity: 0.4 }]}>
                    <Image source={d.src} resizeMode="contain" style={{ width: 52, height: 48 }} />
                    <Text style={styles.tileTxt}>{have ? 'owned' : d.price === 0 ? 'free' : d.price}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.panelHint}>Tap one to add it to your cart.</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {sw > 0 && basket.length > 0 && (
        <TouchableOpacity activeOpacity={0.85} onPress={() => setCartOpen(true)}
          style={{ position: 'absolute', left: 1255 * k, top: 665 * k, zIndex: 60, alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ translateX: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, 14 * k] }) }] }}>
            <Image source={SET_UI.right.src} resizeMode="contain" style={{ width: 70 * k, height: 70 * k * SET_UI.right.h / SET_UI.right.w }} />
          </Animated.View>
          <Text style={[styles.cartCount, { fontSize: 16 * k }]}>{basket.length} in cart</Text>
        </TouchableOpacity>
      )}

      {(cartOpen || receipt) && (() => {
        const paid = !!receipt;
        const lines = paid ? receipt.lines : basket.map((id) => { const d = describe(id); return { id, src: d.icon || d.src, name: d.name, price: d.price, qty: 1 }; });
        const sum = paid ? receipt.total : total;
        const close = () => { setCartOpen(false); setReceipt(null); };
        return (
          <TouchableOpacity activeOpacity={1} style={styles.panelWrap} onPress={close}>
            <TouchableOpacity activeOpacity={1} style={[styles.panel, { width: '46%' }]}>
              <Text style={styles.panelTitle}>{paid ? 'Thank you!' : 'Order summary'}</Text>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {lines.length === 0 && <Text style={styles.panelHint}>Your cart is empty. Tap a bag or a pot to add it.</Text>}
                {lines.map((l) => (
                  <View key={l.id} style={styles.recRow}>
                    <Image source={l.src} resizeMode="contain" style={{ width: 38, height: 38 }} />
                    <Text style={styles.recName} numberOfLines={1}>{l.name}{l.qty > 1 ? ` x${l.qty}` : ''}</Text>
                    <Text style={styles.recPrice}>{l.price * l.qty}</Text>
                    {!paid && (
                      <TouchableOpacity onPress={() => setBasket((b) => b.filter((x) => x !== l.id))} style={styles.recX}><Text style={styles.recXTxt}>x</Text></TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
              <View style={styles.recRule} />
              <View style={styles.recRow}><Text style={[styles.recName, { fontWeight: 'bold' }]}>Total</Text><Text style={[styles.recPrice, { fontWeight: 'bold' }]}>{sum}</Text></View>
              <View style={styles.recRow}><Text style={styles.recName}>{paid ? 'Coins left' : 'Your coins'}</Text><Text style={styles.recPrice}>{paid ? receipt.left : coins}</Text></View>
              {paid ? (
                <Text style={styles.panelHint}>Tap anywhere to close.</Text>
              ) : (
                <View style={styles.cartBtns}>
                  <PlateBtn label="Keep shopping" onPress={close} w={160} h={42} />
                  <PlateBtn tone={lines.length ? 'btnGreen' : 'btnCream'} label={`Pay ${sum}`} onPress={checkout} w={140} h={42} color={lines.length ? '#fff3d0' : '#8a7a60'} />
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })()}

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
  layoutBtn: { position: 'absolute', left: 14, top: 74, zIndex: 60, backgroundColor: '#8a5a2a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  layoutBar: { position: 'absolute', left: 14, top: 104, zIndex: 60, flexDirection: 'row', gap: 6 },
  layoutBtn2: { backgroundColor: '#3a6a8a', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  layoutTxt: { fontFamily: SERIF, fontSize: 14, color: '#fff3d0', fontWeight: 'bold' },
  dumpBox: { position: 'absolute', left: 14, right: 14, bottom: 8, zIndex: 70, backgroundColor: 'rgba(30,16,6,0.92)', borderRadius: 8, padding: 6, maxHeight: 90, overflow: 'hidden' },
  dumpTxt: { fontSize: 8, color: '#ffe9b8' },
  potsBtn: { position: 'absolute', left: 14, bottom: 64, zIndex: 60, backgroundColor: '#8a5a2a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  panelWrap: { ...StyleSheet.absoluteFillObject, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  panel: { width: '78%', maxHeight: '82%', backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18, padding: 12 },
  panelTitle: { fontFamily: SERIF, fontSize: 22, color: '#4a2a10', fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  panelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tile: { width: 66, alignItems: 'center', backgroundColor: '#e8cf9a', borderWidth: 2, borderColor: '#b98a4e', borderRadius: 10, paddingVertical: 4 },
  tileTxt: { fontFamily: SERIF, fontSize: 12, color: '#4a2a10', fontWeight: 'bold' },
  cartCount: { fontFamily: SERIF, color: '#fff3d0', fontWeight: 'bold', textShadowColor: '#4a2a10', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  cartBtn: { position: 'absolute', right: 14, bottom: 10, zIndex: 60, backgroundColor: '#8a5a2a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5 },
  cartBtns: { flexDirection: 'row', gap: 10, marginTop: 8, justifyContent: 'center' },
  cartAct: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  recX: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#b98a4e', alignItems: 'center', justifyContent: 'center' },
  recXTxt: { fontFamily: SERIF, fontSize: 16, color: '#fff', fontWeight: 'bold', lineHeight: 18 },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  recName: { flex: 1, fontFamily: SERIF, fontSize: 16, color: '#4a2a10' },
  recPrice: { fontFamily: SERIF, fontSize: 16, color: '#4a2a10', minWidth: 40, textAlign: 'right' },
  recRule: { height: 2, backgroundColor: '#b98a4e', marginVertical: 4 },
  panelHint: { fontFamily: SERIF, fontSize: 13, color: '#7a5030', textAlign: 'center', marginTop: 6 },
  hintChip: { backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  hintText: { fontFamily: SERIF, fontSize: 13, color: '#4a2a10' },
});
