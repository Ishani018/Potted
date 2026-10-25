import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Easing, PanResponder, Platform, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { SET_UI, BOUQUET_BG, TRADE_IMAGES, UI_IMAGES, MAKE_IMAGES, BOW_IMAGES, ORDER_ART, BOX_IMAGES, BOOK_STAMP, CUSTOMER_IMAGES, CUSTOMER_POSES } from '../engine/assets';
import {
  TRADE_FLOWERS, BOUQUET_FLOWERS, BOUQUET_SIZE, BOUQUET_RECIPES, BOUQUET_PAPERS, bouquetPaper, evaluateBouquet, playerLevel, CUSTOMERS,
  RIBBON_NAMES, orderGrade,
} from '../constants/gameData';
import { globalPetEffects } from '../engine/petEffects';
import ScreenHud from '../components/ScreenHud';
import { bouquetPic } from '../engine/bouquetPics';
import { openOrders, bouquetFillsOrder, flowerName, comboText, customerLine } from '../engine/customers';
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
  { x: 1062, y: 128, key: 'ribbonRed' }, { x: 1148, y: 128, key: 'ribbonPink' }, { x: 1226, y: 128, key: 'ribbonCream' },
  { x: 1070, y: 222, key: 'ribbonPinkFloral' }, { x: 1148, y: 222, key: 'ribbonCreamFloral' }, { x: 1230, y: 222, key: 'ribbonGreen' },
];
const PAPER_ASPECT = 700 / 617;
const RIBBON_ASPECT = 11.2;                          // the ribbon pictures are 1000×~89
const MAT = { x0: 509, y0: 251, x1: 992, y1: 588 };  // the wooden work mat
const CX = 750;                                       // centre of the sheet lying on the mat (it is painted into the picture)
const CY = 419;                                       // (the painted sheet is a little wider than it is tall; ours covers it)
const PAPER_BOX = { w: 379, h: Math.round(379 / PAPER_ASPECT) };   // the sheet once it is on the mat
PAPER_BOX.top = Math.round(CY - PAPER_BOX.h / 2);
const FLAP_TOP = PAPER_BOX.top + Math.round(0.42 * PAPER_BOX.h);   // where the ribbon waist sits; the blooms stay above
// ribbon -> the colour of bows that go with it
const BOW_COLOR = { ribbonRed: 'red', ribbonPink: 'pink', ribbonCream: 'cream', ribbonPinkFloral: 'pinkfloral', ribbonGreen: 'green', ribbonCreamFloral: 'creamfloral' };
const WRAP_ASPECT = 630 / 600;                                       // height / width of the wrapped-bouquet pictures
const WRAP_W = 330;
const WAIST = 0.79;                                                  // where the twine sits, as a fraction of the wrapper's height
const FOLD_DEG = 20;                                                // tilt of the diagonal fold lines
const TRAY = { cx: 1181, cy: 477, w: 330, h: 215 };  // the hand-over tray, bottom right
// The nine bins down the left (basket, bucket, basket ...), centres in base space; each has a name plate under it
const BINS = [
  { x: 111, y: 155 }, { x: 267, y: 155 }, { x: 421, y: 151 },
  { x: 99, y: 318 }, { x: 263, y: 322 }, { x: 412, y: 322 },
  { x: 107, y: 481 }, { x: 263, y: 481 }, { x: 420, y: 481 },
];
const BIN_D = 160;
// centre of each bin's painted name tag, in base space (same order as BINS)
const PLATES = [
  { x: 111, y: 220 }, { x: 267, y: 220 }, { x: 421, y: 220 }, { x: 103, y: 385 }, { x: 267, y: 385 }, { x: 419, y: 385 }, { x: 111, y: 545 }, { x: 265, y: 545 }, { x: 416, y: 545 },
];
const PLATE_W = 60, PLATE_H = 29;
const STRIP_SLOTS = [606, 700, 794, 888, 982];   // left edges of the five painted slots on the order strip
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

// What you were in the middle of making survives a trip to the counter: one bouquet in progress, and one box per flower order.
const SAVED = {};

