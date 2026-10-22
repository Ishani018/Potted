import React, { useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Easing, PanResponder, Platform, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { BOUQUET_BG, TRADE_IMAGES, UI_IMAGES, MAKE_IMAGES, BOW_IMAGES, ORDER_ART, BOOK_STAMP, CUSTOMER_IMAGES, CUSTOMER_POSES } from '../engine/assets';
import {
  TRADE_FLOWERS, BOUQUET_SIZE, BOUQUET_RECIPES, BOUQUET_PAPERS, bouquetPaper, evaluateBouquet, playerLevel, CUSTOMERS,
  RIBBON_NAMES, orderGrade,
} from '../constants/gameData';
import { globalPetEffects } from '../engine/petEffects';
import ScreenHud from '../components/ScreenHud';
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
const PLOPPER_W = 1376;   // (the workspace picture is 1170x658, close enough to 16:9)
const PLOPPER_H = 768;
const PAPER_IMG = { plain: 'bouquetempty', layered: 'bouquetmixed', fancy: 'bouquetfancy' };
// Kraft and the flowered parchment have art; "layered" is both sheets together, the
// parchment lying a little crooked on top of the kraft.
// Shadows follow the shape of the thing, soft and blurred (never a hard box).
const SOFT = Platform.OS === 'web'
  ? { filter: 'drop-shadow(0px 5px 7px rgba(50,28,10,0.38))' }
  : { shadowColor: '#3a200a', shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } };
function SheetLayers({ paper, w, h, shadow = false }) {
  if (paper === 'layered') {
    return (
      <View style={{ width: w, height: h }}>
        <Image source={MAKE_IMAGES.paper} style={[{ width: w, height: h }, shadow && SOFT]} resizeMode="stretch" />
        <Image source={MAKE_IMAGES.paperFancy} resizeMode="stretch"
          style={[{ position: 'absolute', left: w * 0.06, top: h * 0.05, width: w * 0.88, height: h * 0.9, transform: [{ rotate: '-3deg' }] }, SOFT]} />
      </View>
    );
  }
  return <Image source={paper === 'fancy' ? MAKE_IMAGES.paperFancy : MAKE_IMAGES.paper} style={[{ width: w, height: h }, shadow && SOFT]} resizeMode="stretch" />;
}
// The six spools on the ribbon tray (base units); each pulls its own ribbon. The twine isn't one.
const SPOOLS = [
  { x: 1158, y: 138, key: 'ribbonRed' }, { x: 1211, y: 138, key: 'ribbonPink' }, { x: 1264, y: 138, key: 'ribbonCream' },
  { x: 1158, y: 247, key: 'ribbonPinkFloral' }, { x: 1215, y: 247, key: 'ribbonCreamFloral' }, { x: 1280, y: 247, key: 'ribbonGreen' },
];
const PAPER_ASPECT = 700 / 617;
const RIBBON_ASPECT = 11.2;                          // the ribbon pictures are 1000×~89
const MAT = { x0: 535, y0: 196, x1: 1088, y1: 583 };  // the wooden work mat
const CX = 792;                                       // centre of the sheet lying on the mat (it is painted into the picture)
const CY = 390;                                       // (the painted sheet is a little wider than it is tall; ours covers it)
const PAPER_BOX = { w: 379, h: Math.round(379 / PAPER_ASPECT) };   // the sheet once it is on the mat
PAPER_BOX.top = Math.round(CY - PAPER_BOX.h / 2);
const FLAP_TOP = PAPER_BOX.top + Math.round(0.42 * PAPER_BOX.h);   // where the ribbon waist sits; the blooms stay above
// ribbon -> the colour of bows that go with it
const BOW_COLOR = { ribbonRed: 'red', ribbonPink: 'pink', ribbonCream: 'cream', ribbonPinkFloral: 'pinkfloral', ribbonGreen: 'green', ribbonCreamFloral: 'creamfloral' };
const WRAP_ART = { plain: 'wrapKraft', layered: 'wrapLayered', fancy: 'wrapLayered' };
const WRAP_ASPECT = 640 / 590;                                       // height / width of the wrapped-bouquet pictures
const WRAP_W = 330;
const WAIST = 0.79;                                                  // where the twine sits, as a fraction of the wrapper's height
const FOLD_DEG = 20;                                                // tilt of the diagonal fold lines
const TRAY = { cx: 1247, cy: 562, w: 247, h: 169 };  // the hand-over tray, bottom right
// The nine bins down the left (basket, bucket, basket ...), centres in base space; each has a name plate under it
const BINS = [
  { x: 100, y: 140 }, { x: 267, y: 138 }, { x: 433, y: 138 },
  { x: 96, y: 315 }, { x: 263, y: 315 }, { x: 433, y: 313 },
  { x: 92, y: 490 }, { x: 266, y: 488 }, { x: 435, y: 490 },
];
const BIN_D = 160;
const STRIP_SLOTS = [606, 700, 794, 888, 982];   // left edges of the five painted slots on the order strip
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

