import React, { useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Easing, PanResponder, Platform, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { BOUQUET_BG, TRADE_IMAGES, UI_IMAGES, MAKE_IMAGES } from '../engine/assets';
import {
  TRADE_FLOWERS, BOUQUET_SIZE, BOUQUET_RECIPES, BOUQUET_PAPERS, bouquetPaper, evaluateBouquet, playerLevel, CUSTOMERS,
} from '../constants/gameData';
import { globalPetEffects } from '../engine/petEffects';
import BouquetArt from '../components/BouquetArt';
import ScreenHud from '../components/ScreenHud';
import Portrait from '../components/Portrait';
import { openOrders, bouquetFillsOrder, flowerName } from '../engine/customers';
import { PixelText, PixelButton } from '../components/Pixel';
import { useNotice } from '../components/PurchaseNotice';

// Bouquet table: you make the bouquet by hand, one step at a time (relaxed, no timer).
//   1 PAPER   tap a sheet; it slides onto the work table
//   2 FLOWERS drag three flowers from the buckets onto the paper (or tap them)
//   3 FOLD    swipe the left flap over, then the right flap
//   4 TIE     drag the ribbon across the middle, then it bows itself
//   5 GIVE    hand it to the waiting customer (or sell it at the market)
// A bouquet that is folded and tied neatly (steady swipes) sells for 10% more.
// All positions are in the 1376×768 base space of the table picture.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const PAPER_IMG = { plain: 'bouquetempty', layered: 'bouquetmixed', fancy: 'bouquetfancy' };
// Only kraft has art so far; the other sheets are the same picture with a colour wash.
const WASH = { plain: null, layered: 'rgba(255,244,214,0.38)', fancy: 'rgba(243,190,210,0.5)' };
const SHEET = { plain: '#dcb985', layered: '#ead2a6', fancy: '#f3d4de' };   // small chips on the choose-paper step
const RIBBON = { plain: 'ribbonRed', layered: 'ribbonRed', fancy: 'ribbonPink' };
const PAPER_ASPECT = 700 / 617;
const EDGE = '#7a4a22';
const STEPS = ['PAPER', 'FLOWERS', 'FOLD', 'TIE', 'GIVE'];
const CX = 790;                                   // centre of the work area
const PAPER_BOX = { w: 340, h: Math.round(340 / PAPER_ASPECT), top: 300 };   // the flat sheet
const FLAP_TOP = 300 + Math.round(0.4 * 300);                             // the flaps cover the lower part, blooms stay visible
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

export default function BouquetScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const found = state.player.bouquetBook ?? {};
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [step, setStep] = useState(0);              // 0 paper .. 4 give
  const [picks, setPicks] = useState([]);
  const [chosenPaper, setPaper] = useState('plain');
  const [folded, setFolded] = useState({ left: false, right: false });
  const [tied, setTied] = useState(false);
  const firstFold = useRef(null);               // which flap went over first (it ends up underneath)
  const [neat, setNeat] = useState(true);           // stays true while every swipe is steady
  const [notice, notify] = useNotice(3000);
  const coins = state.player.coins;
  const level = playerLevel(state.player);
  const usable = (p) => coins >= p.cost && level >= p.level;
  const paper = usable(bouquetPaper(chosenPaper)) ? chosenPaper : 'plain';

  const sw = box.w, sh = box.h;
  const fx = (v) => (v / PLOPPER_W) * sw;
  const fy = (v) => (v / PLOPPER_H) * sh;
  const fs = (n, min = 6) => Math.max(min, Math.round(fx(n)));

  const left = (key) => (harvested[key] ?? 0) - picks.filter((k) => k === key).length;
  const owned = Object.keys(harvested).filter((k) => harvested[k] > 0 && TRADE_FLOWERS[k]);
  const full = picks.length === BOUQUET_SIZE;
  const petMult = globalPetEffects(state.player).bouquetMult;
  const result = full ? evaluateBouquet(picks, petMult, paper) : null;
  const isNewRecipe = !!result?.recipe && !found[result.recipe.id];

  // The waiting customer (if they want a bouquet) is shown as a ticket; the bouquet is
  // delivered to them when it has the flower they asked for.
  const want = openOrders(state.player).find((o) => o.type === 'bouquet') ?? null;
  const order = full ? openOrders(state.player).find((o) => bouquetFillsOrder(o, picks)) : null;
  const customerName = order ? CUSTOMERS[order.customer].name : '';
  const neatBonus = result && neat ? Math.round(Math.max(0, result.net) * 0.1) : 0;
  const payout = result ? result.net + neatBonus + (order ? order.tip : 0) : 0;

  // ── step helpers ──
  const resetAll = () => { firstFold.current = null; setStep(0); setPicks([]); setFolded({ left: false, right: false }); setTied(false); setNeat(true); };
  const choosePaper = (id) => { setPaper(id); setStep(1); };
  const addFlower = (key) => { if (!full && left(key) > 0 && step === 1) setPicks((p) => [...p, key]); };
  const undo = () => setPicks((p) => p.slice(0, -1));
  const goFold = () => { if (full) setStep(2); };
  const onFolded = (side, wasNeat) => {
    if (!wasNeat) setNeat(false);
    if (!firstFold.current) firstFold.current = side;
    const next = { ...folded, [side]: true };
    setFolded(next);
    if (next.left && next.right) setTimeout(() => setStep(3), 350);
  };
  const onTied = (wasNeat) => { if (!wasNeat) setNeat(false); setTied(true); setTimeout(() => setStep(4), 500); };
  const giveOver = () => {
    if (!result) return;
    dispatch({ type: 'SELL_BOUQUET', flowers: picks, paper, customerId: order ? order.id : null, neat });
    const earned = order ? `${customerName} paid ${payout} coins.` : `You earned ${result.net + neatBonus} coins.`;
    notify({
      icon: UI_IMAGES[PAPER_IMG[paper]],
      title: isNewRecipe ? `New recipe: ${result.name}!` : `Made ${result.name}!`,
      subtitle: isNewRecipe ? `Saved to your garden journal. ${earned}` : earned,
    });
    const toCounter = !!order;
    resetAll();
    if (toCounter) setTimeout(() => navigation.navigate('Counter'), 900);
  };

  const foundCount = BOUQUET_RECIPES.filter((r) => found[r.id]).length;
  const art = fx(340);
  const rowN = Math.max(owned.length, 1);
  const gap = Math.min(fx(96), fx(700) / rowN);
  const bunchW = Math.min(fx(66), gap - fx(6));
  const rowW = gap * owned.length;
  const rowLeft = fx(700) - rowW / 2;
  const pw = fx(PAPER_BOX.w), ph = fy(PAPER_BOX.h), pLeft = fx(CX) - pw / 2, pTop = fy(PAPER_BOX.top);

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={BOUQUET_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && (
        <>
          {/* step strip */}
          <View style={[styles.steps, { top: fy(62), left: fx(CX) - fx(260), width: fx(520) }]} pointerEvents="none">
            {STEPS.map((s, i) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.dot, i < step && styles.dotDone, i === step && styles.dotNow]} />
                <Text style={[styles.stepTxt, i === step && styles.stepTxtNow]}>{s.charAt(0) + s.slice(1).toLowerCase()}</Text>
              </View>
            ))}
          </View>

          {/* the customer's ticket */}
          {want && (
            <View style={[styles.ticket, { left: fx(215), top: fy(108), width: fx(300) }]} pointerEvents="none">
              <Portrait customerKey={want.customer} size={fx(40)} bare />
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketName}>{CUSTOMERS[want.customer].name} wants</Text>
                <Text style={styles.ticketTxt}>a bouquet with {flowerName(want.flowerKey)}</Text>
              </View>
              <Image source={TRADE_IMAGES[TRADE_FLOWERS[want.flowerKey]?.img]} style={{ width: fx(34), height: fx(34) }} resizeMode="contain" />
            </View>
          )}

          {/* ── 1: choose a sheet (they lie on the left of the table) ── */}
          {step === 0 && (
            <>
              <Text style={[styles.hint, { left: fx(200), width: fx(420), top: fy(436) }]}>Choose a sheet of paper</Text>
              {Object.values(BOUQUET_PAPERS).map((p, i) => {
                const locked = level < p.level;
                const cantAfford = locked || coins < p.cost;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.85}
                    onPress={cantAfford ? undefined : () => choosePaper(p.id)}
                    style={[styles.sheet, { left: fx(220 + i * 140), top: fy(470), width: fx(116), height: fy(170), backgroundColor: SHEET[p.id], transform: [{ rotate: ['-4deg', '1deg', '5deg'][i] }] }, cantAfford && { opacity: 0.45 }]}
                  >
                    <Image source={UI_IMAGES[PAPER_IMG[p.id]]} style={{ width: fx(92), height: fy(106) }} resizeMode="contain" />
                    <Text style={styles.sheetName}>{p.name}</Text>
                    <Text style={styles.sheetCost}>{locked ? `Level ${p.level}` : p.cost > 0 ? `${p.cost} coins` : 'Free'}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ── the work table: flat sheet, flowers, flaps, ribbon ── */}
          {step >= 1 && step <= 3 && (
            <View style={{ position: 'absolute', left: pLeft, top: pTop, width: pw, height: ph }} pointerEvents="box-none">
              <View style={{ width: pw, height: ph }} pointerEvents="none">
                <Image source={MAKE_IMAGES.paper} style={{ width: pw, height: ph }} resizeMode="stretch" />
                {WASH[paper] && <View style={[StyleSheet.absoluteFill, { backgroundColor: WASH[paper], borderRadius: 8 }]} />}
              </View>
              {/* the flowers lie on the paper, blooms toward the top */}
              {picks.map((k, i) => {
                const pos = [{ x: 0.3, y: 0.2, r: '-14deg' }, { x: 0.7, y: 0.2, r: '14deg' }, { x: 0.5, y: 0.1, r: '0deg' }][i];
                const sz = fx(112);
                return (
                  <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} pointerEvents="none"
                    style={{ position: 'absolute', left: pw * pos.x - sz / 2, top: ph * pos.y - sz / 2, width: sz, height: sz, transform: [{ rotate: pos.r }], zIndex: 3 }} resizeMode="contain" />
                );
              })}
              {step >= 2 && (
                <>
                  <Flap side="left" w={pw / 2} h={fy(PAPER_BOX.top + PAPER_BOX.h - FLAP_TOP)} top={fy(FLAP_TOP - PAPER_BOX.top)} paperTop={fy(PAPER_BOX.top)} flapTop={fy(FLAP_TOP)} pw={pw} ph={ph} wash={WASH[paper]} z={firstFold.current === 'left' || !firstFold.current ? 6 : 7}
                    active={step === 2 && !folded.left} done={folded.left} reach={fx(210)} onDone={(n) => onFolded('left', n)} />
                  <Flap side="right" w={pw / 2} h={fy(PAPER_BOX.top + PAPER_BOX.h - FLAP_TOP)} top={fy(FLAP_TOP - PAPER_BOX.top)} paperTop={fy(PAPER_BOX.top)} flapTop={fy(FLAP_TOP)} pw={pw} ph={ph} wash={WASH[paper]} z={firstFold.current === 'right' ? 6 : 7}
                    active={step === 2 && !folded.right} done={folded.right} reach={fx(210)} onDone={(n) => onFolded('right', n)} />
                </>
              )}
              {step === 3 && <Ribbon x={-pw * 0.04} y={fy(FLAP_TOP - PAPER_BOX.top + 55)} w={pw * 1.08} source={MAKE_IMAGES[RIBBON[paper]]} fx={fx} fy={fy} done={tied} onDone={onTied} />}
            </View>
          )}

          {/* ── 5: the finished bouquet ── */}
          {step === 4 && (
            <View pointerEvents="none" style={{ position: 'absolute', left: fx(CX) - art / 2, top: fy(290), width: art }}>
              <BouquetArt flowers={[picks[0], picks[1], picks[2]]} size={art} tier={paper} />
            </View>
          )}

          {/* the prompt for this step */}
          <View style={[styles.prompt, { left: fx(CX) - fx(190), width: fx(380), top: fy(640) }]} pointerEvents="none">
            <Text style={styles.promptTxt}>
              {step === 0 ? 'Pick a sheet of paper to begin.'
                : step === 1 ? (full ? 'Lovely! Now fold it.' : `Drag ${BOUQUET_SIZE - picks.length} more flower${BOUQUET_SIZE - picks.length === 1 ? '' : 's'} onto the paper.`)
                : step === 2 ? 'Swipe each side over to wrap the stems.'
                : step === 3 ? 'Drag the ribbon across to tie it.'
                : result ? `${isNewRecipe ? 'Something special...' : result.name}` : ''}
            </Text>
          </View>

          {/* flowers in their buckets along the front edge (drag them up onto the paper) */}
          {step === 1 && owned.length === 0 && (
            <Text style={[styles.hint, { left: fx(250), width: fx(700), top: fy(696), color: '#fbf0cf' }]}>No harvested flowers yet. Grow some first!</Text>
          )}
          {step === 1 && owned.map((key, i) => (
            <Bunch
              key={key + i} flowerKey={key} count={left(key)} size={bunchW} disabled={full || left(key) <= 0}
              x={rowLeft + i * gap + (gap - bunchW) / 2} y={fy(704)} dropAbove={fy(660)}
              onAdd={() => addFlower(key)} fs={fs}
            />
          ))}

          {/* buttons */}
          <View style={{ position: 'absolute', left: fx(960), top: fy(500), width: fx(210), alignItems: 'center', gap: fy(10) }}>
            {step === 1 && (
              <>
                <PixelButton onPress={goFold} disabled={!full} size={fs(10, 7)} label="FOLD IT" style={{ alignSelf: 'stretch' }} />
                <PixelButton onPress={undo} disabled={picks.length === 0} tone="wood" size={fs(8, 6)} label="UNDO" style={{ alignSelf: 'stretch' }} />
              </>
            )}
            {step === 4 && result && (
              <>
                <View style={styles.price}>
                  <Image source={UI_IMAGES.goldcoins} style={{ width: fx(24), height: fx(24) }} resizeMode="contain" />
                  <Text style={styles.priceTxt}>{payout}</Text>
                </View>
                {neat && <Text style={styles.neat}>Neat work! +10%</Text>}
                {result.paperCost > 0 && <Text style={styles.small}>paper -{result.paperCost}</Text>}
                <PixelButton onPress={giveOver} size={fs(10, 7)} label={order ? `GIVE TO ${customerName.toUpperCase()}` : 'SELL IT'} style={{ alignSelf: 'stretch' }} />
              </>
            )}
            {step > 0 && step < 4 && (
              <PixelButton onPress={resetAll} tone="wood" size={fs(8, 6)} label="START OVER" style={{ alignSelf: 'stretch' }} />
            )}
          </View>
        </>
      )}

      {/* Recipes: the garden journal's bouquet pages */}
      <TouchableOpacity
        style={[styles.recipeBtn, { right: fx(40), top: fy(100), paddingHorizontal: fx(10), paddingVertical: fy(8) }]}
        onPress={() => navigation.navigate('FlowerBook', { tab: 'bouquets' })}
        activeOpacity={0.85}
      >
        <PixelText size={fs(8, 6)}>RECIPES {foundCount}/{BOUQUET_RECIPES.length}</PixelText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.recipeBtn, { right: fx(40), top: fy(150), paddingHorizontal: fx(10), paddingVertical: fy(8) }]}
        onPress={() => navigation.navigate('Counter')}
        activeOpacity={0.85}
      >
        <PixelText size={fs(8, 6)}>{'< COUNTER'}</PixelText>
      </TouchableOpacity>

      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
      />
      {notice}
    </View>
  );
}

