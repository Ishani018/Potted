import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { BOUQUET_BG, TRADE_IMAGES, UI_IMAGES } from '../engine/assets';
import {
  TRADE_FLOWERS, BOUQUET_SIZE, BOUQUET_RECIPES, BOUQUET_PAPERS, bouquetPaper, evaluateBouquet, playerLevel,
} from '../constants/gameData';
import { globalPetEffects } from '../engine/petEffects';
import BouquetArt from '../components/BouquetArt';
import ScreenHud from '../components/ScreenHud';
import CustomerCorner from '../components/CustomerCorner';
import { openOrders, bouquetFillsOrder, CUSTOMERS } from '../engine/customers';
import { PixelText, PixelButton, COLORS } from '../components/Pixel';
import { useNotice } from '../components/PurchaseNotice';

// Bouquet table — you work ON the workshop table (cosy florist bg, 1376×768 base):
//   • three paper sheets laid out on the left of the table — tap one to choose
//     (a fancier sheet raises the price but costs coins each time)
//   • the bouquet takes shape in the middle, flowers blooming from the wrapper
//   • your harvested flowers lie in a row along the front edge — tap to add
//   • tie & sell on the right (shows what you actually earn); UNDO takes the
//     last flower back
// Recipes live in the flower book (button top-right).
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const PAPER_IMG = { plain: 'bouquetempty', layered: 'bouquetmixed', fancy: 'bouquetfancy' };
const PAPER_TILT = { plain: '-5deg', layered: '0deg', fancy: '5deg' };