export default function BouquetScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const found = state.player.bouquetBook ?? {};
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [step, setStep] = useState(0);              // 0 paper .. 3 tie, 4 bow, 5 give
  const [bow, setBow] = useState(null);            // the bow on the ribbon: { color, i } into BOW_IMAGES
  const [picks, setPicks] = useState([]);
  const [chosenPaper, setPaper] = useState('plain');
  const [folded, setFolded] = useState({ left: false, right: false });
  const [tied, setTied] = useState(false);
  const firstFold = useRef(null);               // which flap went over first (it ends up underneath)
  const [celebrate, setCelebrate] = useState(0);   // the perfect-order burst
  const [neat, setNeat] = useState(true);           // stays true while every swipe is steady
  const [binPage, setBinPage] = useState(0);
  const [ribbonKey, setRibbonKey] = useState('ribbonRed');
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
  const grade = order ? orderGrade(order, paper, ribbonKey) : null;
  const payout = result ? result.net + neatBonus + (order ? Math.round(order.tip * grade.mult) : 0) : 0;

  // ── step helpers ──
  const resetAll = () => { firstFold.current = null; setStep(0); setPicks([]); setFolded({ left: false, right: false }); setTied(false); setNeat(true); setRibbonKey('ribbonRed'); setBow(null); };
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
  const onTied = (wasNeat, key) => { if (!wasNeat) setNeat(false); setRibbonKey(key); setTied(true); setTimeout(() => setStep(4), 900); };
  const onBow = (pick) => setBow(pick);
  const giveOver = () => {
    if (!result) return;
    dispatch({ type: 'SELL_BOUQUET', flowers: picks, paper, ribbon: ribbonKey, customerId: order ? order.id : null, neat });
    const perfect = !!(order && grade && grade.perfect);
    const earned = order ? `${customerName} paid ${payout} coins.${grade.label && !perfect ? ` ${grade.label}` : ''}` : `You earned ${result.net + neatBonus} coins.`;
    // a perfect order gets its own banner (with the coins), so no second pop-up unless it is a new recipe
    if (!perfect || isNewRecipe) {
      notify({
        icon: UI_IMAGES[PAPER_IMG[paper]],
        title: isNewRecipe ? `New recipe: ${result.name}!` : `Made ${result.name}!`,
        subtitle: isNewRecipe ? `Saved to your garden journal. ${earned}` : earned,
      });
    }
    const toCounter = !!order;
    resetAll();
    if (perfect) { setCelebrate(payout);  setTimeout(() => setCelebrate(0), 1900); }
    if (toCounter) setTimeout(() => navigation.navigate('Counter'), perfect ? 1900 : 900);
  };

  const foundCount = BOUQUET_RECIPES.filter((r) => found[r.id]).length;
  const pw = fx(PAPER_BOX.w), ph = fy(PAPER_BOX.h), pLeft = fx(CX) - pw / 2, pTop = fy(PAPER_BOX.top);
  // the wrapped bouquet sits in the middle of that same box
  const ww = fx(WRAP_W), wh = ww * WRAP_ASPECT, wx = (pw - ww) / 2, wy = (ph - wh) / 2;
  const prompt = step === 0 ? 'Drag a sheet off the stack onto the mat.'
    : step === 1 ? (full ? 'Lovely! Now fold it.' : `Drag ${BOUQUET_SIZE - picks.length} more flower${BOUQUET_SIZE - picks.length === 1 ? '' : 's'} onto the paper.`)
    : step === 2 ? 'Swipe each side over to wrap the stems.'
    : step === 3 ? 'Pull a ribbon from a spool onto the paper.'
    : step === 4 ? (bow == null ? 'Drag a bow from the box onto the ribbon.' : 'Pretty! Drag another to swap, or tap Finish.')
    : (result ? `${isNewRecipe ? 'Something special...' : result.name}. Drag it onto the tray!` : '');

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={BOUQUET_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && (
        <>
          {/* ── 0: the paper stack at the top: tap it to change paper, drag a sheet onto the mat ── */}
          {step === 0 && (
            <PaperStack
              paper={paper} chosen={chosenPaper} level={level} coins={coins}
              onCycle={(id) => setPaper(id)} onChoose={() => setStep(1)}
              box={{ x: fx(547), y: 0, w: fx(476), h: fy(190) }} matTop={fy(MAT.y0)} fx={fx} fy={fy}
            />
          )}

          {/* ── the sheet on the mat: flowers, flaps, ribbon ── */}
          {step >= 1 && step <= 5 && (
            <HandOver
              enabled={step === 5} home={{ x: pLeft + pw / 2, y: pTop + ph / 2 }} style={{ position: 'absolute', left: pLeft, top: pTop, width: pw, height: ph }}
              tray={{ x: fx(TRAY.cx), y: fy(TRAY.cy), w: fx(TRAY.w), h: fy(TRAY.h) }} onDrop={giveOver}
            >
              {/* the flat sheet with its flowers and flaps; it fades out once both flaps are over */}
              <FadeOut hide={step >= 3}>
                <View style={{ width: pw, height: ph }} pointerEvents="none">
                  <SheetLayers paper={paper} w={pw} h={ph} shadow />
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
                    <Flap side="left" paper={paper} pw={pw} ph={ph}
                      z={firstFold.current === 'left' || !firstFold.current ? 6 : 7}
                      active={step === 2 && !folded.left} done={folded.left} reach={fx(250)} onDone={(n) => onFolded('left', n)} />
                    <Flap side="right" paper={paper} pw={pw} ph={ph}
                      z={firstFold.current === 'right' ? 6 : 7}
                      active={step === 2 && !folded.right} done={folded.right} reach={fx(250)} onDone={(n) => onFolded('right', n)} />
                  </>
                )}
              </FadeOut>

              {/* once folded it is the wrapped bouquet: the wrapper, the flowers in its opening, the ribbon and bow */}
              {step >= 3 && (
                <Wrapped
                  art={MAKE_IMAGES[WRAP_ART[paper]]} picks={picks} left={wx} top={wy} w={ww} h={wh} fx={fx}
                  ribbon={tied ? MAKE_IMAGES[ribbonKey] : null}
                  bow={bow != null ? BOW_IMAGES[bow.color][bow.i] : null}
                />
              )}
            </HandOver>
          )}

          {/* ── 3: pull a ribbon off a spool and let go over the middle of the paper ── */}
          {step === 3 && !tied && (
            <SpoolPull
              spools={SPOOLS.map((sp) => ({ ...sp, x: fx(sp.x), y: fy(sp.y), r: fx(30) }))}
              target={{ left: pLeft + wx, top: pTop + wy, w: ww, h: wh, waist: pTop + wy + WAIST * wh }}
              onTie={(key, wasNeat) => onTied(wasNeat, key)} fy={fy}
            />
          )}

          {/* ── 4: the box under the scissors holds the bows: drag one onto the ribbon ── */}
          {step === 4 && (
            <BowBox
              colorKey={BOW_COLOR[ribbonKey]} onPlace={onBow} fx={fx}
              tray={{ x: fx(TRAY.cx), y: fy(TRAY.cy), w: fx(TRAY.w), h: fy(TRAY.h) }}
              target={{ left: pLeft + wx, top: pTop + wy, w: ww, h: wh }}
            />
          )}

          <BowPile tray={{ x: fx(TRAY.cx), y: fy(TRAY.cy), w: fx(TRAY.w), h: fy(TRAY.h) }} fx={fx} />

          {/* the flowers sit in their bins; drag one out onto the paper */}
          {step === 1 && owned.length === 0 && (
            <Text style={[styles.hint, { left: fx(CX) - fx(260), width: fx(520), top: fy(CY) }]}>No harvested flowers yet. Grow some first!</Text>
          )}
          {shown.map((key, i) => (
            <Bunch
              key={key + i} flowerKey={key} count={left(key)} size={fx(BIN_D) * 0.72} disabled={step !== 1 || full || left(key) <= 0} dim={step === 1}
              x={fx(BINS[i].x) - fx(BIN_D) * 0.36} y={fy(BINS[i].y) - fx(BIN_D) * 0.36}
              dropRight={fx(MAT.x0)} onAdd={() => addFlower(key)} fs={fs} plateY={fy(68) + fx(BIN_D) * 0.36}
            />
          ))}
          {pages > 1 && (
            <View style={{ position: 'absolute', left: fx(18), top: fy(608), zIndex: 30 }}>
              <PixelButton label={`MORE ${page + 1}/${pages}`} tone="wood" size={fs(7, 6)} onPress={() => setBinPage((page + 1) % pages)} />
            </View>
          )}

          {/* the order slip and the prompt along the bottom of the table */}
          {want && (
            <>
              {/* the customer, in the round frame at the left of the painted strip */}
              <View pointerEvents="none" style={{ position: 'absolute', left: fx(243), top: fy(623), width: fx(100), height: fx(100), borderRadius: fx(50), overflow: 'hidden', zIndex: 10 }}>
                <Image source={(CUSTOMER_POSES[want.customer] || {}).think || CUSTOMER_IMAGES[want.customer]} style={{ position: 'absolute', width: fx(190), height: fx(285), left: -fx(45), top: -fx(55) }} resizeMode="contain" />
              </View>
              <Text pointerEvents="none" style={[styles.stripName, { left: fx(392), top: fy(642), width: fx(190) }]} numberOfLines={1}>{CUSTOMERS[want.customer].name}</Text>
              <Text pointerEvents="none" style={[styles.stripSub, { left: fx(392), top: fy(678), width: fx(190) }]} numberOfLines={1}>{step === 5 && result ? `${payout} coins${grade && grade.perfect ? ' · Perfect' : neat ? ' · Neat' : ''}` : `${flowerName(want.flowerKey)} bouquet`}</Text>
              {[
                { src: TRADE_IMAGES[TRADE_FLOWERS[want.flowerKey]?.img], ok: picks.includes(want.flowerKey) },
                want.paper && { src: { plain: MAKE_IMAGES.paper, layered: MAKE_IMAGES.wrapLayered }[want.paper] || MAKE_IMAGES.paper, ok: step >= 1 && paper === want.paper },
                want.ribbon && { src: MAKE_IMAGES[want.ribbon], strip: true, ok: tied && ribbonKey === want.ribbon },
                want.ribbon && { src: (BOW_IMAGES[BOW_COLOR[want.ribbon]] || [])[0], ok: bow != null && bow.color === BOW_COLOR[want.ribbon] },
                { src: UI_IMAGES.goldcoins, label: `+${want.tip}` },
              ].map((it, i) => it && (
                <View key={i} pointerEvents="none" style={{ position: 'absolute', left: fx(STRIP_SLOTS[i]), top: fy(633), width: fx(76), height: fx(76), alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <Image source={ORDER_ART.tile_cream} style={styles.ticketBg} resizeMode="stretch" />
                  {it.strip
                    ? <Image source={it.src} style={{ width: fx(52), height: fx(52) / RIBBON_ASPECT * 1.8 }} resizeMode="stretch" />
                    : <Image source={it.src} style={{ width: fx(48), height: fx(48), marginBottom: it.label ? fx(8) : 0 }} resizeMode="contain" />}
                  {it.label ? <Text style={styles.stripTip}>{it.label}</Text> : null}
                  {it.ok && <Image source={BOOK_STAMP} style={{ position: 'absolute', right: -fx(8), top: -fx(8), width: fx(26), height: fx(26) }} resizeMode="contain" />}
                </View>
              ))}
            </>
          )}
          <View style={[styles.prompt, { left: fx(541), width: fx(547), top: fy(203) }]} pointerEvents="none">
            <Text style={styles.promptTxt} numberOfLines={1}>{prompt}</Text>
          </View>

          {/* buttons, right column (beside the scissors) */}
          <View style={{ position: 'absolute', left: fx(1160), top: fy(316), width: fx(170), alignItems: 'center', gap: fy(4), zIndex: 30 }}>
            {step === 1 && (
              <>
                <PixelButton onPress={goFold} disabled={!full} size={fs(9, 7)} label="FOLD IT" style={{ alignSelf: 'stretch' }} />
                <PixelButton onPress={undo} disabled={picks.length === 0} tone="wood" size={fs(7, 6)} scale={0.7} label="UNDO" style={{ alignSelf: 'stretch' }} />
              </>
            )}
            {step === 4 && (
              <PixelButton onPress={() => setStep(5)} disabled={bow == null} size={fs(9, 7)} label="FINISH" style={{ alignSelf: 'stretch' }} />
            )}
            {step === 5 && result && (
              <PixelButton onPress={giveOver} size={fs(8, 6)} label={order ? 'GIVE IT' : 'SELL IT'} style={{ alignSelf: 'stretch' }} />
            )}
            {step > 0 && step < 5 && (
              <PixelButton onPress={resetAll} tone="wood" size={fs(7, 6)} scale={0.7} label="START OVER" style={{ alignSelf: 'stretch' }} />
            )}
          </View>
        </>
      )}

      {/* Recipes: the garden journal's bouquet pages */}
      <TouchableOpacity
        style={[styles.recipeBtn, { left: fx(18), top: fy(706), paddingHorizontal: fx(10), paddingVertical: fy(6) }]}
        onPress={() => navigation.navigate('FlowerBook', { tab: 'bouquets' })}
        activeOpacity={0.85}
      >
        <PixelText size={fs(7, 6)}>RECIPES {foundCount}/{BOUQUET_RECIPES.length}</PixelText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.recipeBtn, { left: fx(18), top: fy(660), paddingHorizontal: fx(10), paddingVertical: fy(6) }]}
        onPress={() => navigation.navigate('Counter')}
        activeOpacity={0.85}
      >
        <PixelText size={fs(7, 6)}>{'< COUNTER'}</PixelText>
      </TouchableOpacity>

      {/* no settings button or level badge here: they would sit on top of the flower bins */}
      {celebrate > 0 && <Celebration fx={fx} fy={fy} coins={celebrate} />}
      <ScreenHud sw={sw} sh={sh} onMap={() => navigation.navigate('Map')} />
      {notice}
    </View>
  );
}