// A bunch of flowers in a bucket: tap to add, or drag it up onto the paper.
function Bunch({ flowerKey, count, size, disabled, x, y, dropAbove, onAdd, fs }) {
  const drag = useRef(new Animated.ValueXY()).current;
  const [lifted, setLifted] = useState(false);
  const cfg = useRef({});
  cfg.current = { disabled, dropAbove, onAdd, y };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !cfg.current.disabled,
    onMoveShouldSetPanResponder: () => !cfg.current.disabled,
    onPanResponderGrant: () => setLifted(true),
    onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      setLifted(false);
      const moved = Math.hypot(g.dx, g.dy);
      const droppedHigh = cfg.current.y + g.dy < cfg.current.dropAbove;
      if (moved < 8 || droppedHigh) cfg.current.onAdd();
      Animated.spring(drag, { toValue: { x: 0, y: 0 }, friction: 7, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => { setLifted(false); Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(); },
  })).current;
  return (
    <Animated.View
      {...pan.panHandlers}
      style={[styles.bunch, { left: x, top: y, width: size, height: size * 0.8, zIndex: lifted ? 50 : 5, opacity: disabled ? 0.4 : 1, transform: drag.getTranslateTransform() }]}
    >
      <Image source={TRADE_IMAGES[TRADE_FLOWERS[flowerKey].img]} style={{ width: size * (lifted ? 1.15 : 0.7), height: size * (lifted ? 1.15 : 0.7) }} resizeMode="contain" pointerEvents="none" />
      <View style={styles.badge}><PixelText size={fs(8, 6)}>{count}</PixelText></View>
    </Animated.View>
  );
}