export default function BouquetScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const found = state.player.bouquetBook ?? {};
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [picks, setPicks] = useState([]);
  const [chosenPaper, setPaper] = useState('plain');
  const [notice, notify] = useNotice(3000);
  const coins = state.player.coins;
  const level = playerLevel(state.player);
  // If the chosen sheet is locked or you can't afford it any more, use free kraft.
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
  const previewName = !result ? 'PICK 3 FLOWERS' : isNewRecipe ? 'SOMETHING SPECIAL...' : result.name.toUpperCase();
  const foundCount = BOUQUET_RECIPES.filter((r) => found[r.id]).length;

  // A waiting customer who wants a bouquet like this one gets it instead of the market.
  const order = full ? openOrders(state.player).find((o) => bouquetFillsOrder(o, picks)) : null;
  const customerName = order ? CUSTOMERS[order.customer].name.split(' ').pop().toUpperCase() : '';
  const payout = result ? result.net + (order ? order.tip : 0) : 0;

  const add = (key) => { if (!full && left(key) > 0) setPicks([...picks, key]); };
  const sell = () => {
    if (!result) return;
    dispatch({ type: 'SELL_BOUQUET', flowers: picks, paper, customerId: order ? order.id : null });
    const earned = order ? `${customerName} paid ${payout} coins.` : `You earned ${result.net} coins.`;
    notify({
      icon: UI_IMAGES[PAPER_IMG[paper]],
      title: isNewRecipe ? `New recipe: ${result.name}!` : `Sold ${result.name}!`,
      subtitle: isNewRecipe ? `Saved to your flower book. ${earned}` : earned,
    });
    setPicks([]);
  };

  const art = fx(340);
  const rowN = Math.max(owned.length, 1);
  const gap = Math.min(fx(96), fx(700) / rowN);
  // Shrink the flower tiles when there are many so they never overlap.
  const bunchW = Math.min(fx(66), gap - fx(6));
  const bunchH = bunchW * 0.8;
  const rowW = gap * owned.length;
  const rowLeft = fx(700) - rowW / 2;

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={BOUQUET_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && (
        <>
          {/* ── Papers laid out on the table ─────────────────────────── */}
          <PixelText size={fs(10, 6)} style={[styles.label, { left: fx(250), width: fx(380), top: fy(452) }]}>CHOOSE PAPER</PixelText>
          {Object.values(BOUQUET_PAPERS).map((p, i) => {
            const on = paper === p.id;
            const locked = level < p.level;
            const cantAfford = locked || coins < p.cost;
            const cx = fx(300 + i * 130);
            return (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                onPress={cantAfford ? undefined : () => setPaper(p.id)}
                style={[
                  styles.sheet,
                  { left: cx - fx(58), top: fy(478) - (on ? fy(10) : 0), width: fx(116), height: fy(170), transform: [{ rotate: PAPER_TILT[p.id] }] },
                  on && styles.sheetOn,
                  cantAfford && { opacity: 0.45 },
                ]}
              >
                <Image source={UI_IMAGES[PAPER_IMG[p.id]]} style={{ width: fx(92), height: fy(106) }} resizeMode="contain" />
                <PixelText size={fs(8, 6)} color="#5a3410" style={styles.dark}>{p.name.toUpperCase()}</PixelText>
                {/* price of one sheet (used up each time you tie a bouquet) */}
                {locked ? (
                  <PixelText size={fs(7, 5)} color="#8a5a24" style={styles.dark}>LV {p.level}</PixelText>
                ) : p.cost > 0 ? (
                  <View style={styles.sheetCost}>
                    <Image source={UI_IMAGES.goldcoins} style={{ width: fx(14), height: fx(14) }} resizeMode="contain" />
                    <PixelText size={fs(8, 6)} color="#8a5a24" style={styles.dark}>{p.cost}</PixelText>
                  </View>
                ) : (
                  <PixelText size={fs(7, 5)} color="#8a5a24" style={styles.dark}>FREE</PixelText>
                )}
                {on && <View style={styles.tick}><PixelText size={fs(8, 6)}>✓</PixelText></View>}
              </TouchableOpacity>
            );
          })}

          {/* ── The bouquet on the table ─────────────────────────────── */}
          <View pointerEvents="none" style={{ position: 'absolute', left: fx(790) - art / 2, top: fy(300), width: art }}>
            <BouquetArt flowers={[picks[0], picks[1], picks[2]]} size={art} tier={paper} />
          </View>
          <View style={[styles.namePlate, { left: fx(790) - fx(150), width: fx(300), top: fy(640) }]}>
            <PixelText size={fs(10, 6)}>{previewName}</PixelText>
          </View>

          {/* ── Flowers along the front edge ─────────────────────────── */}
          {owned.length === 0 && (
            <PixelText size={fs(8, 6)} style={[styles.label, { left: fx(250), width: fx(700), top: fy(700) }]}>
              NO HARVESTED FLOWERS YET - GROW SOME FIRST!
            </PixelText>
          )}
          {owned.map((key, i) => {
            const n = left(key);
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.75}
                onPress={() => add(key)}
                style={[styles.bunch, { left: rowLeft + i * gap + (gap - bunchW) / 2, top: fy(704), width: bunchW, height: bunchH }, (n <= 0 || full) && { opacity: 0.4 }]}
              >
                <Image source={TRADE_IMAGES[TRADE_FLOWERS[key].img]} style={{ width: bunchW * 0.7, height: bunchW * 0.7 }} resizeMode="contain" />
                <View style={styles.badge}><PixelText size={fs(8, 6)}>{n}</PixelText></View>
              </TouchableOpacity>
            );
          })}

          {/* ── Tie & sell ───────────────────────────────────────────── */}
          <View style={{ position: 'absolute', left: fx(960), top: fy(520), width: fx(200), alignItems: 'center', gap: fy(10) }}>
            {result && (
              <View style={styles.price}>
                <Image source={UI_IMAGES.goldcoins} style={{ width: fx(24), height: fx(24) }} resizeMode="contain" />
                <PixelText size={fs(14, 8)} color={COLORS.gold}>{payout}</PixelText>
              </View>
            )}
            {/* only shown when you picked a paid paper: what the sheet costs */}
            {result && result.paperCost > 0 && (
              <PixelText size={fs(7, 5)} style={{ textAlign: 'center' }}>PAPER -{result.paperCost}</PixelText>
            )}
            <PixelButton
              onPress={full ? sell : undefined}
              disabled={!full}
              size={fs(10, 7)}
              label={order ? `FOR ${customerName}` : 'TIE & SELL'}
              style={{ alignSelf: 'stretch' }}
            />
            <PixelButton
              onPress={() => setPicks(picks.slice(0, -1))}
              disabled={picks.length === 0}
              tone="wood"
              size={fs(8, 6)}
              label="UNDO"
              style={{ alignSelf: 'stretch' }}
            />
          </View>
        </>
      )}

      {/* Recipes: the flower book's bouquet pages */}
      <TouchableOpacity
        style={[styles.recipeBtn, { right: fx(40), top: fy(100), paddingHorizontal: fx(10), paddingVertical: fy(8) }]}
        onPress={() => navigation.navigate('FlowerBook', { tab: 'bouquets' })}
        activeOpacity={0.85}
      >
        <PixelText size={fs(8, 6)}>RECIPES {foundCount}/{BOUQUET_RECIPES.length}</PixelText>
      </TouchableOpacity>

      {/* The next waiting customer (tap for their order) */}
      <CustomerCorner sw={sw} sh={sh} />

      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
      />
      {notice}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2a1608' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  label: { position: 'absolute', textAlign: 'center' },
  dark: { textShadowColor: 'rgba(255,240,200,0.7)', textShadowRadius: 0, textShadowOffset: { width: 1, height: 1 } },
  sheet: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 3,
    backgroundColor: '#f3d9a4', borderWidth: 3, borderColor: 'rgba(90,52,16,0.55)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 2, height: 3 },
  },
  sheetOn: { borderColor: COLORS.green, backgroundColor: '#fff3d6' },
  sheetCost: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tick: {
    position: 'absolute', top: -8, right: -8, backgroundColor: COLORS.green,
    borderWidth: 2, borderColor: COLORS.greenEdge, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1,
  },
  namePlate: {
    position: 'absolute', alignItems: 'center', paddingVertical: 6,
    backgroundColor: 'rgba(58,32,12,0.88)', borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
  },
  bunch: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 26,
    backgroundColor: 'rgba(255,243,214,0.88)',
  },
  badge: {
    position: 'absolute', right: -4, bottom: -4, backgroundColor: COLORS.woodDark,
    borderWidth: 2, borderColor: COLORS.woodEdge, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1,
  },
  price: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(58,32,12,0.88)', borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
  },
  recipeBtn: {
    position: 'absolute', zIndex: 30, backgroundColor: COLORS.woodDark,
    borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
  },
});