// A shower of blossoms and leaves with a banner when an order is perfect.
function Celebration({ fx, fy, coins }) {
  const N = 22;
  const t = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: false }).start();
  }, []);
  const bits = useRef(Array.from({ length: N }, (_, i) => ({
    x: 120 + Math.random() * 1130, delay: Math.random() * 0.35, spin: (Math.random() - 0.5) * 360,
    art: [ORDER_ART.daisy, ORDER_ART.blossom, ORDER_ART.leaves][i % 3], size: 26 + Math.random() * 26,
  }))).current;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 60 }]}>
      {bits.map((b, i) => (
        <Animated.Image key={i} source={b.art} resizeMode="contain" style={{
          position: 'absolute', left: fx(b.x), width: fx(b.size), height: fx(b.size),
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [b.delay, 1], outputRange: [fy(-60), fy(820)], extrapolate: 'clamp' }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${b.spin}deg`] }) },
          ],
        }} />
      ))}
      <Animated.View style={{
        position: 'absolute', left: fx(330), top: fy(210), width: fx(720), height: fx(720) * 372 / 900, alignItems: 'center',
        opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
      }}>
        <Image source={ORDER_ART.perfect} style={{ width: '100%', height: '100%' }} resizeMode="stretch" />
        <View style={styles.perfectRow}>
          <Image source={UI_IMAGES.goldcoins} style={{ width: fx(58), height: fx(58) }} resizeMode="contain" />
          <Text style={styles.perfectCoins}>+{coins}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// Fades its children out (and back) when `hide` changes.
function FadeOut({ hide, children }) {
  const o = useRef(new Animated.Value(hide ? 0 : 1)).current;
  React.useEffect(() => { Animated.timing(o, { toValue: hide ? 0 : 1, duration: 380, useNativeDriver: false }).start(); }, [hide]);
  return <Animated.View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: o }} pointerEvents="box-none">{children}</Animated.View>;
}

// The wrapped bouquet: the folded wrapper picture, the three flowers blooming out of its
// opening, then the ribbon round the waist (where the twine is) and the bow on the ribbon.
function Wrapped({ art, picks, left, top, w, h, ribbon, bow, fx }) {
  const o = useRef(new Animated.Value(0)).current;
  React.useEffect(() => { Animated.timing(o, { toValue: 1, duration: 380, useNativeDriver: false }).start(); }, []);
  const FAN = [{ x: 0.32, y: 0.27, r: '-14deg' }, { x: 0.68, y: 0.27, r: '14deg' }, { x: 0.5, y: 0.17, r: '0deg' }];
  const fz = w * 0.46;
  const rw = w * 0.2, rh = w * 0.075, wy = top + h * WAIST + w * 0.01;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: o }}>
      <Image source={art} style={[{ position: 'absolute', left, top, width: w, height: h }, SOFT]} resizeMode="contain" />
      {picks.map((k, i) => (
        <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} resizeMode="contain"
          style={{ position: 'absolute', left: left + w * FAN[i].x - fz / 2, top: top + h * FAN[i].y - fz / 2, width: fz, height: fz, transform: [{ rotate: FAN[i].r }], zIndex: i === 2 ? 3 : 2 }} />
      ))}
      {ribbon && <TiedRibbon x={left + (w - rw) / 2} y={wy} w={rw} h={rh} source={ribbon} />}
      {bow && <Image source={bow} resizeMode="contain" style={[{ position: 'absolute', left: left + w * 0.5 - fx(58), top: wy - fx(42), width: fx(116), height: fx(88), zIndex: 9 }, SOFT]} />}
    </Animated.View>
  );
}

// The finished bouquet (the paper with its flowers, ribbon and bow) on the mat. When enabled,
// drag it onto the tray (bottom right) to hand it over.
function HandOver({ enabled, home, tray, onDrop, style, children }) {
  const drag = useRef(new Animated.ValueXY()).current;
  const cfg = useRef({});
  cfg.current = { enabled, home, tray, onDrop };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => cfg.current.enabled,
    onMoveShouldSetPanResponder: () => cfg.current.enabled,
    onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      const { home: h, tray: t } = cfg.current;
      const x = h.x + g.dx, y = h.y + g.dy;
      if (Math.abs(x - t.x) < t.w / 2 + 40 && Math.abs(y - t.y) < t.h / 2 + 40) cfg.current.onDrop();
      else Animated.spring(drag, { toValue: { x: 0, y: 0 }, friction: 7, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
  })).current;
  return (
    <Animated.View {...pan.panHandlers} pointerEvents={enabled ? 'auto' : 'box-none'} style={[style, { zIndex: enabled ? 20 : 4, transform: drag.getTranslateTransform() }]}>
      {children}
    </Animated.View>
  );
}

// The painted box of bows is empty in the picture, so the bows are heaped into it here.
const BOW_SPOTS = [
  { c: 'red', x: 0.2, y: 0.3, r: -18 }, { c: 'pink', x: 0.5, y: 0.26, r: 8 }, { c: 'pinkfloral', x: 0.8, y: 0.3, r: 16 },
  { c: 'cream', x: 0.3, y: 0.55, r: 10 }, { c: 'green', x: 0.62, y: 0.56, r: -12 }, { c: 'creamfloral', x: 0.82, y: 0.62, r: 6 },
  { c: 'pink', x: 0.15, y: 0.7, r: 14 }, { c: 'red', x: 0.46, y: 0.74, r: -8 },
];
function BowPile({ tray, fx }) {
  const L = tray.x - tray.w / 2, T = tray.y - tray.h / 2;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: L, top: T, width: tray.w, height: tray.h, zIndex: 3, overflow: 'hidden' }}>
      {BOW_SPOTS.map((b, i) => (
        <Image key={i} source={(BOW_IMAGES[b.c] || [])[i % (BOW_IMAGES[b.c] || [1]).length]} resizeMode="contain" style={{
          position: 'absolute', left: tray.w * b.x - fx(40), top: tray.h * b.y - fx(34), width: fx(80), height: fx(68), transform: [{ rotate: `${b.r}deg` }], ...SOFT,
        }} />
      ))}
    </View>
  );
}


// The box under the scissors is a dispenser: press anywhere in it and a bow appears under your
// finger; drag it onto the bouquet and let go. Each pick is a different bow (about 7 in 10
// match your ribbon's colour, the rest are any of the 26 on the sheet), so you always get a
// new one. Let go off the bouquet and it goes back.
function BowBox({ colorKey, tray, target, onPlace, fx }) {
  const [held, setHeld] = useState(null);            // { color, i, x, y }
  const last = useRef(null);
  const cfg = useRef({});
  cfg.current = { target, onPlace, tray };
  const pickBow = () => {
    const colors = Object.keys(BOW_IMAGES);
    for (let n = 0; n < 8; n++) {
      const color = Math.random() < 0.7 ? colorKey : colors[Math.floor(Math.random() * colors.length)];
      const i = Math.floor(Math.random() * BOW_IMAGES[color].length);
      if (!last.current || last.current.color !== color || last.current.i !== i || BOW_IMAGES[color].length === 1) { last.current = { color, i }; return last.current; }
    }
    return last.current ?? { color: colorKey, i: 0 };
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const t = cfg.current.tray;
      const ne = e.nativeEvent;
      const bx = t.x - t.w / 2 + (ne.locationX ?? t.w / 2), by = t.y - t.h / 2 + (ne.locationY ?? t.h / 2);
      setHeld({ ...pickBow(), sx: bx, sy: by, x: bx, y: by });
    },
    onPanResponderMove: (_, g) => setHeld((h) => (h ? { ...h, x: h.sx + g.dx, y: h.sy + g.dy } : h)),
    onPanResponderRelease: () => {
      setHeld((h) => {
        if (h) {
          const t = cfg.current.target;
          if (h.x > t.left && h.x < t.left + t.w && h.y > t.top && h.y < t.top + t.h) cfg.current.onPlace({ color: h.color, i: h.i });
        }
        return null;
      });
    },
    onPanResponderTerminate: () => setHeld(null),
  })).current;
  const SZ = fx(150);
  return (
    <>
      <View {...pan.panHandlers} style={{ position: 'absolute', left: tray.x - tray.w / 2, top: tray.y - tray.h / 2, width: tray.w, height: tray.h, zIndex: 40 }} />
      {held && (
        <Image
          source={BOW_IMAGES[held.color][held.i]} pointerEvents="none" resizeMode="contain"
          style={[{ position: 'absolute', left: held.x - SZ / 2, top: held.y - SZ * 0.38, width: SZ, height: SZ * 0.76, zIndex: 70 }, SOFT]}
        />
      )}
    </>
  );
}

// A bunch of flowers in a bin: tap to add, or drag it out onto the paper.
// where each flower in a bin's heap lies (as a fraction of the bin's size) and how it is turned
const PILE = [
  { x: 0.04, y: 0.02, r: 8 }, { x: -0.2, y: -0.08, r: -16 }, { x: 0.22, y: -0.1, r: 14 },
  { x: -0.02, y: -0.2, r: -4 }, { x: -0.26, y: 0.1, r: -24 }, { x: 0.26, y: 0.08, r: 22 },
];

function Bunch({ flowerKey, count, size, disabled, dim = true, x, y, dropRight, onAdd, fs, plateY }) {
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
  // a loose heap of the flower in its bin, back to front; the top one lifts out when you drag
  const n = Math.min(count, PILE.length);
  const fl = size * 0.74;
  const src = TRADE_IMAGES[TRADE_FLOWERS[flowerKey].img];
  return (
    <View {...pan.panHandlers} style={[styles.bunch, { left: x, top: y, width: size, height: size * 0.8, zIndex: lifted ? 50 : 5, opacity: disabled && dim ? 0.55 : 1 }]}>
      {PILE.slice(0, n).map((q, i) => {
        const top = i === 0;                       // PILE[0] is the front-most flower
        return (
          <Animated.Image key={i} source={src} resizeMode="contain" pointerEvents="none"
            style={{
              position: 'absolute', width: fl * (top && lifted ? 1.5 : 1), height: fl * (top && lifted ? 1.5 : 1),
              left: size / 2 + q.x * size - fl * (top && lifted ? 0.75 : 0.5), top: size * 0.47 + q.y * size - fl * (top && lifted ? 0.75 : 0.5),
              zIndex: PILE.length - i, ...SOFT,
              transform: [{ rotate: `${q.r}deg` }, ...(top ? drag.getTranslateTransform() : [])],
            }} />
        );
      })}
      <Text pointerEvents="none" style={[styles.plate, { top: plateY - size * 0.11, width: size, fontSize: Math.max(10, size * 0.17) }]}>{count}</Text>
    </View>
  );
}

// One side of the wrapping paper. Swipe it across the middle; it follows your finger,
// lands flat over the stems if you pass halfway, otherwise springs back. A steady
// (mostly horizontal) swipe counts as neat.
function Flap({ side, paper, pw, ph, z, active, done, reach, onDone }) {
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
        const steady = Math.abs(g.dy) < Math.abs(g.dx) * 0.6 + 14;
        Animated.timing(p, { toValue: 1, duration: 140, useNativeDriver: false }).start(() => cfg.current.onDone(steady));
      } else Animated.spring(p, { toValue: 0, friction: 7, useNativeDriver: false }).start();
    },
  })).current;

  // The fold line is diagonal, like wrapping a cone: it runs through the lower middle of
  // the sheet, tilted FOLD_DEG. The flap is the part of the paper on its outer side, and it
  // flips over that line (scaleX in the line's own, tilted frame).
  const th = (side === 'left' ? -FOLD_DEG : FOLD_DEG) * Math.PI / 180;
  const cos = Math.cos(th), sin = Math.sin(th);
  const fw = pw * 0.52, fh = ph * 0.56;
  const P = { x: pw / 2, y: ph * 0.72 };                  // a point on the fold line, in sheet pixels
  const L = { x: side === 'left' ? fw : 0, y: fh / 2 };   // that same point inside the flap
  const O = { x: L.x + (-P.x * cos + -P.y * sin), y: L.y + (P.x * sin + -P.y * cos) };  // sheet origin inside the flap (turned by -th)
  const off = side === 'left' ? fw / 2 : -fw / 2;         // pivot sits on the flap's inner edge
  const scaleX = p.interpolate({ inputRange: [0, 1], outputRange: [1, -1] });
  const under = p.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [0, 0, 1, 1] });
  const lift = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0.4] });   // the shadow is biggest mid-swipe
  return (
    <Animated.View
      {...pan.panHandlers}
      style={{
        position: 'absolute', left: P.x - L.x, top: P.y - L.y, width: fw, height: fh, zIndex: done ? z : 5,
        pointerEvents: done ? 'none' : 'auto', ...SOFT,
        transform: [{ translateX: off }, { rotate: `${th}rad` }, { scaleX }, { translateX: -off }],
      }}
    >
      {/* this flap is a cut of the same sheet (turned back upright inside), so it keeps the paper's own texture */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <View style={{ position: 'absolute', left: O.x, top: O.y, width: pw, height: ph,
          transform: [{ translateX: -pw / 2 }, { translateY: -ph / 2 }, { rotate: `${-th}rad` }, { translateX: pw / 2 }, { translateY: ph / 2 }] }}>
          <SheetLayers paper={paper} w={pw} h={ph} />
          {/* soft shade along the fold, drawn on the sheet so it never spills past the paper */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: lift }]} pointerEvents="none"><Shade side={side} peak={0.2} /></Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: under }]} pointerEvents="none"><Shade side={side} peak={0.3} wide /></Animated.View>
        </View>
      </View>
      {active && <Text style={[styles.swipe, side === 'left' ? { right: 6 } : { left: 6 }]}>{side === 'left' ? '>>' : '<<'}</Text>}
    </Animated.View>
  );
}

// A soft gradient made of thin strips: darkest at the fold (the flap's inner edge), fading out.
function Shade({ side, peak, wide = false }) {
  const N = 40;
  return (
    <View style={[StyleSheet.absoluteFill, { flexDirection: side === 'left' ? 'row-reverse' : 'row' }]}>
      {Array.from({ length: N }, (_, i) => {
        const t = i / (N - 1);                       // 0 at the fold .. 1 far edge
        const o = peak * Math.pow(1 - t, wide ? 1.2 : 2.4);
        return <View key={i} style={{ flex: 1, backgroundColor: `rgba(58,32,8,${o.toFixed(3)})` }} />;
      })}
    </View>
  );
}

// One item on the order strip: a little framed picture, ticked once you have it right.
function TicketTile({ source, ok, fx }) {
  return (
    <View style={{ width: fx(46), height: fx(46), alignItems: 'center', justifyContent: 'center' }}>
      <Image source={ORDER_ART.tile_cream} style={styles.ticketBg} resizeMode="stretch" />
      <Image source={source} style={{ width: fx(34), height: fx(34) }} resizeMode="contain" />
      {ok && <View style={styles.tick}><Text style={styles.tickTxt}>✓</Text></View>}
    </View>
  );
}

// The tied ribbon lying across the paper: it sweeps in from the left.
function TiedRibbon({ x, y, w, h, source }) {
  // The ribbon wraps round the neck (the twine). It is a band as wide as the neck and thick enough
  // to read as ribbon, cut from the middle of your strip so the pattern isn't stretched. It is
  // sliced and each slice is bent along an arc, and the slices near the ends are squeezed
  // thinner so the band seems to turn away round the back. It winds in left to right.
  const N = 30;
  const sweep = useRef(new Animated.Value(0)).current;
  React.useEffect(() => { Animated.timing(sweep, { toValue: 1, duration: 520, useNativeDriver: false }).start(); }, []);
  const rh = h;                                           // band thickness
  const imgW = rh * RIBBON_ASPECT;                        // the strip scaled to that thickness (much wider than the band)
  const crop = (imgW - w) / 2;                            // we show its middle
  const sag = rh * 0.22;                                  // how far the middle dips below the ends
  const sw = w / N;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y - rh / 2 - sag * 0.25, width: w, height: rh + sag, zIndex: 8 }}>
      {Array.from({ length: N }, (_, i) => {
        const t = (i + 0.5) / N;
        const arc = Math.sin(Math.PI * t);
        const dy = arc * sag;
        const sh = rh * (0.62 + 0.38 * Math.sqrt(arc));     // thinner towards the ends
        const slope = Math.atan(Math.cos(Math.PI * t) * Math.PI * sag / w);
        return (
          <Animated.View key={i} style={{
            position: 'absolute', left: i * sw, top: dy + (rh - sh) / 2, width: sw + 0.8, height: sh, overflow: 'hidden',
            opacity: sweep.interpolate({ inputRange: [i / N, (i + 1) / N], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [{ rotate: `${slope * 0.35}rad` }],
          }}>
            <Image source={source} style={{ position: 'absolute', left: -i * sw - crop, top: (sh - rh) / 2, width: imgW, height: rh }} resizeMode="stretch" />
          </Animated.View>
        );
      })}
    </View>
  );
}

// The ribbon tray: pull a ribbon off a spool (it stretches from the spool to your finger)
// and let go over the middle of the paper. Letting go close to the waist line is neat.
function SpoolPull({ spools, target, onTie, fy }) {
  const [pull, setPull] = useState(null);                 // { sx, sy, x, y, key }
  const pulse = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const cfg = useRef({});
  cfg.current = { target, onTie, fy };
  const makePan = (sp) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setPull({ sx: sp.x, sy: sp.y, x: sp.x, y: sp.y, key: sp.key }),
    onPanResponderMove: (_, g) => setPull({ sx: sp.x, sy: sp.y, x: sp.x + g.dx, y: sp.y + g.dy, key: sp.key }),
    onPanResponderRelease: (_, g) => {
      const t = cfg.current.target, x = sp.x + g.dx, y = sp.y + g.dy;
      setPull(null);
      const onPaper = x > t.left && x < t.left + t.w && y > t.top && y < t.top + t.h;
      if (onPaper) cfg.current.onTie(sp.key, Math.abs(y - t.waist) < cfg.current.fy(60));
    },
    onPanResponderTerminate: () => setPull(null),
  });
  const pans = useRef(spools.map(makePan)).current;
  const len = pull ? Math.hypot(pull.x - pull.sx, pull.y - pull.sy) : 0;
  const ang = pull ? Math.atan2(pull.y - pull.sy, pull.x - pull.sx) : 0;
  const RH = 24;
  return (
    <>
      {spools.map((sp, i) => (
        <View key={i} {...pans[i].panHandlers} style={{ position: 'absolute', left: sp.x - sp.r, top: sp.y - sp.r, width: sp.r * 2, height: sp.r * 2, zIndex: 40 }}>
          <Animated.View pointerEvents="none" style={{ flex: 1, borderRadius: sp.r, borderWidth: 3, borderColor: '#fff3d6', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.7] }) }} />
        </View>
      ))}
      {pull && len > 6 && (
        <View pointerEvents="none" style={{ position: 'absolute', left: (pull.sx + pull.x) / 2 - len / 2, top: (pull.sy + pull.y) / 2 - RH / 2, width: len, height: RH, zIndex: 45, transform: [{ rotate: `${ang}rad` }] }}>
          <Image source={MAKE_IMAGES[pull.key]} style={[{ width: len, height: RH }, SOFT]} resizeMode="stretch" />
        </View>
      )}
    </>
  );
}

// The stack of paper at the top. Tap it to change the kind of paper, drag a sheet off the top
// of the stack down onto the work mat to start.
function PaperStack({ paper, chosen, level, coins, onCycle, onChoose, box, matTop, fx, fy }) {
  const ids = Object.keys(BOUQUET_PAPERS);
  const drag = useRef(new Animated.ValueXY()).current;
  const [lifted, setLifted] = useState(false);
  const cfg = useRef({});
  cfg.current = { chosen, level, coins, onCycle, onChoose, matTop, box };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setLifted(true),
    onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      setLifted(false);
      const c = cfg.current;
      const moved = Math.hypot(g.dx, g.dy);
      if (moved < 8) {
        // tap: the next paper you can use
        const usableId = (id) => coins >= BOUQUET_PAPERS[id].cost && level >= BOUQUET_PAPERS[id].level;
        let i = ids.indexOf(c.chosen);
        for (let n = 0; n < ids.length; n++) { i = (i + 1) % ids.length; if (usableId(ids[i])) { c.onCycle(ids[i]); break; } }
      } else if (c.box.y + c.box.h / 2 + g.dy > c.matTop) {
        c.onChoose();
      }
      Animated.spring(drag, { toValue: { x: 0, y: 0 }, friction: 7, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => { setLifted(false); Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(); },
  })).current;
  const info = bouquetPaper(paper);
  const gw = fx(190), gh = gw / PAPER_ASPECT;
  return (
    <>
      <View {...pan.panHandlers} style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, zIndex: 30 }} />
      {lifted && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: box.x + box.w / 2 - gw / 2, top: box.y + box.h / 2 - gh / 2, width: gw, zIndex: 60, transform: drag.getTranslateTransform() }}>
          <SheetLayers paper={paper} w={gw} h={gh} shadow />
        </Animated.View>
      )}
      <View pointerEvents="none" style={{ position: 'absolute', left: box.x, top: box.h - fy(6), width: box.w, alignItems: 'center', zIndex: 31 }}>
        <Text style={styles.stackLabel}>{info.name} paper · {info.cost > 0 ? `${info.cost} coins` : 'free'}  (tap to change)</Text>
      </View>
    </>
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
  stripName: { position: 'absolute', fontFamily: HEAD, fontSize: 17, color: '#4a2a10', zIndex: 10 },
  stripSub: { position: 'absolute', fontFamily: HEAD, fontSize: 14, color: '#7a5a30', zIndex: 10 },
  stripTip: { position: 'absolute', bottom: 0, fontFamily: HEAD, fontSize: 13, color: '#6a4a18' },
  ticket: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 10 },
  ticketBg: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  ticketTiles: { flexDirection: 'row', gap: 6, marginLeft: 6 },
  tick: { position: 'absolute', right: -3, top: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4d8a36', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f7efd2' },
  tickTxt: { color: '#f7efd2', fontSize: 10, fontWeight: 'bold' },
  ticketName: { fontFamily: HEAD, fontSize: 15, color: '#4a2a10' },
  ticketRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  ticketSub: { fontFamily: BODY, fontSize: 12.5, color: '#8a6a40' },
  ok: { color: '#3f7a2e', fontFamily: HEAD },
  ticketTxt: { fontFamily: BODY, fontSize: 13.5, color: '#5a3a1a' },
  stackLabel: { fontFamily: HEAD, fontSize: 15, color: '#fff3d6', textAlign: 'center', textShadowColor: '#2a1608', textShadowRadius: 4 },
  hint: { position: 'absolute', textAlign: 'center', fontFamily: HEAD, fontSize: 18, color: '#3a2008', textShadowColor: 'rgba(255,240,200,0.7)', textShadowRadius: 0, textShadowOffset: { width: 1, height: 1 } },
  sheet: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 3, borderWidth: 3, borderColor: 'rgba(90,52,16,0.55)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 2, height: 3 },
  },
  sheetName: { fontFamily: HEAD, fontSize: 15, color: '#4a2a10' },
  sheetCost: { fontFamily: BODY, fontSize: 13, color: '#8a5a24' },
  // a thin fold line along the cut edge of a flap
  swipe: { position: 'absolute', top: '45%', fontFamily: HEAD, fontSize: 22, color: '#5a3410' },
  prompt: { position: 'absolute', alignItems: 'center', zIndex: 10 },
  promptSub: { fontFamily: HEAD, fontSize: 14, color: '#cfe8a0', textAlign: 'center', textShadowColor: '#2a1608', textShadowRadius: 4, marginTop: 1 },
  promptTxt: { fontFamily: HEAD, fontSize: 15, lineHeight: 17, color: '#fff3d6', textAlign: 'center', textShadowColor: '#2a1608', textShadowRadius: 4 },
  bunch: { position: 'absolute' },
  plate: { position: 'absolute', left: 0, textAlign: 'center', fontFamily: HEAD, color: '#5a3a18' },
  badge: { position: 'absolute', right: -4, bottom: -4, backgroundColor: '#5a3410', borderWidth: 2, borderColor: '#2a1608', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(58,32,12,0.88)', borderWidth: 3, borderColor: '#2a1608', borderRadius: 4 },
  priceTxt: { fontFamily: HEAD, fontSize: 24, color: '#ffd060' },
  perfectRow: { position: 'absolute', left: '28%', right: '12%', top: '42%', height: '40%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  perfectCoins: { fontFamily: HEAD, fontSize: 38, color: '#4a2a10' },
  neat: { fontFamily: HEAD, fontSize: 16, color: '#cfe8a0', textShadowColor: '#2a1608', textShadowRadius: 3 },
  small: { fontFamily: BODY, fontSize: 13, color: '#fff3d6', textShadowColor: '#2a1608', textShadowRadius: 3 },
  recipeBtn: { position: 'absolute', zIndex: 30, backgroundColor: '#5a3410', borderWidth: 3, borderColor: '#2a1608', borderRadius: 4 },
});
