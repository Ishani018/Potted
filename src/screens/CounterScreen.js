import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { COUNTER_BG, CUSTOMER_IMAGES, CUSTOMER_POSES, TRADE_IMAGES, SEED_IMAGES, UI_IMAGES, BOOK_STAMP, MAKE_IMAGES, ORDER_ART, BOW_IMAGES } from '../engine/assets';
import { CUSTOMERS, TRADE_FLOWERS, CUSTOMERS_PER_DAY, BOUQUET_PAPERS, RIBBON_NAMES } from '../constants/gameData';
import { openOrders, customerLine, flowerName } from '../engine/customers';
import ScreenHud from '../components/ScreenHud';
import InventoryOverlay from '../components/InventoryOverlay';
import { PixelButton } from '../components/Pixel';
import { SPRITE_ASPECT } from '../components/CustomerSprite';
import Portrait from '../components/Portrait';
import TileFrame from '../components/TileFrame';

// The florist counter, seen from behind the till (counter.png, 1678×937). Customers
// come in through the green door, hop across the shop floor and stop at the counter,
// where they ask for their order. Serve them (flowers right here, bouquets at the
// bouquet table), and they hop for joy, say thanks and head back out.
//
// All positions are in picture pixels. The customer is drawn clipped at the counter's
// top edge so their lower half is hidden behind the counter.
const W = 1678, H = 937;
const DOOR = { x: 940, feetY: 478, h: 340 };         // where they step in
const SPOT = { x: 740, feetY: 870, h: 720 };         // at the counter (feet are behind it)
const COUNTER_TOP = 646;                              // y of the counter's top edge
const HOPS = 5, HOP_MS = 300;                         // the walk in
const HAPPY_MS = 1500;                                // joy hops + thanks before they leave

const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

const BOW_COLOR = { ribbonRed: 'red', ribbonPink: 'pink', ribbonCream: 'cream', ribbonPinkFloral: 'pinkfloral', ribbonGreen: 'green', ribbonCreamFloral: 'creamfloral' };
const FLOWER_ART = { rose: ORDER_ART.rose };
const PAPER_ART = { plain: MAKE_IMAGES.paper, layered: MAKE_IMAGES.wrapLayered, fancy: MAKE_IMAGES.paperFancy };