// One side of the wrapping paper. Swipe it across the middle; it follows your finger,
// lands flat over the stems if you pass halfway, otherwise springs back. A steady
// (mostly horizontal) swipe counts as neat.
function Flap({ side, w, h, top, paperTop, flapTop, pw, ph, wash, z, active, done, reach, onDone }) {
  const p = useRef(new Animated.Value(done ? 1 : 0)).current;   // 0 open .. 1 folded over
  const cfg = useRef({});
  cfg.current = { active, reach, onDone };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => cfg.current.active,
    onMoveShouldSetPanResponder: () => cfg.current.active,
    onPanResponderMove: (_, g) => p.setValue(clamp((side === 'left' ? g.dx : -g.dx) / cfg.current.reach, 0, 1)),
    onPanResponderRelease: (_, g) => {
      const prog = clamp((side === 'left' ? g.dx : -g.dx) / cfg.current.reach, 0, 1);
      if (prog > 0.5) {
        const steady = Math.abs(g.dy) < Math.abs(g.dx) * 0.45 + 12;
        Animated.timing(p, { toValue: 1, duration: 140, useNativeDriver: false }).start(() => cfg.current.onDone(steady));
      } else Animated.spring(p, { toValue: 0, friction: 7, useNativeDriver: false }).start();
    },
  })).current;
  // the flap pivots on the paper's centre line and flips over: scaleX 1 -> -1
  const pivot = side === 'left' ? w / 2 : -w / 2;
  const scaleX = p.interpolate({ inputRange: [0, 1], outputRange: [1, -1] });
  const under = p.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [0, 0, 0.18, 0.18] });
  return (
    <Animated.View
      {...pan.panHandlers}
      style={{
        position: 'absolute', top, left: side === 'left' ? 0 : w, width: w, height: h, zIndex: done ? z : 5,
        pointerEvents: done ? 'none' : 'auto',
        transform: [{ translateX: pivot }, { scaleX }, { translateX: -pivot }],
      }}
    >
      {/* this flap is a cut of the same sheet, so it keeps the paper's own texture and edge */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <Image source={MAKE_IMAGES.paper} resizeMode="stretch" style={{ position: 'absolute', width: pw, height: ph, left: side === 'left' ? 0 : -w, top: -(flapTop - paperTop) }} />
        {wash && <View style={[StyleSheet.absoluteFill, { backgroundColor: wash }]} />}
      </View>
      <View style={[styles.flapEdge, side === 'left' ? { left: 0 } : { right: 0 }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#3a2008', opacity: under }]} />
      {active && <Text style={[styles.swipe, side === 'left' ? { right: 6 } : { left: 6 }]}>{side === 'left' ? '>>' : '<<'}</Text>}
    </Animated.View>
  );
}

// The ribbon: drag across the waist; it unrolls behind your finger and bows.
function Ribbon({ x, y, w, source, fx, fy, done, onDone }) {
  const prog = useRef(new Animated.Value(done ? 1 : 0)).current;
  const wob = useRef({ max: 0 });
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !done,
    onMoveShouldSetPanResponder: () => !done,
    onPanResponderGrant: () => { wob.current.max = 0; },
    onPanResponderMove: (_, g) => { wob.current.max = Math.max(wob.current.max, Math.abs(g.dy)); prog.setValue(clamp(g.dx / (w * 0.9), 0, 1)); },
    onPanResponderRelease: (_, g) => {
      if (g.dx / (w * 0.9) > 0.85) { Animated.timing(prog, { toValue: 1, duration: 120, useNativeDriver: false }).start(() => onDone(wob.current.max < fy(26))); }
      else Animated.spring(prog, { toValue: 0, friction: 7, useNativeDriver: false }).start();
    },
  })).current;
  const barW = prog.interpolate({ inputRange: [0, 1], outputRange: [0, w] });
  const rh = w * (165 / 900);                            // the ribbon picture is 900×165
  return (
    <View style={{ position: 'absolute', left: x, top: y - rh / 2, width: w, height: rh, zIndex: 8 }} {...pan.panHandlers}>
      {/* the ribbon is revealed left to right behind your finger */}
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, height: rh, width: barW, overflow: 'hidden' }} pointerEvents="none">
        <Image source={source} style={{ width: w, height: rh }} resizeMode="stretch" />
      </Animated.View>
      {!done && (
        <Animated.Text pointerEvents="none" style={[styles.swipe, { left: 8, top: rh * 0.25, fontSize: 18, opacity: prog.interpolate({ inputRange: [0, 0.08], outputRange: [1, 0], extrapolate: 'clamp' }) }]}>
          drag the ribbon {'>>'}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // dragging over text must not start a text selection on web (it cancels the drag)
  root: { flex: 1, backgroundColor: '#2a1608', ...(Platform.OS === 'web' ? { userSelect: 'none' } : null) },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  steps: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  stepItem: { alignItems: 'center', gap: 2, flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(251,240,207,0.35)', borderWidth: 2, borderColor: '#5a3410' },
  dotDone: { backgroundColor: '#5a8a2a' },
  dotNow: { backgroundColor: '#fbf0cf', borderColor: '#c9780a' },
  stepTxt: { fontFamily: HEAD, fontSize: 14, color: '#d9c39a', textShadowColor: '#2a1608', textShadowRadius: 3 },
  stepTxtNow: { color: '#fff3d6' },
  ticket: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fbf0cf', borderRadius: 12, borderWidth: 3, borderColor: '#7a3e1a', paddingHorizontal: 10, paddingVertical: 6, zIndex: 10 },
  ticketName: { fontFamily: HEAD, fontSize: 16, color: '#4a2a10' },
  ticketTxt: { fontFamily: BODY, fontSize: 14, color: '#5a3a1a' },
  hint: { position: 'absolute', textAlign: 'center', fontFamily: HEAD, fontSize: 18, color: '#3a2008', textShadowColor: 'rgba(255,240,200,0.7)', textShadowRadius: 0, textShadowOffset: { width: 1, height: 1 } },
  sheet: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 3, borderWidth: 3, borderColor: 'rgba(90,52,16,0.55)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 2, height: 3 },
  },
  sheetName: { fontFamily: HEAD, fontSize: 15, color: '#4a2a10' },
  sheetCost: { fontFamily: BODY, fontSize: 13, color: '#8a5a24' },
  // a thin fold line along the cut edge of a flap
  flapEdge: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(90,52,16,0.45)' },
  swipe: { position: 'absolute', top: '45%', fontFamily: HEAD, fontSize: 22, color: '#5a3410' },
  prompt: { position: 'absolute', alignItems: 'center', zIndex: 10 },
  promptTxt: { fontFamily: HEAD, fontSize: 19, color: '#fff3d6', textAlign: 'center', textShadowColor: '#2a1608', textShadowRadius: 4 },
  bunch: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: 'rgba(255,243,214,0.88)' },
  badge: { position: 'absolute', right: -4, bottom: -4, backgroundColor: '#5a3410', borderWidth: 2, borderColor: '#2a1608', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(58,32,12,0.88)', borderWidth: 3, borderColor: '#2a1608', borderRadius: 4 },
  priceTxt: { fontFamily: HEAD, fontSize: 24, color: '#ffd060' },
  neat: { fontFamily: HEAD, fontSize: 16, color: '#cfe8a0', textShadowColor: '#2a1608', textShadowRadius: 3 },
  small: { fontFamily: BODY, fontSize: 13, color: '#fff3d6', textShadowColor: '#2a1608', textShadowRadius: 3 },
  recipeBtn: { position: 'absolute', zIndex: 30, backgroundColor: '#5a3410', borderWidth: 3, borderColor: '#2a1608', borderRadius: 4 },
});
