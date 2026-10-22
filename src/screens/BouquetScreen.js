import React, { useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Platform, StyleSheet } from 'react-native';
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

// Bouquet workspace: a top-down table (workspace_zoom.png, 1536×1024) where you make the
// bouquet by hand, one step at a time (relaxed, no timer):
//   0 PAPER    tap a sheet; it lies down on the work mat
//   1 FLOWERS  drag three flowers out of their bins onto the paper (or tap them)
//   2 FOLD     swipe the left flap over, then the right flap
//   3 TIE      drag the ribbon across the middle
//   4 GIVE     drag the bouquet onto the hand-over tray (or tap the button)
// Steady swipes keep the "neat" bonus: +10% on the sale.
// Positions are in the 1376×768 base space. The picture is 3:2, the game frame 16:9, so it
// is stretched a little (like the other screens); a 16:9 picture would remove that.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const PAPER_IMG = { plain: 'bouquetempty', layered: 'bouquetmixed', fancy: 'bouquetfancy' };
// Kraft and the flowered parchment have art; "layered" is kraft with a lighter wash.
const WASH = { plain: null, layered: 'rgba(255,244,214,0.38)', fancy: null };
const SHEET_ART = (id) => (id === 'fancy' ? MAKE_IMAGES.paperFancy : MAKE_IMAGES.paper);
const RIBBON = { plain: 'ribbonRed', layered: 'ribbonRed', fancy: 'ribbonPink' };
const PAPER_ASPECT = 700 / 617;
const RIBBON_ASPECT = 10;                            // the ribbon pictures are 1000×100
const MAT = { x0: 419, y0: 232, x1: 1066, y1: 705 };  // the wooden work mat
const CX = (MAT.x0 + MAT.x1) / 2;                    // 742
const CY = (MAT.y0 + MAT.y1) / 2 + 6;
const PAPER_BOX = { w: 430, h: Math.round(430 / PAPER_ASPECT) };   // the sheet once it is on the mat
PAPER_BOX.top = Math.round(CY - PAPER_BOX.h / 2);
const FLAP_TOP = PAPER_BOX.top + Math.round(0.42 * PAPER_BOX.h);   // the flaps cover the stems; blooms stay clear
const TRAY = { cx: 1234, cy: 628, w: 250, h: 150 };  // the hand-over tray, bottom right
// The eight bins down the left (basket, bucket, basket, bucket ...), centres in base space
const BINS = [
  { x: 112, y: 128 }, { x: 318, y: 132 }, { x: 112, y: 295 }, { x: 306, y: 295 },
  { x: 104, y: 458 }, { x: 306, y: 458 }, { x: 102, y: 618 }, { x: 296, y: 622 },
];
const BIN_D = 150;
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
  const [binPage, setBinPage] = useState(0);
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
  const pages = Math.max(1, Math.ceil(owned.length / BINS.length));
  const page = Math.min(binPage, pages - 1);
  const shown = owned.slice(page * BINS.length, (page + 1) * BINS.length);
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
  const onTied = (wasNeat) => { if (!wasNeat) setNeat(false); setTied(true); setTimeout(() => setStep(4), 600); };
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
  const pw = fx(PAPER_BOX.w), ph = fy(PAPER_BOX.h), pLeft = fx(CX) - pw / 2, pTop = fy(PAPER_BOX.top);
  const prompt = step === 0 ? 'Pick a sheet of paper to begin.'
    : step === 1 ? (full ? 'Lovely! Now fold it.' : `Drag ${BOUQUET_SIZE - picks.length} more flower${BOUQUET_SIZE - picks.length === 1 ? '' : 's'} onto the paper.`)
    : step === 2 ? 'Swipe each side over to wrap the stems.'
    : step === 3 ? 'Drag the ribbon across to tie it.'
    : (result ? `${isNewRecipe ? 'Something special...' : result.name}. Drag it onto the tray!` : '');

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={BOUQUET_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && (
        <>
          {/* ── 0: three sheets lie on the mat to choose from ── */}
          {step === 0 && Object.values(BOUQUET_PAPERS).map((p, i) => {
            const locked = level < p.level;
            const cantAfford = locked || coins < p.cost;
            const sw0 = fx(150), sh0 = sw0 / PAPER_ASPECT;
            return (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                onPress={cantAfford ? undefined : () => choosePaper(p.id)}
                style={[styles.sheetBtn, { left: fx(CX + (i - 1) * 190) - sw0 / 2, top: fy(CY - 70), width: sw0, transform: [{ rotate: ['-3deg', '1deg', '4deg'][i] }] }, cantAfford && { opacity: 0.45 }]}
              >
                <View style={{ width: sw0, height: sh0 }}>
                  <Image source={SHEET_ART(p.id)} style={{ width: sw0, height: sh0 }} resizeMode="stretch" />
                  {WASH[p.id] && <View style={[StyleSheet.absoluteFill, { backgroundColor: WASH[p.id] }]} />}
                </View>
                <Text style={styles.sheetName}>{p.name}</Text>
                <Text style={styles.sheetCost}>{locked ? `Level ${p.level}` : p.cost > 0 ? `${p.cost} coins` : 'Free'}</Text>
              </TouchableOpacity>
            );
          })}

          {/* ── the sheet on the mat: flowers, flaps, ribbon ── */}
          {step >= 1 && step <= 3 && (
            <View style={{ position: 'absolute', left: pLeft, top: pTop, width: pw, height: ph }} pointerEvents="box-none">
              <View style={{ width: pw, height: ph }} pointerEvents="none">
                <Image source={SHEET_ART(paper)} style={{ width: pw, height: ph }} resizeMode="stretch" />
                {WASH[paper] && <View style={[StyleSheet.absoluteFill, { backgroundColor: WASH[paper], borderRadius: 8 }]} />}
              </View>
              {picks.map((k, i) => {
                const pos = [{ x: 0.3, y: 0.2, r: '-14deg' }, { x: 0.7, y: 0.2, r: '14deg' }, { x: 0.5, y: 0.1, r: '0deg' }][i];
                const sz = fx(140);
                return (
                  <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} pointerEvents="none"
                    style={{ position: 'absolute', left: pw * pos.x - sz / 2, top: ph * pos.y - sz / 2, width: sz, height: sz, transform: [{ rotate: pos.r }], zIndex: 3 }} resizeMode="contain" />
                );
              })}
              {step >= 2 && (
                <>
                  <Flap side="left" w={pw / 2} h={fy(PAPER_BOX.top + PAPER_BOX.h - FLAP_TOP)} top={fy(FLAP_TOP - PAPER_BOX.top)}
                    sheet={SHEET_ART(paper)} paperTop={fy(PAPER_BOX.top)} flapTop={fy(FLAP_TOP)} pw={pw} ph={ph} wash={WASH[paper]}
                    z={firstFold.current === 'left' || !firstFold.current ? 6 : 7}
                    active={step === 2 && !folded.left} done={folded.left} reach={fx(250)} onDone={(n) => onFolded('left', n)} />
                  <Flap side="right" w={pw / 2} h={fy(PAPER_BOX.top + PAPER_BOX.h - FLAP_TOP)} top={fy(FLAP_TOP - PAPER_BOX.top)}
                    sheet={SHEET_ART(paper)} paperTop={fy(PAPER_BOX.top)} flapTop={fy(FLAP_TOP)} pw={pw} ph={ph} wash={WASH[paper]}
                    z={firstFold.current === 'right' ? 6 : 7}
                    active={step === 2 && !folded.right} done={folded.right} reach={fx(250)} onDone={(n) => onFolded('right', n)} />
                </>
              )}
              {step === 3 && <Ribbon x={-pw * 0.04} y={fy(FLAP_TOP - PAPER_BOX.top + 70)} w={pw * 1.08} source={MAKE_IMAGES[RIBBON[paper]]} fy={fy} done={tied} onDone={onTied} />}
            </View>
          )}

          {/* ── 4: the finished bouquet: drag it onto the tray ── */}
          {step === 4 && (
            <FinishedBouquet
              picks={picks} paper={paper} size={fx(300)} home={{ x: fx(CX), y: fy(CY) }}
              tray={{ x: fx(TRAY.cx), y: fy(TRAY.cy), w: fx(TRAY.w), h: fy(TRAY.h) }} onDrop={giveOver}
            />
          )}

          {/* the flowers sit in their bins; drag one out onto the paper */}
          {step === 1 && owned.length === 0 && (
            <Text style={[styles.hint, { left: fx(CX) - fx(260), width: fx(520), top: fy(CY) }]}>No harvested flowers yet. Grow some first!</Text>
          )}
          {step === 1 && shown.map((key, i) => (
            <Bunch
              key={key + i} flowerKey={key} count={left(key)} size={fx(BIN_D) * 0.72} disabled={full || left(key) <= 0}
              x={fx(BINS[i].x) - fx(BIN_D) * 0.36} y={fy(BINS[i].y) - fx(BIN_D) * 0.36}
              dropRight={fx(MAT.x0)} onAdd={() => addFlower(key)} fs={fs}
            />
          ))}
          {step === 1 && pages > 1 && (
            <View style={{ position: 'absolute', left: fx(290), top: fy(716), zIndex: 30 }}>
              <PixelButton label={`MORE ${page + 1}/${pages}`} tone="wood" size={fs(7, 6)} onPress={() => setBinPage((page + 1) % pages)} />
            </View>
          )}

          {/* the order slip and the prompt along the bottom of the table */}
          {want && (
            <View style={[styles.ticket, { left: fx(430), top: fy(712), width: fx(330) }]} pointerEvents="none">
              <Portrait customerKey={want.customer} size={fx(34)} bare />
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketTxt} numberOfLines={1}><Text style={styles.ticketName}>{CUSTOMERS[want.customer].name.split(' ').pop()}</Text> wants a {flowerName(want.flowerKey)} bouquet</Text>
              </View>
              <Image source={TRADE_IMAGES[TRADE_FLOWERS[want.flowerKey]?.img]} style={{ width: fx(28), height: fx(28) }} resizeMode="contain" />
            </View>
          )}
          <View style={[styles.prompt, { left: fx(want ? 775 : 520), width: fx(want ? 410 : 560), top: fy(716) }]} pointerEvents="none">
            <Text style={styles.promptTxt} numberOfLines={1}>{prompt}</Text>
          </View>

          {/* buttons, right column (beside the scissors) */}
          <View style={{ position: 'absolute', left: fx(1195), top: fy(372), width: fx(170), alignItems: 'center', gap: fy(8), zIndex: 30 }}>
            {step === 1 && (
              <>
                <PixelButton onPress={goFold} disabled={!full} size={fs(9, 7)} label="FOLD IT" style={{ alignSelf: 'stretch' }} />
                <PixelButton onPress={undo} disabled={picks.length === 0} tone="wood" size={fs(7, 6)} label="UNDO" style={{ alignSelf: 'stretch' }} />
              </>
            )}
            {step === 4 && result && (
              <>
                <View style={styles.price}>
                  <Image source={UI_IMAGES.goldcoins} style={{ width: fx(22), height: fx(22) }} resizeMode="contain" />
                  <Text style={styles.priceTxt}>{payout}</Text>
                </View>
                {neat && <Text style={styles.neat}>Neat work! +10%</Text>}
                {result.paperCost > 0 && <Text style={styles.small}>paper -{result.paperCost}</Text>}
                <PixelButton onPress={giveOver} size={fs(8, 6)} label={order ? 'GIVE IT' : 'SELL IT'} style={{ alignSelf: 'stretch' }} />
              </>
            )}
            {step > 0 && step < 4 && (
              <PixelButton onPress={resetAll} tone="wood" size={fs(7, 6)} label="START OVER" style={{ alignSelf: 'stretch' }} />
            )}
          </View>
        </>
      )}

      {/* Recipes: the garden journal's bouquet pages */}
      <TouchableOpacity
        style={[styles.recipeBtn, { left: fx(150), top: fy(718), paddingHorizontal: fx(10), paddingVertical: fy(6) }]}
        onPress={() => navigation.navigate('FlowerBook', { tab: 'bouquets' })}
        activeOpacity={0.85}
      >
        <PixelText size={fs(7, 6)}>RECIPES {foundCount}/{BOUQUET_RECIPES.length}</PixelText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.recipeBtn, { left: fx(14), top: fy(718), paddingHorizontal: fx(10), paddingVertical: fy(6) }]}
        onPress={() => navigation.navigate('Counter')}
        activeOpacity={0.85}
      >
        <PixelText size={fs(7, 6)}>{'< COUNTER'}</PixelText>
      </TouchableOpacity>

      {/* no settings button or level badge here: they would sit on top of the flower bins */}
      <ScreenHud sw={sw} sh={sh} onMap={() => navigation.navigate('Map')} />
      {notice}
    </View>
  );
}

