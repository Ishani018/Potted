import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing, PanResponder, Platform, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { COUNTER_BG, CUSTOMER_IMAGES, CUSTOMER_POSES, TRADE_IMAGES, SEED_IMAGES, UI_IMAGES, BOOK_STAMP, MAKE_IMAGES, ORDER_ART, BOW_IMAGES, BOX_IMAGES } from '../engine/assets';
import { CUSTOMERS, TRADE_FLOWERS, CUSTOMERS_PER_DAY, BOUQUET_PAPERS, RIBBON_NAMES } from '../constants/gameData';
import { FlowerCluster, Celebration } from './BouquetScreen';
import { bouquetPic } from '../engine/bouquetPics';
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
function OrderTile({ source, label, fx, bad, cluster }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flex: 1, width: '70%', marginTop: '9%', alignItems: 'center', justifyContent: 'center' }}>
        {cluster ? <FlowerCluster keys={cluster} size={fx(76)} /> : source ? <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : null}
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

const DAYDONE_H = 460;   // height of the day-complete sign when it is 900 wide
const BOX_SPOT = { x: 870, y: 800, w: 330 };            // the empty place on the counter where the box / bouquet goes (picture px)

// A flower you can pick up from the tray and drop into the box. The drop point is worked out
// in picture pixels from where the tray slot sits, so no screen measuring is needed.
function TrayFlower({ flowerKey, count, x, y, size, fx, fy, onDrop }) {
  const drag = useRef(new Animated.ValueXY()).current;
  const [lifted, setLifted] = useState(false);
  const cfg = useRef({}); cfg.current = { x, y, onDrop, fx, fy };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setLifted(true),
    onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      setLifted(false);
      const px = cfg.current.x + g.dx / (cfg.current.fx(1)) , py = cfg.current.y + g.dy / (cfg.current.fy(1));
      cfg.current.onDrop(flowerKey, px, py, Math.hypot(g.dx, g.dy));
      Animated.spring(drag, { toValue: { x: 0, y: 0 }, friction: 7, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => { setLifted(false); Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(); },
  })).current;
  const d = fx(size);
  return (
    <Animated.View {...pan.panHandlers} style={{ position: 'absolute', left: fx(x) - d / 2, top: fy(y) - d / 2, width: d, height: d, zIndex: lifted ? 60 : 30, opacity: count > 0 ? 1 : 0.35, transform: drag.getTranslateTransform() }}>
      <Image source={TRADE_IMAGES[TRADE_FLOWERS[flowerKey].img]} style={{ width: d * (lifted ? 1.25 : 1), height: d * (lifted ? 1.25 : 1) }} resizeMode="contain" pointerEvents="none" />
      <View style={styles.trayCount} pointerEvents="none"><Text style={styles.trayCountTxt}>{count}</Text></View>
    </Animated.View>
  );
}