export default function BouquetScreen({ navigation, route }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const found = state.player.bouquetBook ?? {};
  const [box, setBox] = useState({ w: 0, h: 0 });
  // Packing a flower order: no paper, no ribbon. Flowers go into an open box on the mat, the box closes,
  // and it goes back to the counter (route.params.pack = the order's id).
  const packId = route?.params?.pack ?? null;
  const saveKey = packId ? 'p' + packId : 'b';
  const sv = useRef(SAVED[saveKey] || {}).current;
  const [boxOut, setBoxOut] = useState(sv.boxOut ?? false);       // a flower order's box has been dragged onto the mat
  const [taken, setTaken] = useState(route?.params?.takeOrder ?? sv.taken ?? null);   // the order you took: the bouquet goes to them
  const [cardOpen, setCardOpen] = useState(null);      // the index card that is opened out
  const [boxLid, setBoxLid] = useState('open');          // 'open' | 'closing' | 'closed'
  const [step, setStep] = useState(sv.step ?? (packId ? 1 : 0));     // 0 paper .. 3 tie, 4 bow, 5 give
  const [bow, setBow] = useState(sv.bow ?? null);            // the bow on the ribbon: { color, i } into BOW_IMAGES
  const [picks, setPicks] = useState(sv.picks ?? []);
  const [chosenPaper, setPaper] = useState(sv.paper ?? 'plain');
  const [folded, setFolded] = useState({ left: false, right: false });
  const [tied, setTied] = useState(sv.tied ?? false);
  const [made, setMade] = useState(sv.made ?? false);              // the paper, flowers and ribbon have been turned into the bouquet
  const firstFold = useRef(null);               // which flap went over first (it ends up underneath)
  const [celebrate, setCelebrate] = useState(0);   // the perfect-order burst
  const [neat, setNeat] = useState(sv.neat ?? true);           // stays true while every swipe is steady
  const [binPage, setBinPage] = useState(0);
  const [ribbonKey, setRibbonKey] = useState(sv.ribbonKey ?? 'ribbonRed');
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
  // an order that names its flowers: only those can go in, and no more than it asks for
  const packOrder = packId ? (state.player.customers?.list ?? []).find((o) => o.id === packId && o.type === 'flowers') ?? null : null;
  const waiting = packOrder ? [packOrder] : openOrders(state.player).filter((o) => o.type === 'bouquet');
  const takenOrder = packOrder ? null : (waiting.find((o) => o.id === taken) ?? null);
  const wantCombo = packOrder ? null : (takenOrder?.combo ?? null);
  const remainingCombo = wantCombo ? (() => { const pool = [...picks]; return wantCombo.filter((k) => { const i = pool.indexOf(k); if (i >= 0) { pool.splice(i, 1); return false; } return true; }); })() : null;
  const needs = () => 1;                                 // any flower may go in; the order only hints at which ones
  const owned = BOUQUET_FLOWERS.filter((k) => (harvested[k] ?? 0) > 0 && TRADE_FLOWERS[k]);
  const pages = 1;
  const page = 0;
  const shown = BOUQUET_FLOWERS.filter((k) => TRADE_FLOWERS[k]);   // one fixed bucket per flower, empty until you have some
  const size = packOrder ? packOrder.qty : BOUQUET_SIZE;
  const full = picks.length === size;
  const petMult = globalPetEffects(state.player).bouquetMult;
  const result = full ? evaluateBouquet(picks, petMult, paper) : null;
  const isNewRecipe = !!result?.recipe && !found[result.recipe.id];

  // The waiting customer (if they want a bouquet) is shown as a ticket; the bouquet is
  // delivered to them when it has the flower they asked for.
  // with no order taken, it goes to whoever has waited longest: any bouquet can be handed over, right or wrong
  const want = takenOrder ?? (packOrder ? null : (waiting[0] ?? null));
  // you can hand over any bouquet: the waiting customer gets it even if it is wrong (and is angry)
  const order = full ? want : null;
  const flowersOk = !order || bouquetFillsOrder(order, picks);
  const customerName = order ? CUSTOMERS[order.customer].name : '';
  const neatBonus = result && neat ? Math.round(Math.max(0, result.net) * 0.1) : 0;
  const grade = order ? (flowersOk ? orderGrade(order, paper, ribbonKey) : { mult: 0.4, perfect: false, label: 'Not what I asked for...' }) : null;
  const payout = result ? result.net + neatBonus + (order ? Math.round(order.tip * grade.mult) : 0) : 0;

  // ── step helpers ──
  const resetAll = () => { firstFold.current = null; setStep(0); setPicks([]); setFolded({ left: false, right: false }); setTied(false); setMade(false); setNeat(true); setRibbonKey('ribbonRed'); setBow(null); setBoxOut(false); };
  const choosePaper = (id) => { setPaper(id); setStep(1); };
  const addFlower = (key) => { if (!full && left(key) > 0 && needs(key) > 0 && step === 1 && (!packOrder || boxOut)) setPicks((p) => [...p, key]); };
  const undo = () => setPicks((p) => p.slice(0, -1));
  const goFold = () => { if (full) setStep(3); };      // no folding any more: flowers, then a ribbon, then one tap makes the bouquet
  const makeBouquet = () => { if (!tied || made) return; setMade(true); setTimeout(() => setStep(4), 450); };
  // close the box and take it back to the counter
  const closeBox = () => {
    if (!full || boxLid !== 'open') return;
    setBoxLid('closing');
    setTimeout(() => setBoxLid('closed'), 380);
    setTimeout(() => {
      const given = picks;
      setPicks([]); setBoxLid('open'); setBoxOut(false);
      navigation.navigate('Counter', { deliverBox: { orderId: packOrder.id, given } });
    }, 1000);
  };
  const onFolded = (side, wasNeat) => {
    if (!wasNeat) setNeat(false);
    if (!firstFold.current) firstFold.current = side;
    const next = { ...folded, [side]: true };
    setFolded(next);
    if (next.left && next.right) setTimeout(() => setStep(3), 350);
  };
  const onTied = (wasNeat, key) => { if (!wasNeat) setNeat(false); setRibbonKey(key); setTied(true); };
  const onBow = (pick) => setBow(pick);
  // no buttons to press: each step moves on by itself once its part is done
  useEffect(() => { if (!packOrder && step === 1 && full) { const t = setTimeout(() => setStep(3), 450); return () => clearTimeout(t); } }, [step, full, packOrder]);
  useEffect(() => { if (!packOrder && step === 3 && tied && !made) { const t = setTimeout(makeBouquet, 500); return () => clearTimeout(t); } }, [step, tied, made]);
  useEffect(() => { if (step === 4 && bow != null) { const t = setTimeout(() => setStep(5), 700); return () => clearTimeout(t); } }, [step, bow]);
  useEffect(() => { if (packOrder && boxOut && full && boxLid === 'open') { const t = setTimeout(closeBox, 450); return () => clearTimeout(t); } }, [full, boxOut]);
  const giveOver = () => {
    if (!result) return;
    dispatch({ type: 'SELL_BOUQUET', flowers: picks, paper, ribbon: ribbonKey, customerId: order ? order.id : null, neat });
    setTaken(null);
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

  useEffect(() => { SAVED[saveKey] = { taken, step, picks, paper: chosenPaper, tied, made, bow, ribbonKey, neat, boxOut }; });

  const foundCount = BOUQUET_RECIPES.filter((r) => found[r.id]).length;
  const pw = fx(PAPER_BOX.w), ph = fy(PAPER_BOX.h), pLeft = fx(CX) - pw / 2, pTop = fy(PAPER_BOX.top);
  // the wrapped bouquet sits in the middle of that same box
  const ww = fx(WRAP_W), wh = ww * WRAP_ASPECT, wx = (pw - ww) / 2, wy = (ph - wh) / 2;
  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={BOUQUET_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && (
        <>
          {/* ── 0: the paper stack at the top: tap it to change paper, drag a sheet onto the mat ── */}
          {!packOrder && step === 0 && (
            <PaperPiles
              level={level} coins={coins} onPick={(id) => { setPaper(id); setStep(1); }}
              box={{ x: fx(517), y: fy(40), w: fx(442), h: fy(200) }} matTop={fy(MAT.y0)} fx={fx} fy={fy}
            />
          )}

          {/* ── the sheet on the mat: flowers, flaps, ribbon ── */}
          {packOrder && boxOut && (
            <View pointerEvents="none" style={{ position: 'absolute', left: pLeft - pw * 0.04, top: pTop + ph * 0.08, width: pw * 1.08, height: pw * 1.08 * 0.75, zIndex: 6 }}>
              <Image source={boxLid === 'open' ? BOX_IMAGES.open : boxLid === 'closing' ? BOX_IMAGES.closing : BOX_IMAGES.top} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="contain" />
              {boxLid === 'open' && picks.map((k, i) => (
                <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} resizeMode="contain" style={{ position: 'absolute', left: `${14 + i * 17}%`, top: '18%', width: '32%', height: '42%', ...SOFT }} />
              ))}
            </View>
          )}
          {/* the closed box is always there, off to the side; for a flower order, drag it onto the mat and it opens */}
          {!(packOrder && boxOut) && (
            <ClosedBox enabled={!!packOrder} rest={{ x: fx(940), y: fy(668) }} w={fx(200)} mat={{ l: fx(MAT.x0), t: fy(MAT.y0), r: fx(MAT.x1), b: fy(MAT.y1) }} onOut={() => { setBoxLid('open'); setBoxOut(true); }} />
          )}
          {!packOrder && step >= 1 && step <= 5 && (
            <HandOver
              enabled={step === 5} home={{ x: pLeft + pw / 2, y: pTop + ph / 2 }} style={{ position: 'absolute', left: pLeft, top: pTop, width: pw, height: ph }}
              tray={{ x: fx(TRAY.cx), y: fy(TRAY.cy), w: fx(TRAY.w), h: fy(TRAY.h) }} onDrop={giveOver}
            >
              {/* the flat sheet with its flowers and flaps; it fades out once both flaps are over */}
              <FadeOut hide={made}>
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
                {tied && !made && (
                  <Image source={MAKE_IMAGES[ribbonKey]} pointerEvents="none" resizeMode="stretch" style={{ position: 'absolute', left: pw * 0.04, top: ph * 0.62, width: pw * 0.92, height: pw * 0.92 / RIBBON_ASPECT * 1.5, transform: [{ rotate: '-3deg' }], zIndex: 4, ...SOFT }} />
                )}
                {false && (
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
              {made && (
                <Wrapped
                  picks={picks} art={bouquetPic(picks, paper)} reveal={true} left={wx} top={wy} w={ww} h={wh} fx={fx}
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
              target={{ left: pLeft, top: pTop, w: pw, h: ph, waist: pTop + ph * 0.66 }}
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
              key={key + i} flowerKey={key} count={left(key)} size={fx(BIN_D) * 0.72} disabled={step !== 1 || full || left(key) <= 0 || needs(key) <= 0 || (!!packOrder && !boxOut)} dim={step === 1}
              x={fx(BINS[i].x) - fx(BIN_D) * 0.36} y={fy(BINS[i].y) - fx(BIN_D) * 0.36}
              dropRight={fx(MAT.x0)} onAdd={() => addFlower(key)} fs={fs} plate={{ x: fx(PLATES[i].x), y: fy(PLATES[i].y) }} fxs={fx(1)}
            />
          ))}
          {pages > 1 && (
            <View style={{ position: 'absolute', left: fx(18), top: fy(608), zIndex: 30 }}>
              <PixelButton label={`MORE ${page + 1}/${pages}`} tone="wood" size={fs(7, 6)} onPress={() => setBinPage((page + 1) % pages)} />
            </View>
          )}

          {/* the orders waiting, as index cards along the bottom; tap one to open it out and take it */}
          <OrderCards
            fx={fx} fy={fy} fs={fs} orders={waiting} takenId={packOrder ? packOrder.id : taken} openId={cardOpen}
            packOrder={packOrder} onOpen={setCardOpen} onTake={(id) => { setTaken(id); setCardOpen(null); }} onDrop={() => { setTaken(null); setCardOpen(null); }}
            progress={{ picks, paper, step, tied, ribbonKey, bow, remainingCombo, full }}
          />

          {/* buttons, right column (beside the scissors) */}
          <View style={{ position: 'absolute', left: fx(1070), top: fy(604), width: fx(250), alignItems: 'center', gap: fy(4), zIndex: 30 }}>
            {((packOrder && boxOut) || (!packOrder && step === 1)) && (
              <PixelButton onPress={undo} disabled={picks.length === 0 || boxLid !== 'open'} tone="wood" size={fs(7, 6)} scale={0.7} label="UNDO" style={{ alignSelf: 'stretch' }} />
            )}
          </View>
          {/* the bin: tap it to throw the bouquet away and start again */}
          {!packOrder && step > 0 && step < 5 && <TrashBin onPress={resetAll} w={fx(70)} style={{ position: 'absolute', left: fx(1195), top: fy(656), zIndex: 30 }} />}
        </>
      )}

      {/* Recipes: the garden journal's bouquet pages */}
      <View style={{ position: 'absolute', left: fx(18), top: fy(706), zIndex: 30 }}>
        <PixelButton tone="wood" size={fs(6, 5)} scale={0.8} label={`RECIPES ${foundCount}/${BOUQUET_RECIPES.length}`} onPress={() => navigation.navigate('FlowerBook', { tab: 'bouquets' })} />
      </View>
      <View style={{ position: 'absolute', left: fx(18), top: fy(660), zIndex: 30 }}>
        <PixelButton tone="wood" size={fs(6, 5)} scale={0.8} label="< COUNTER" onPress={() => navigation.navigate('Counter')} />
      </View>

      {/* no settings button or level badge here: they would sit on top of the flower bins */}
      {celebrate > 0 && <Celebration fx={fx} fy={fy} coins={celebrate} />}
      <ScreenHud sw={sw} sh={sh} onMap={() => navigation.navigate('Map')} />
      {notice}
    </View>
  );
}

// The orders waiting, as index cards along the bottom of the table. Tap a card to open it out; "Take order" makes the
// bouquet you are making go to that customer. A taken order's list ticks off as you get each part right.
function orderItems(o, pr, active) {
  const ok = (v) => active && v;
  if (o.type === 'flowers') {
    return [{ cluster: Array(o.qty).fill(o.flowerKey), label: comboText({ combo: Array(o.qty).fill(o.flowerKey) }), ok: ok(pr.full && pr.picks.every((k) => k === o.flowerKey)) }];
  }
  return [
    { cluster: o.combo, src: TRADE_IMAGES[TRADE_FLOWERS[o.flowerKey]?.img], label: o.combo ? comboText(o) : `${flowerName(o.flowerKey)} bouquet`, ok: ok(o.combo ? !!pr.remainingCombo && pr.remainingCombo.length === 0 : pr.picks.includes(o.flowerKey)) },
    o.paper && { src: { plain: MAKE_IMAGES.paper, layered: MAKE_IMAGES.wrapLayered }[o.paper] || MAKE_IMAGES.paper, label: `${BOUQUET_PAPERS[o.paper]?.name ?? 'Plain'} paper`, ok: ok(pr.step >= 1 && pr.paper === o.paper) },
    o.ribbon && { src: MAKE_IMAGES[o.ribbon.replace('ribbon', 'spool')], label: `${RIBBON_NAMES[o.ribbon] ?? 'A'} ribbon`, ok: ok(pr.tied && pr.ribbonKey === o.ribbon) },
    o.ribbon && { src: (BOW_IMAGES[BOW_COLOR[o.ribbon]] || [])[0], label: 'A bow on it', ok: ok(pr.bow != null && pr.bow.color === BOW_COLOR[o.ribbon]) },
  ].filter(Boolean);
}

function OrderCards({ fx, fy, fs, orders, takenId, openId, packOrder, onOpen, onTake, onDrop, progress }) {
  const open = orders.find((o) => o.id === openId) || null;
  const face = (c) => ((CUSTOMER_POSES[c] || {}).think || CUSTOMER_IMAGES[c]);
  const portrait = (c, d) => (
    <View style={{ width: d, height: d, borderRadius: d / 2, overflow: 'hidden', backgroundColor: '#e8cf9a', borderWidth: 2, borderColor: '#b98a4e' }}>
      <Image source={face(c)} style={{ position: 'absolute', width: d * 1.9, height: d * 2.85, left: -d * 0.45, top: -d * 0.55 }} resizeMode="contain" />
    </View>
  );
  return (
    <>
      {orders.map((o, i) => {
        const active = o.id === takenId;
        const items = orderItems(o, progress, active);
        return (
          <TouchableOpacity key={o.id} activeOpacity={0.9} onPress={() => onOpen(o.id)}
            style={[styles.card, active && styles.cardOn, { left: fx(236 + i * 196), top: fy(618 + (i % 2) * 4), width: fx(184), height: fy(124), transform: [{ rotate: `${(i % 2 ? 1.4 : -1.4)}deg` }] }]}>
            <View style={styles.cardRed} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: fx(8), marginTop: fy(8) }}>
              {portrait(o.customer, fx(50))}
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { fontSize: fs(16, 11) }]} numberOfLines={1}>{CUSTOMERS[o.customer].name.replace('Gardener ', '')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Image source={UI_IMAGES.goldcoins} style={{ width: fx(16), height: fx(16) }} resizeMode="contain" />
                  <Text style={[styles.cardSub, { fontSize: fs(14, 10) }]}>{o.type === 'flowers' ? o.coins : `+${o.tip}`}</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: fx(4), marginTop: fy(8), alignItems: 'center' }}>
              {items.slice(0, 4).map((it, k) => (
                <View key={k} style={{ width: fx(30), height: fx(30), alignItems: 'center', justifyContent: 'center' }}>
                  {it.cluster ? <FlowerCluster keys={it.cluster} size={fx(30)} /> : <Image source={it.src} style={{ width: fx(28), height: fx(28) }} resizeMode="contain" />}
                  {it.ok && <Image source={BOOK_STAMP} style={{ position: 'absolute', right: -fx(5), top: -fx(5), width: fx(16), height: fx(16) }} resizeMode="contain" />}
                </View>
              ))}
            </View>
            {active && <Image source={BOOK_STAMP} style={{ position: 'absolute', right: fx(6), top: fy(10), width: fx(30), height: fx(30) }} resizeMode="contain" />}
          </TouchableOpacity>
        );
      })}
      {orders.length === 0 && (
        <View pointerEvents="none" style={[styles.card, { left: fx(236), top: fy(618), width: fx(184), height: fy(124), opacity: 0.45, borderStyle: 'dashed' }]}>
          <View style={styles.cardRed} />
        </View>
      )}

      {open && (
        <TouchableOpacity activeOpacity={1} onPress={() => onOpen(null)} style={styles.cardDim}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.cardBig, { width: fx(640), transform: [{ rotate: '-0.8deg' }] }]}>
            <View style={styles.cardRed} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: fx(14), marginTop: fy(10) }}>
              {portrait(open.customer, fx(84))}
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { fontSize: fs(28, 16) }]}>{CUSTOMERS[open.customer].name}</Text>
                <Text style={[styles.cardSub, { fontSize: fs(17, 12) }]} numberOfLines={2}>{customerLine(open, 'short')}</Text>
              </View>
              <TouchableOpacity onPress={() => onOpen(null)} activeOpacity={0.8}><Image source={SET_UI.close.src} style={{ width: 32, height: 31 }} resizeMode="contain" /></TouchableOpacity>
            </View>
            <View style={{ marginTop: fy(12) }}>
              {orderItems(open, progress, open.id === takenId).map((it, k) => (
                <View key={k} style={styles.cardRow}>
                  <View style={{ width: fx(46), height: fx(46), alignItems: 'center', justifyContent: 'center' }}>
                    {it.cluster ? <FlowerCluster keys={it.cluster} size={fx(46)} /> : <Image source={it.src} style={{ width: fx(44), height: fx(44) }} resizeMode="contain" />}
                  </View>
                  <Text style={[styles.cardRowTxt, { fontSize: fs(19, 12) }]} numberOfLines={1}>{it.label}</Text>
                  {it.ok && <Image source={BOOK_STAMP} style={{ width: fx(28), height: fx(28) }} resizeMode="contain" />}
                </View>
              ))}
              <View style={styles.cardRow}>
                <Image source={UI_IMAGES.goldcoins} style={{ width: fx(30), height: fx(30), marginHorizontal: fx(8) }} resizeMode="contain" />
                <Text style={[styles.cardRowTxt, { fontSize: fs(19, 12), color: '#a8700a' }]}>{open.type === 'flowers' ? `${open.coins} coins` : `a tip of up to ${Math.round(open.tip * 1.5)}`}</Text>
                <Text style={[styles.cardSub, { fontSize: fs(16, 11) }]}>+{open.xp} xp</Text>
              </View>
            </View>
            {!packOrder && (
              <View style={{ alignItems: 'flex-end', marginTop: fy(10) }}>
                {open.id === takenId
                  ? <PixelButton label="Put it back" tone="wood" size={fs(8, 7)} onPress={onDrop} />
                  : <PixelButton label="Take this order" size={fs(8, 7)} onPress={() => onTake(open.id)} />}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </>
  );
}