// The finished bouquet on the mat. Drag it onto the tray (bottom right) to hand it over.
function FinishedBouquet({ picks, paper, size, home, tray, onDrop }) {
  const drag = useRef(new Animated.ValueXY()).current;
  const cfg = useRef({});
  cfg.current = { home, tray, onDrop };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      const { home: h, tray: t } = cfg.current;
      const x = h.x + g.dx, y = h.y + g.dy;
      const onTray = Math.abs(x - t.x) < t.w / 2 && Math.abs(y - t.y) < t.h / 2;
      if (onTray) cfg.current.onDrop();
      else Animated.spring(drag, { toValue: { x: 0, y: 0 }, friction: 7, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
  })).current;
  return (
    <Animated.View
      {...pan.panHandlers}
      style={{ position: 'absolute', left: home.x - size / 2, top: home.y - size / 2, width: size, height: size, zIndex: 20, transform: drag.getTranslateTransform() }}
    >
      <BouquetArt flowers={[picks[0], picks[1], picks[2]]} size={size} tier={paper} />
    </Animated.View>
  );
}

// A bunch of flowers in a bin: tap to add, or drag it out onto the paper.
function Bunch({ flowerKey, count, size, disabled, x, y, dropRight, onAdd, fs }) {
  const drag = useRef(new Animated.ValueXY()).current;
  const [lifted, setLifted] = useState(false);
  const cfg = useRef({});
  cfg.current = { disabled, dropRight, onAdd, x };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !cfg.current.disabled,
    onMoveShouldSetPanResponder: () => !cfg.current.disabled,
    onPanResponderGrant: () => setLifted(true),
    onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      setLifted(false);
      const moved = Math.hypot(g.dx, g.dy);
      const droppedOnTable = cfg.current.x + size / 2 + g.dx > cfg.current.dropRight;   // let go over the mat
      if (moved < 8 || droppedOnTable) cfg.current.onAdd();
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
function Flap({ side, w, h, top, sheet, paperTop, flapTop, pw, ph, wash, z, active, done, reach, onDone }) {
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
        <Image source={sheet} resizeMode="stretch" style={{ position: 'absolute', width: pw, height: ph, left: side === 'left' ? 0 : -w, top: -(flapTop - paperTop) }} />
        {wash && <View style={[StyleSheet.absoluteFill, { backgroundColor: wash }]} />}
      </View>
      <View style={[styles.flapEdge, side === 'left' ? { left: 0 } : { right: 0 }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#3a2008', opacity: under }]} />
      {active && <Text style={[styles.swipe, side === 'left' ? { right: 6 } : { left: 6 }]}>{side === 'left' ? '>>' : '<<'}</Text>}
    </Animated.View>
  );
}

// The ribbon: drag across the waist; it unrolls behind your finger and bows.
function Ribbon({ x, y, w, source, fy, done, onDone }) {
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
  const rh = w / RIBBON_ASPECT;                          // the ribbon picture is 1000×100
  return (
    <View style={{ position: 'absolute', left: x, top: y - rh / 2, width: w, height: rh, zIndex: 8 }} {...pan.panHandlers}>
      {/* the ribbon is revealed left to right behind your finger */}
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, height: rh, width: barW, overflow: 'hidden' }} pointerEvents="none">
        <Image source={source} style={{ width: w, height: rh }} resizeMode="stretch" />
      </Animated.View>
      {!done && (
        <Animated.Text pointerEvents="none" style={[styles.swipe, { left: 14, top: rh * 0.15, fontSize: 16, opacity: prog.interpolate({ inputRange: [0, 0.08], outputRange: [1, 0], extrapolate: 'clamp' }) }]}>
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
  ticketName: { fontFamily: HEAD, fontSize: 15, color: '#4a2a10' },
  ticketTxt: { fontFamily: BODY, fontSize: 13.5, color: '#5a3a1a' },
  sheetBtn: { position: 'absolute', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 5, shadowOffset: { width: 2, height: 3 } },
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
  promptTxt: { fontFamily: HEAD, fontSize: 16, color: '#fff3d6', textAlign: 'center', textShadowColor: '#2a1608', textShadowRadius: 4 },
  bunch: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: 'rgba(255,243,214,0.88)' },
  badge: { position: 'absolute', right: -4, bottom: -4, backgroundColor: '#5a3410', borderWidth: 2, borderColor: '#2a1608', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(58,32,12,0.88)', borderWidth: 3, borderColor: '#2a1608', borderRadius: 4 },
  priceTxt: { fontFamily: HEAD, fontSize: 24, color: '#ffd060' },
  neat: { fontFamily: HEAD, fontSize: 16, color: '#cfe8a0', textShadowColor: '#2a1608', textShadowRadius: 3 },
  small: { fontFamily: BODY, fontSize: 13, color: '#fff3d6', textShadowColor: '#2a1608', textShadowRadius: 3 },
  recipeBtn: { position: 'absolute', zIndex: 30, backgroundColor: '#5a3410', borderWidth: 3, borderColor: '#2a1608', borderRadius: 4 },
});