export default function CounterScreen({ navigation, route }) {
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
  const stub = useRef(new Animated.Value(0)).current;    // 0 = order stub up, 1 = taken down (going to the workstation)
  const [taking, setTaking] = useState(false);
  const [mode, setMode] = useState('card');                 // 'card' (reading the order) | 'pack' (putting flowers in the box)
  const [packed, setPacked] = useState([]);                  // flowers dropped in the box so far
  const [boxState, setBoxState] = useState('open');          // 'open' | 'closing' | 'closed'
  const [placing, setPlacing] = useState(null);              // a bouquet from the table being set on the counter
  const [perfect, setPerfect] = useState(0);
  const drop = useRef(new Animated.Value(0)).current;        // the bouquet settling onto the counter
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  const takeDown = (toBox) => {
    if (taking) return;
    setTaking(true);
    Animated.timing(stub, { toValue: 1, duration: 520, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => {
      navigation.navigate('Bouquet', toBox ? { pack: order.id } : undefined);
      later(() => { setTaking(false); stub.setValue(0); }, 400);
    });
  };
  // a bouquet made at the table arrives here: set it on the counter, then the customer reacts
  const deliver = route?.params?.deliver;
  useEffect(() => {
    if (!deliver) return;
    navigation.setParams({ deliver: undefined });
    setMode('pack'); setBoxState('closed'); setPlacing(deliver); drop.setValue(0);
    Animated.timing(drop, { toValue: 1, duration: 520, easing: Easing.out(Easing.bounce), useNativeDriver: false }).start();
    later(() => {
      dispatch({ type: 'SELL_BOUQUET', flowers: deliver.flowers, paper: deliver.paper, ribbon: deliver.ribbon, customerId: deliver.customerId, neat: deliver.neat });
      if (deliver.perfect) { setPerfect(deliver.payout); later(() => setPerfect(0), 1900); }
    }, 900);
  }, [deliver]);
  // a closed box packed at the workstation arrives: set it on the counter, then the customer reacts
  const deliverBox = route?.params?.deliverBox;
  useEffect(() => {
    if (!deliverBox) return;
    navigation.setParams({ deliverBox: undefined });
    setMode('pack'); setPlacing({ pic: BOX_IMAGES.iso }); drop.setValue(0);
    Animated.timing(drop, { toValue: 1, duration: 520, easing: Easing.out(Easing.bounce), useNativeDriver: false }).start();
    later(() => dispatch({ type: 'DELIVER_FLOWERS', id: deliverBox.orderId, given: deliverBox.given }), 900);
  }, [deliverBox]);
  const dropInBox = (flowerKey) => {
    if (!order || order.type !== 'flowers' || boxState !== 'open') return;
    if (packed.length >= order.qty) return;
    if ((harvested[flowerKey] ?? 0) - packed.filter((k) => k === flowerKey).length <= 0) return;
    const next = [...packed, flowerKey];
    setPacked(next);
    if (next.length >= order.qty) {
      setBoxState('closing');
      later(() => setBoxState('closed'), 380);
      later(() => dispatch({ type: 'DELIVER_FLOWERS', id: order.id, given: next }), 950);
    }
  };
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
    setPhase('in'); setMode('card'); setPacked([]); setBoxState('open'); setPlacing(null);
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
    setCur((c) => ({ ...c, line: list.find((o) => o.id === c.order.id)?.upset ? 'Hmph. That is not what I asked for.' : (CUSTOMERS[c.order.customer]?.thanks ?? '') }));
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
  const upset = !!(cur && list.find((o) => o.id === cur.order.id)?.upset);
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
              position: 'absolute', opacity: phase === 'ask' && mode === 'card' ? 0 : gone,
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
            <Image source={(CUSTOMER_POSES[order.customer] || {})[phase === 'in' ? 'wave' : phase === 'ask' ? 'think' : (upset ? 'angry' : 'hold')] || CUSTOMER_IMAGES[order.customer]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </Animated.View>
        </View>
      )}

      {sw > 0 && cur && phase === 'ask' && mode === 'card' && (
        <>
        {/* the shop goes hazy while you read the order */}
        <View style={styles.haze} />
        {/* the customer's head peeks in at the bottom left */}
        <View pointerEvents="none" style={{ position: 'absolute', left: fx(-20), bottom: 0, width: fx(640), height: fx(600), overflow: 'hidden', zIndex: 25 }}>
          <Image source={(CUSTOMER_POSES[order.customer] || {})[phase === 'happy' ? (upset ? 'angry' : 'hold') : 'think'] || CUSTOMER_IMAGES[order.customer]}
            style={{ position: 'absolute', left: 0, top: fx(20), width: fx(640), height: fx(960) }} resizeMode="contain" />
        </View>
        <Animated.View style={[styles.bubbleWrap, { left: (sw - fx(780)) / 2, top: (sh - fx(780) * 593 / 900) / 2 - fy(8), width: fx(780), opacity: stub.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }), transform: [{ translateY: stub.interpolate({ inputRange: [0, 1], outputRange: [0, sh * 0.55] }) }, { scale: stub.interpolate({ inputRange: [0, 1], outputRange: [1.28, 0.55] }) }, { rotate: stub.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) }] }]}>
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
                    <View style={slot(147, 280, 347, 442)}><OrderTile fx={fx} source={FLOWER_ART[order.flowerKey] || art} cluster={order.combo} label={order.combo ? 'Flowers' : flowerName(order.flowerKey)} /></View>
                    <View style={slot(359, 280, 568, 442)}><OrderTile fx={fx} source={PAPER_ART[order.paper] || MAKE_IMAGES.paper} label={BOUQUET_PAPERS[order.paper]?.name} /></View>
                    <View style={slot(577, 280, 783, 442)}><OrderTile fx={fx} source={(BOW_IMAGES[BOW_COLOR[order.ribbon]] || [])[0] || MAKE_IMAGES[order.ribbon]} label={RIBBON_NAMES[order.ribbon]} /></View>
                  </>
                )}
                <View style={[slot(190, 450, 760, 488), styles.reward]}>
                  <Image source={ORDER_ART.bar_cream} style={styles.fillImg} resizeMode="stretch" />
                  <Image source={UI_IMAGES.goldcoins} style={styles.coin} resizeMode="contain" />
                  <Text style={styles.pay}>{order.type === 'flowers' ? `${order.coins} coins` : `price + up to ${Math.round(order.tip * 1.5)} tip`}</Text>
                  <Text style={styles.xp}>+{order.xp} xp</Text>
                </View>
                <View style={[slot(210, 486, 740, 544), { alignItems: 'center', justifyContent: 'center' }]}>
                  <PixelButton
                    label={order.type === 'flowers' ? (canGive ? 'PACK THE FLOWERS' : 'NOT ENOUGH YET') : 'TO THE BOUQUET TABLE'}
                    size={7} scale={0.62} disabled={order.type === 'flowers' && !canGive}
                    onPress={() => takeDown(order.type === 'flowers')}
                  />
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </>
      )}

      {/* the counter: the open box to put flowers in, or the bouquet you just made, set on the empty place */}
      {sw > 0 && cur && mode === 'pack' && (phase === 'ask' || phase === 'happy') && (
        <>
          {placing ? (
            <Animated.Image source={placing.pic} resizeMode="contain" style={{
              position: 'absolute', left: fx(BOX_SPOT.x - BOX_SPOT.w * 0.45), width: fx(BOX_SPOT.w * 0.9), height: fx(BOX_SPOT.w * 0.9), zIndex: 28,
              top: drop.interpolate({ inputRange: [0, 1], outputRange: [fy(BOX_SPOT.y - 420), fy(BOX_SPOT.y - 250)] }),
              opacity: drop.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
            }} />
          ) : (
            <View pointerEvents="none" style={{ position: 'absolute', left: fx(BOX_SPOT.x - BOX_SPOT.w / 2), top: fy(BOX_SPOT.y - BOX_SPOT.w * 0.36), width: fx(BOX_SPOT.w), height: fx(BOX_SPOT.w) * 0.72, zIndex: 28 }}>
              <Image source={boxState === 'open' ? BOX_IMAGES.open : boxState === 'closing' ? BOX_IMAGES.closing : BOX_IMAGES.top} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="contain" />
              {boxState === 'open' && packed.map((k, i) => (
                <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} resizeMode="contain" style={{ position: 'absolute', left: `${22 + i * 22}%`, top: '32%', width: '30%', height: '40%' }} />
              ))}
            </View>
          )}
        </>
      )}

      {/* the customer's reaction once you have handed it over */}
      {sw > 0 && cur && phase === 'happy' && cur.line ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: (sw - fx(620)) / 2, top: fy(40), width: fx(620), height: fx(620) * 113 / 489, zIndex: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={ORDER_ART.banner} style={styles.slip} resizeMode="stretch" />
          <Text style={[styles.say, { color: upset ? '#8a2a1a' : '#4a2a10', fontSize: 16, textAlign: 'center', paddingHorizontal: fx(50) }]} numberOfLines={2}>{cur.line}</Text>
        </View>
      ) : null}
      {perfect > 0 && <Celebration fx={fx} fy={fy} coins={perfect} />}

      {sw > 0 && !cur && (
        done >= CUSTOMERS_PER_DAY ? (
          <>
          <View pointerEvents="none" style={styles.haze} />
          <Animated.Image pointerEvents="none" source={ORDER_ART.daydone} resizeMode="contain" style={{ position: 'absolute', left: (sw - fx(820)) / 2, top: 0, width: fx(820), height: fx(820) * (DAYDONE_H / 900), zIndex: 40 }} />
          </>
        ) : (
          <View pointerEvents="none" style={{ position: 'absolute', left: (sw - fx(760)) / 2, top: fy(230), width: fx(760), height: fx(760) * 113 / 489, zIndex: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={ORDER_ART.banner} style={styles.slip} resizeMode="stretch" />
            <Text style={styles.quietTxt} numberOfLines={2}>The shop is quiet right now.</Text>
          </View>
        )
      )}


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
  tray: { position: 'absolute', backgroundColor: 'rgba(250,236,200,0.9)', borderRadius: 18, borderWidth: 3, borderColor: '#b8793a', zIndex: 20, alignItems: 'center', paddingTop: 6 },
  trayHint: { fontFamily: HEAD, fontSize: 15, color: '#5a3410' },
  trayCount: { position: 'absolute', right: -4, bottom: -4, backgroundColor: '#5a3410', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  trayCountTxt: { fontFamily: HEAD, fontSize: 12, color: '#fff3d6' },
  haze: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 15, backgroundColor: 'rgba(48,30,14,0.5)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' } : {}) },
  bubble: { alignItems: 'stretch' },
  inner: { position: 'absolute', left: '14%', right: '15%', top: '17%', bottom: '13%', justifyContent: 'space-between' },
  fillImg: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  go: { justifyContent: 'center', alignItems: 'center', paddingTop: '2.5%' },
  goTxt: { fontFamily: HEAD, fontSize: 17, color: '#fbf3da', textShadowColor: 'rgba(40,24,6,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
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
  quietTxt: { fontFamily: HEAD, fontSize: 22, color: '#4a2a10', textAlign: 'center', paddingLeft: 60, paddingRight: 150, fontWeight: 'bold' },
  bottom: { position: 'absolute', right: 16, bottom: 12, zIndex: 30 },
});