// A shower of blossoms and leaves with a banner when an order is perfect.
export function Celebration({ fx, fy, coins }) {
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

// the flowers an order asks for, as a little cluster of icons (the finished bouquet stays a surprise)
export function FlowerCluster({ keys, size }) {
  const n = keys.length;
  const d = size * (n > 2 ? 0.58 : 0.7);
  const spots = n > 2 ? [[0.02, 0.02], [0.4, 0.02], [0.21, 0.4]] : n === 2 ? [[0.0, 0.15], [0.3, 0.15]] : [[0.15, 0.15]];
  return (
    <View style={{ width: size, height: size }}>
      {keys.map((k, i) => (
        <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k]?.img]} resizeMode="contain"
          style={{ position: 'absolute', left: size * spots[i % spots.length][0], top: size * spots[i % spots.length][1], width: d, height: d }} />
      ))}
    </View>
  );
}

// The ribbon you cut, rolled up into a coil: the ribbon's own colour in rings round a dark centre.
function RibbonCoil({ source, style }) {
  return (
    <View style={[style, { alignItems: 'center', justifyContent: 'center' }, SOFT]}>
      <View style={{ width: '100%', aspectRatio: 1, maxHeight: '100%', borderRadius: 999, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(60,34,12,0.55)' }}>
        <Image source={source} resizeMode="stretch" style={{ position: 'absolute', width: '100%', height: '100%' }} />
        {[0.78, 0.58, 0.38].map((r, i) => (
          <View key={i} style={{ position: 'absolute', left: `${(1 - r) * 50}%`, top: `${(1 - r) * 50}%`, width: `${r * 100}%`, height: `${r * 100}%`, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(60,34,12,0.32)' }} />
        ))}
        <View style={{ position: 'absolute', left: '36%', top: '36%', width: '28%', height: '28%', borderRadius: 999, backgroundColor: 'rgba(48,26,8,0.85)' }} />
      </View>
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
function Wrapped({ art, reveal, picks, left, top, w, h, ribbon, bow, fx }) {
  const o = useRef(new Animated.Value(0)).current;
  React.useEffect(() => { if (!reveal) { Animated.timing(o, { toValue: 1, duration: 380, useNativeDriver: false }).start(); } }, []);
  // the finished bouquet is only shown at the very end: a short pop when it is revealed
  const pop = useRef(new Animated.Value(reveal ? 0 : 1)).current;
  React.useEffect(() => { if (reveal) { o.setValue(1); Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: false }).start(); } }, [reveal]);
  const rw = w * 0.2, rh = w * 0.075, wy = top + h * WAIST + w * 0.01;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: o }}>
      <View style={{ position: 'absolute', left: left + w * 0.18, top: top + h * 0.9, width: w * 0.64, height: h * 0.12, borderRadius: w, backgroundColor: 'rgba(60,30,8,0.28)', ...(Platform.OS === 'web' ? { filter: 'blur(7px)' } : {}) }} />
      <Animated.Image source={art} style={[{ position: 'absolute', left, top, width: w, height: h, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }, SOFT]} resizeMode="contain" />
      {/* before the reveal the blooms you picked peek out of the wrapper's opening (cut off at its rim) */}
      {!reveal && (
        <View pointerEvents="none" style={{ position: 'absolute', left: left - w * 0.1, top: top - h * 0.2, width: w * 1.2, height: h * 0.2 + h * 0.3, overflow: 'hidden', zIndex: 2 }}>
          {picks.map((k, i) => {
            const pos = [{ x: 0.34, y: 0.2, r: '-14deg' }, { x: 0.66, y: 0.2, r: '14deg' }, { x: 0.5, y: 0.1, r: '0deg' }][i % 3];
            const fz = w * 0.4;
            return <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} resizeMode="contain"
              style={[{ position: 'absolute', left: w * 0.1 + w * pos.x - fz / 2, top: h * 0.2 + h * (pos.y - 0.02) - fz / 2, width: fz, height: fz, transform: [{ rotate: pos.r }], zIndex: i === 2 ? 3 : 2 }, SOFT]} />;
          })}
        </View>
      )}
      {ribbon && <TiedRibbon x={left + (w - rw) / 2} y={wy} w={rw} h={rh} source={ribbon} />}
      {bow && <Image source={bow} resizeMode="contain" style={[{ position: 'absolute', left: left + w * 0.5 - fx(58), top: wy - fx(42), width: fx(116), height: fx(88), zIndex: 9 }, SOFT]} />}
    </Animated.View>
  );
}