// A place the card already has: a picture in the middle, its name along the bottom.
function OrderTile({ source, label, fx, bad }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flex: 1, width: '70%', marginTop: '9%', alignItems: 'center', justifyContent: 'center' }}>
        {source ? <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : null}
      </View>
      <Text style={[styles.tileTxt, { marginBottom: '9%' }, bad && { color: '#b04a2a' }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Place something on the card by its position in the card picture (900 x 593).
const slot = (x0, y0, x1, y1) => ({
  position: 'absolute', left: `${(x0 / 900) * 100}%`, top: `${(y0 / 593) * 100}%`,
  width: `${((x1 - x0) / 900) * 100}%`, height: `${((y1 - y0) / 593) * 100}%`,
});

export default function CounterScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [invOpen, setInvOpen] = useState(false);
  const sw = box.w, sh = box.h;
  const fx = (v) => (v / W) * sw;
  const fy = (v) => (v / H) * sh;

  const live = openOrders(state.player)[0] ?? null;
  const list = state.player.customers?.list ?? [];

  // The customer at the counter: { order, line }. phase: 'in' | 'ask' | 'happy' | 'out'.
  const [cur, setCur] = useState(null);
  const [phase, setPhase] = useState('in');
  const t = useRef(new Animated.Value(0)).current;       // 0 = at the door, 1 = at the counter
  const hop = useRef(new Animated.Value(0)).current;     // 0..-1 of a hop
  const gone = useRef(new Animated.Value(1)).current;    // opacity
  const running = useRef(null);

  const hopLoop = (n, ms) => {
    const steps = [];
    for (let i = 0; i < n; i++) {
      steps.push(Animated.timing(hop, { toValue: -1, duration: ms / 2, easing: Easing.out(Easing.quad), useNativeDriver: false }));
      steps.push(Animated.timing(hop, { toValue: 0, duration: ms / 2, easing: Easing.in(Easing.quad), useNativeDriver: false }));
    }
    return Animated.sequence(steps);
  };

  // A waiting order and nobody at the counter: the next customer comes in.
  useEffect(() => {
    if (cur || !live) return undefined;
    setCur({ order: live, line: null });
    setPhase('in');
    t.setValue(0); hop.setValue(0); gone.setValue(1);
    const anim = Animated.parallel([
      Animated.timing(t, { toValue: 1, duration: HOPS * HOP_MS, easing: Easing.linear, useNativeDriver: false }),
      hopLoop(HOPS, HOP_MS),
    ]);
    running.current = anim;
    anim.start(({ finished }) => { if (finished) setPhase('ask'); });
    return undefined;
  }, [live?.id, cur === null]);

  // The one at the counter has been served: joy hops, thanks, then out the door.
  const served = cur && list.find((o) => o.id === cur.order.id)?.done;
  useEffect(() => {
    if (!served || phase !== 'ask') return undefined;
    setPhase('happy');
    setTimeout(() => setPhase('out'), HAPPY_MS);
    setCur((c) => ({ ...c, line: CUSTOMERS[c.order.customer]?.thanks ?? '' }));
    const anim = Animated.sequence([
      hopLoop(2, 320),
      Animated.delay(HAPPY_MS - 640),
      Animated.parallel([
        Animated.timing(t, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: false }),
        Animated.timing(gone, { toValue: 0, duration: 900, useNativeDriver: false }),
        hopLoop(3, 300),
      ]),
    ]);
    running.current = anim;
    anim.start(({ finished }) => { if (finished) { setCur(null); setPhase('in'); } });
    return undefined;
  }, [served]);

  // (the effects above start animations that must outlive their own re-render, so
  // they are stopped only when the screen goes away)
  useEffect(() => () => running.current && running.current.stop(), []);

  const order = cur?.order;
  const c = order ? CUSTOMERS[order.customer] : null;
  const harvested = state.player.harvestedFlowers ?? {};
  const have = order ? (harvested[order.flowerKey] ?? 0) : 0;
  const canGive = order?.type === 'flowers' && have >= order.qty;
  const done = list.filter((o) => o.done).length;
  const art = order ? TRADE_IMAGES[TRADE_FLOWERS[order.flowerKey]?.img] : null;

  // The customer's rectangle, in picture pixels, as t goes 0 -> 1.
  const feetY = t.interpolate({ inputRange: [0, 1], outputRange: [DOOR.feetY, SPOT.feetY] });
  const height = t.interpolate({ inputRange: [0, 1], outputRange: [DOOR.h, SPOT.h] });
  const bump = (hpx) => hop.interpolate({ inputRange: [-1, 0], outputRange: [-hpx, 0] });

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={COUNTER_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && cur && (
        // everything below the counter's top edge is cut off, so they stand behind it
        <View style={{ position: 'absolute', left: 0, top: 0, width: sw, height: fy(COUNTER_TOP), overflow: 'hidden', zIndex: 5 }} pointerEvents="none">
          <Animated.View
            style={{
              position: 'absolute', opacity: gone,
              left: fx(DOOR.x),
              width: Animated.multiply(height, SPRITE_ASPECT * sh / H),
              height: Animated.multiply(height, sh / H),
              top: Animated.subtract(Animated.multiply(feetY, sh / H), Animated.multiply(height, sh / H)),
              transform: [
                { translateX: Animated.add(Animated.multiply(t, fx(SPOT.x - DOOR.x)), Animated.multiply(Animated.multiply(height, SPRITE_ASPECT * sh / H), -0.5)) },
                { translateY: bump(fy(26)) },
              ],
            }}
          >
            <Image source={(CUSTOMER_POSES[order.customer] || {})[phase === 'in' ? 'wave' : phase === 'ask' ? 'think' : 'hold'] || CUSTOMER_IMAGES[order.customer]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </Animated.View>
        </View>
      )}

      {sw > 0 && cur && phase !== 'in' && phase !== 'out' && (
        <View style={[styles.bubbleWrap, { left: fx(880), top: fy(50), width: fx(780) }]}>
          <View style={[styles.bubble, { width: fx(780), height: fx(780) * 593 / 900 }]}>
            <Image source={ORDER_ART.card} style={styles.slip} resizeMode="stretch" />
            {phase === 'happy' ? (
              <View style={[slot(365, 120, 735, 260), styles.doneRow]}>
                <Image source={BOOK_STAMP} style={styles.stamp} resizeMode="contain" />
                <Text style={[styles.say, { flex: 1 }]}>{cur.line}</Text>
              </View>
            ) : (
              <>
                <View style={[slot(192, 108, 340, 238), { alignItems: 'center', justifyContent: 'center' }]}>
                  <Portrait customerKey={order.customer} size={Math.round(fx(96))} bare />
                </View>
                <View style={slot(362, 114, 735, 262)}>
                  <Text style={styles.name}>{c.name}  <Text style={styles.count}>{Math.min(done + 1, CUSTOMERS_PER_DAY)}/{CUSTOMERS_PER_DAY}</Text></Text>
                  <Text style={styles.say} numberOfLines={3}>{customerLine(order, 'short')}</Text>
                </View>
                {order.type === 'flowers' ? (
                  <>
                    <View style={slot(147, 280, 347, 442)}><OrderTile fx={fx} source={FLOWER_ART[order.flowerKey] || art} label={`${Math.min(have, order.qty)} / ${order.qty} ${flowerName(order.flowerKey)}`} bad={!canGive} /></View>
                    <View style={slot(359, 280, 568, 442)}><OrderTile fx={fx} source={UI_IMAGES.goldcoins} label={`${order.coins} coins`} /></View>
                    <View style={slot(577, 280, 783, 442)}><OrderTile fx={fx} source={order.seed && SEED_IMAGES[order.seed] ? SEED_IMAGES[order.seed] : null} label={`+${order.xp} xp`} /></View>
                  </>
                ) : (
                  <>
                    <View style={slot(147, 280, 347, 442)}><OrderTile fx={fx} source={FLOWER_ART[order.flowerKey] || art} label={flowerName(order.flowerKey)} /></View>
                    <View style={slot(359, 280, 568, 442)}><OrderTile fx={fx} source={PAPER_ART[order.paper] || MAKE_IMAGES.paper} label={BOUQUET_PAPERS[order.paper]?.name} /></View>
                    <View style={slot(577, 280, 783, 442)}><OrderTile fx={fx} source={(BOW_IMAGES[BOW_COLOR[order.ribbon]] || [])[0] || MAKE_IMAGES[order.ribbon]} label={RIBBON_NAMES[order.ribbon]} /></View>
                  </>
                )}
                <View style={[slot(190, 450, 760, 488), styles.reward]}>
                  <Image source={ORDER_ART.bar_cream} style={styles.fillImg} resizeMode="stretch" />
                  <Text style={styles.pay}>{order.type === 'flowers' ? `${order.coins} coins` : `price + up to ${Math.round(order.tip * 1.5)} tip`}</Text>
                  <Text style={styles.xp}>+{order.xp} xp</Text>
                </View>
                <Pressable
                  disabled={order.type === 'flowers' && !canGive}
                  onPress={() => (order.type === 'flowers' ? dispatch({ type: 'FULFILL_CUSTOMER', id: order.id }) : navigation.navigate('Bouquet'))}
                  style={[slot(210, 494, 740, 536), styles.go, order.type === 'flowers' && !canGive && { opacity: 0.55 }]}
                >
                  <Image source={ORDER_ART.bar_green} style={styles.fillImg} resizeMode="stretch" />
                  <Text style={styles.goTxt}>{order.type === 'flowers' ? (canGive ? 'GIVE FLOWERS' : 'NOT ENOUGH YET') : 'TO THE BOUQUET TABLE'}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

      {sw > 0 && !cur && (
        <View style={[styles.quiet, { left: fx(560), width: fx(420), top: fy(250) }]} pointerEvents="none">
          <Text style={styles.quietTxt}>{done >= CUSTOMERS_PER_DAY ? 'All done for today. See you tomorrow!' : 'The shop is quiet right now.'}</Text>
        </View>
      )}

      <View style={styles.bottom}>
        <PixelButton label="BOUQUET TABLE >" tone="wood" size={8} onPress={() => navigation.navigate('Bouquet')} />
      </View>

      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
        onBook={() => navigation.navigate('FlowerBook')}
      />
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2a1608' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  bubbleWrap: { position: 'absolute', zIndex: 20 },
  bubble: { alignItems: 'stretch' },
  inner: { position: 'absolute', left: '14%', right: '15%', top: '17%', bottom: '13%', justifyContent: 'space-between' },
  fillImg: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  go: { justifyContent: 'center', alignItems: 'center' },
  goTxt: { fontFamily: 'PressStart2P', fontSize: 8, color: '#f7efd2' },
  slip: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  tail: { position: 'absolute', left: -14, top: 120, width: 0, height: 0, borderTopWidth: 12, borderBottomWidth: 12, borderRightWidth: 18, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#7a3e1a' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontFamily: HEAD, fontSize: 18, color: '#4a2a10' },
  count: { fontFamily: BODY, fontSize: 12.5, color: '#8a6a40' },
  say: { fontFamily: BODY, fontSize: 14, color: '#4a2a10', lineHeight: 15 },
  photo: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 4 },
  tileTxt: { fontFamily: HEAD, fontSize: 13, color: '#6a4a28' },
  reward: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  flower: { width: 30, height: 32 },
  want: { fontFamily: HEAD, fontSize: 17, color: '#3f7a2e' },
  ribbon: { width: 70, height: 6.5 },
  coin: { width: 18, height: 18 },
  pay: { fontFamily: HEAD, fontSize: 16, color: '#a8700a' },
  xp: { fontFamily: BODY, fontSize: 13, color: '#8a6a40', marginLeft: 4 },
  seed: { width: 22, height: 22, marginLeft: 6 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stamp: { width: 40, height: 39 },
  quiet: { position: 'absolute', alignItems: 'center', zIndex: 10 },
  quietTxt: { fontFamily: HEAD, fontSize: 20, color: '#fbf0cf', textShadowColor: '#2a1608', textShadowRadius: 4, textAlign: 'center' },
  bottom: { position: 'absolute', right: 16, bottom: 12, zIndex: 30 },
});
