import React, { useState } from 'react';
import { View, Text, Image, ScrollView, PanResponder, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { NURSERY_BG, SEED_IMAGES, UI_IMAGES, PPOT_META, PPOT_IDS, PPLANT_IMAGES, HPOT_META, HPOT_ORDER, CAN_IMAGES, SET_UI } from '../engine/assets';
import { POTTED_FLOWERS, HANGING_PLANTS, seedType, FLOWER_GROWTH, formatDuration, HPOT_INFO, PPOT_PRICE, CAN_INFO } from '../constants/gameData';
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
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const SEED_ORDER = ['daisy', 'snapdragon', 'poppy', 'marigold', 'peony', 'hydrenga', 'rose', 'stringofpearls', 'Philodendron', 'jasmine', 'petunia', 'Bougainvillea'];
const jit = (i, n) => (((i * 37 + n * 17) % 11) - 5);          // a steady little wobble, so things look put there by hand
// board tops measured from the picture; an item's feet rest 11 px below the top edge, on the board's lit surface
const SEED_BOARDS = [251, 351, 450, 549];
const POT_BOARDS = [299, 394, 490, 587];
const row = (n, x0, gap, y, salt) => Array.from({ length: n }, (_, i) => [x0 + i * gap + jit(i, salt) * 1.5, y + 11]);
// Every board is one long row of slots, left unit then right unit. Seed bags and pots are mixed together in a fixed
// shuffled order, with a few slots left empty on purpose (room for lanterns, gloves and other decor).
// The painted shop already has pots, hanging plants and a few bags on its shelves. Our seed bags (bigger) go on top of the
// painted bags and into the gaps, one spot per seed (picture pixels, feet on the board).
const SEED_AT = [
  [545, 268], [725, 268], [785, 268],
  [622, 385], [725, 385], [785, 385],
  [625, 497], [990, 447], [1125, 447],
  [1020, 548], [1010, 650], [1115, 650],
];
const SPOT_OF = {};
SEED_ORDER.forEach((k, n) => { SPOT_OF['s:' + k] = SEED_AT[n]; });
const HOOK_SPOTS = [955, 1028, 1100, 1175].map((x) => [x, 236]);   // where a hanging pot's top sits
const CAN_SPOT = [330, 735];
const BAG = { w: 50, h: 46 };
const POT_W = 44;                                           // shelf pot width on the shelf
const HOOK_H = 96;                                          // hanging pot height on its hook
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
      {it.seedling
        ? null
        : <Image source={it.src} pointerEvents="none" style={{ width: w, height: h }} resizeMode="contain" />}
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
  // LAYOUT mode: arrange the shop by hand. lay[id] = { x, y, s } overrides an item's spot and size.
  const [edit, setEdit] = useState(false);
  const [lay, setLay] = useState({});
  const [sel, setSel] = useState(null);
  const [dump, setDump] = useState('');
  const [panel, setPanel] = useState(false);   // the POTS panel
  const sw = box.w;
  const k = sw / IMG_W;

  const INVENTORY_CAP = 35;
  const free = INVENTORY_CAP - (state.inventory?.length ?? 0);
  const total = basket.reduce((n, id) => n + describe(id).price, 0);

  // pots you do not own yet, shown 12 (shelf) and 4 (hooks) at a time
  const shelfPots = PPOT_IDS.filter((id) => !ownedPPots.includes(id));
  const hookPots = HPOT_ORDER.filter((id) => !ownedHPots.includes(id));
  const potPages = 1, hookPages = Math.max(1, Math.ceil(hookPots.length / 4));
  const pPage = Math.min(potPage, potPages - 1), hPage = Math.min(hookPage, hookPages - 1);
  const seats = shelfPots.slice(0, 35);
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

  const place = (ids) => ids.map((id) => ({ id, at: lay[id] ? [lay[id].x, lay[id].y] : SPOT_OF[id] })).filter((e) => !basket.includes(e.id));
  const onShelf = place(SEED_ORDER.map((k) => 's:' + k));
  // pots and the red can are bought from the POTS panel (the painted shelves are just for show)
  const addToCounter = (id) => {
    if (basket.includes(id)) return;
    if (basket.length >= MAX_BASKET) { notify({ title: 'The counter is full', subtitle: 'Pay for these first.' }); return; }
    setBasket((b) => [...b, id]); setPanel(false);
  };

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
            const sc = lay[id]?.s ?? 1;
            return (
              <React.Fragment key={id}>
                <DragItem it={d} at={at} k={k} z={6} mul={sc}
                  onDrop={(p) => (edit ? (setSel(id), setLay((l) => ({ ...l, [id]: { x: Math.round(p[0]), y: Math.round(p[1]), s: l[id]?.s ?? 1 } }))) : dropOnCounter(id, p))}
                  onTap={() => (edit ? setSel(id) : tellAbout(id))} />
                {edit && sel === id && <View pointerEvents="none" style={{ position: 'absolute', left: (at[0] - d.w * sc / 2 - 3) * k, top: (d.hanging ? at[1] : at[1] - d.h * sc) * k - 3, width: (d.w * sc + 6) * k, height: (d.h * sc + 6) * k, borderWidth: 2, borderColor: '#ffe29a', borderStyle: 'dashed', zIndex: 20 }} />}
              </React.Fragment>
            );
          })}

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

      {/* LAYOUT mode (for arranging the shop): drag items anywhere, + / - resize the selected one, COPY shows the numbers */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => { setEdit(!edit); setSel(null); }} style={styles.layoutBtn}><Text style={styles.layoutTxt}>{edit ? 'DONE' : 'LAYOUT'}</Text></TouchableOpacity>
      {edit && (
        <View style={styles.layoutBar}>
          <TouchableOpacity style={styles.layoutBtn2} onPress={() => sel && setLay((l) => ({ ...l, [sel]: { ...(l[sel] || { x: (onShelf.find((o) => o.id === sel) || { at: [0, 0] }).at[0], y: (onShelf.find((o) => o.id === sel) || { at: [0, 0] }).at[1] }), s: Math.max(0.3, (l[sel]?.s ?? 1) / 1.1) } }))}><Text style={styles.layoutTxt}>–</Text></TouchableOpacity>
          <TouchableOpacity style={styles.layoutBtn2} onPress={() => sel && setLay((l) => ({ ...l, [sel]: { ...(l[sel] || { x: (onShelf.find((o) => o.id === sel) || { at: [0, 0] }).at[0], y: (onShelf.find((o) => o.id === sel) || { at: [0, 0] }).at[1] }), s: Math.min(4, (l[sel]?.s ?? 1) * 1.1) } }))}><Text style={styles.layoutTxt}>+</Text></TouchableOpacity>
          <TouchableOpacity style={styles.layoutBtn2} onPress={() => { const t = JSON.stringify(onShelf.reduce((o, e) => ({ ...o, [e.id]: { x: Math.round(e.at[0]), y: Math.round(e.at[1]), s: Math.round((lay[e.id]?.s ?? 1) * 100) / 100 } }), {})); setDump(t); try { navigator.clipboard && navigator.clipboard.writeText(t); } catch (e) { /* the text is shown below anyway */ } }}><Text style={styles.layoutTxt}>COPY</Text></TouchableOpacity>
          <TouchableOpacity style={styles.layoutBtn2} onPress={() => { setLay({}); setSel(null); setDump(''); }}><Text style={styles.layoutTxt}>RESET</Text></TouchableOpacity>
        </View>
      )}
      {edit && dump !== '' && <View style={styles.dumpBox}><Text selectable style={styles.dumpTxt}>{dump}</Text></View>}

      <TouchableOpacity activeOpacity={0.8} onPress={() => setPanel(true)} style={styles.potsBtn}><Text style={styles.layoutTxt}>POTS & CANS</Text></TouchableOpacity>
      {panel && (
        <TouchableOpacity activeOpacity={1} style={styles.panelWrap} onPress={() => setPanel(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.panel}>
            <Text style={styles.panelTitle}>Pots & watering cans</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelGrid}>
              {[...PPOT_IDS.map((p) => 'p:' + p), ...HPOT_ORDER.map((h) => 'h:' + h), 'c:red'].map((id) => {
                const d = describe(id), [kind, key] = id.split(':');
                const have = kind === 'p' ? ownedPPots.includes(Number(key)) : kind === 'h' ? ownedHPots.includes(key) : ownedCans.includes(key);
                return (
                  <TouchableOpacity key={id} activeOpacity={0.8} disabled={have || basket.includes(id)} onPress={() => addToCounter(id)} style={[styles.tile, (have || basket.includes(id)) && { opacity: 0.4 }]}>
                    <Image source={d.src} resizeMode="contain" style={{ width: 52, height: 48 }} />
                    <Text style={styles.tileTxt}>{have ? 'owned' : d.price === 0 ? 'free' : d.price}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.panelHint}>Tap one to put it on the counter, then pay at the register.</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

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
  panelHint: { fontFamily: SERIF, fontSize: 13, color: '#7a5030', textAlign: 'center', marginTop: 6 },
  hintChip: { backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  hintText: { fontFamily: SERIF, fontSize: 13, color: '#4a2a10' },
});