function TrashBin({ onPress, w, style }) {
  const [hot, setHot] = useState(false);
  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={() => setHot(true)} onPressOut={() => setHot(false)} style={[{ width: w, height: w * 1.1, alignItems: 'center', justifyContent: 'flex-end' }, style]}>
      <Image source={hot ? UI_IMAGES.trashopen : UI_IMAGES.trashclosed} resizeMode="contain" style={{ width: w, height: w * 1.1 }} />
    </TouchableOpacity>
  );
}

// The closed box for a flower order, resting below the mat: drag it onto the mat to open it.
function ClosedBox({ rest, w, mat, onOut, enabled }) {
  const drag = useRef(new Animated.ValueXY()).current;
  const cfg = useRef({});
  cfg.current = { rest, mat, onOut, enabled };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => cfg.current.enabled,
    onMoveShouldSetPanResponder: () => cfg.current.enabled,
    onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      const { rest: r, mat: m, onOut: out } = cfg.current;
      const x = r.x + g.dx, y = r.y + g.dy;
      if (Math.hypot(g.dx, g.dy) < 8 || (x > m.l && x < m.r && y > m.t && y < m.b)) out();
      else Animated.spring(drag, { toValue: { x: 0, y: 0 }, friction: 7, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
  })).current;
  const h = w * 235 / 383;
  return (
    <Animated.View {...pan.panHandlers} pointerEvents={enabled ? 'auto' : 'none'} style={{ position: 'absolute', left: rest.x - w / 2, top: rest.y - h / 2, width: w, height: h, zIndex: 40, transform: drag.getTranslateTransform() }}>
      <Image source={BOX_IMAGES.top} resizeMode="contain" style={[{ width: w, height: h }, SOFT]} />
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

function Bunch({ flowerKey, count, size, disabled, dim = true, x, y, dropRight, onAdd, fs, plate, fxs }) {
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
  const n = Math.min(count, 4);   // a tidy heap, not a spilling one
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
      <View pointerEvents="none" style={[styles.plate, { left: plate.x - x - PLATE_W / 2 * fxs, top: plate.y - y - PLATE_H / 2 * fxs, width: PLATE_W * fxs, height: PLATE_H * fxs }]}>
        <Image source={src} resizeMode="contain" style={{ width: PLATE_H * 0.62 * fxs, height: PLATE_H * 0.62 * fxs, marginRight: 4 * fxs }} />
        <Text style={{ fontFamily: HEAD, color: '#5a3a18', fontSize: 14 * fxs }}>{count}</Text>
      </View>
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

// The papers lie in piles at the top, one pile per kind (kraft; kraft with the flowered sheet on top). Drag a sheet off
// whichever pile you like onto the work mat: it is up to you whether it is the one the order asked for.
const PILES = [
  { id: 'plain', sheets: [{ k: 'paper', dx: -7, dy: 7, r: -5 }, { k: 'paper', dx: 5, dy: 4, r: 3 }, { k: 'paper', dx: 0, dy: 0, r: -1 }] },
  { id: 'layered', sheets: [{ k: 'paper', dx: -6, dy: 7, r: 4 }, { k: 'paperFancy', dx: 5, dy: 3, r: -3 }, { k: 'paperFancy', dx: 0, dy: 0, r: 1 }] },
];
function PaperPile({ pile, cx, cy, w, h, ok, matTop, onPick, fx, fy }) {
  const info = bouquetPaper(pile.id);
  const drag = useRef(new Animated.ValueXY()).current;
  const [lifted, setLifted] = useState(false);
  const [tip, setTip] = useState(false);
  const cfg = useRef({});
  cfg.current = { ok, matTop, cy, onPick };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { if (cfg.current.ok) setLifted(true); },
    onPanResponderMove: (_, g) => { if (cfg.current.ok) drag.setValue({ x: g.dx, y: g.dy }); },
    onPanResponderRelease: (_, g) => {
      setLifted(false);
      const c = cfg.current;
      if (!c.ok || Math.hypot(g.dx, g.dy) < 8) { setTip(true); setTimeout(() => setTip(false), 1400); }
      else if (c.cy + g.dy > c.matTop) c.onPick(pile.id);
      Animated.spring(drag, { toValue: { x: 0, y: 0 }, friction: 7, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => { setLifted(false); Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(); },
  })).current;
  const L = cx - w / 2, T = cy - h / 2;
  return (
    <>
      <View {...pan.panHandlers} style={{ position: 'absolute', left: L, top: T, width: w, height: h + fy(18), zIndex: 30, opacity: ok ? 1 : 0.55 }}>
        {pile.sheets.map((sh, i) => (
          <Image key={i} source={MAKE_IMAGES[sh.k]} resizeMode="stretch" pointerEvents="none"
            style={[{ position: 'absolute', left: sh.dx, top: sh.dy, width: w, height: h, transform: [{ rotate: `${sh.r}deg` }] }, SOFT]} />
        ))}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: h - fy(2), alignItems: 'center' }}>
          <Text style={styles.stackLabel}>{info.name}{!ok ? `  (level ${info.level})` : info.cost > 0 ? `  ·  ${info.cost}` : ''}</Text>
        </View>
      </View>
      {lifted && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: cx - w * 0.5, top: cy - h * 0.5, width: w, zIndex: 60, transform: drag.getTranslateTransform() }}>
          <SheetLayers paper={pile.id} w={w * 1.1} h={h * 1.1} shadow />
        </Animated.View>
      )}
    </>
  );
}
function PaperPiles({ level, coins, onPick, box, matTop, fx, fy }) {
  const w = fx(168), h = w / PAPER_ASPECT;
  return PILES.map((pile, i) => {
    const info = bouquetPaper(pile.id);
    return (
      <PaperPile key={pile.id} pile={pile} cx={box.x + box.w * (i === 0 ? 0.26 : 0.74)} cy={box.y + box.h * 0.46} w={w} h={h}
        ok={coins >= info.cost && level >= info.level} matTop={matTop} onPick={onPick} fx={fx} fy={fy} />
    );
  });
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
  card: { position: 'absolute', zIndex: 12, backgroundColor: '#fdf3d6', borderWidth: 2, borderColor: '#b98a4e', borderRadius: 6, paddingHorizontal: 10, overflow: 'hidden' },
  cardOn: { borderColor: '#2f5a22', borderWidth: 3 },
  cardRed: { position: 'absolute', left: 0, right: 0, top: 0, height: 5, backgroundColor: '#c0553a' },
  cardName: { fontFamily: HEAD, fontWeight: 'bold', color: '#4a2a10' },
  cardSub: { fontFamily: HEAD, color: '#7a5030' },
  cardDim: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 70, backgroundColor: 'rgba(30,18,6,0.55)', alignItems: 'center', justifyContent: 'center' },
  cardBig: { backgroundColor: '#fdf3d6', borderWidth: 3, borderColor: '#b98a4e', borderRadius: 10, padding: 18, paddingTop: 22, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#e2cb98' },
  cardRowTxt: { flex: 1, fontFamily: HEAD, color: '#4a2a10' },
  stripBoard: { position: 'absolute', backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 16, zIndex: 8 },
  stripRing: { position: 'absolute', borderRadius: 100, backgroundColor: '#e8cf9a', borderWidth: 3, borderColor: '#b98a4e' },
  stripName: { position: 'absolute', fontFamily: HEAD, fontSize: 17, color: '#4a2a10', zIndex: 10 },
  stripSub: { position: 'absolute', fontFamily: HEAD, fontSize: 13, lineHeight: 14, color: '#7a5a30', zIndex: 10 },
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
  plate: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -4, bottom: -4, backgroundColor: '#f3e0b6', borderWidth: 2, borderColor: '#8a5a2a', borderRadius: 9, paddingHorizontal: 4, paddingVertical: 1 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 14 },
  priceTxt: { fontFamily: HEAD, fontSize: 24, color: '#ffd060' },
  perfectRow: { position: 'absolute', left: '28%', right: '12%', top: '42%', height: '40%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  perfectCoins: { fontFamily: HEAD, fontSize: 38, color: '#4a2a10' },
  neat: { fontFamily: HEAD, fontSize: 16, color: '#cfe8a0', textShadowColor: '#2a1608', textShadowRadius: 3 },
  small: { fontFamily: BODY, fontSize: 13, color: '#fff3d6', textShadowColor: '#2a1608', textShadowRadius: 3 },
  recipeBtn: { position: 'absolute', zIndex: 30, backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 14 },
});
