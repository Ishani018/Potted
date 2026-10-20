import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { BOUQUET_BG, TRADE_IMAGES, UI_IMAGES } from '../engine/assets';
import {
  TRADE_FLOWERS, BOUQUET_SIZE, BOUQUET_RECIPES, BOUQUET_PAPERS, evaluateBouquet,
} from '../constants/gameData';
import { globalPetEffects } from '../engine/petEffects';
import BouquetArt from '../components/BouquetArt';
import ScreenHud from '../components/ScreenHud';
import { PixelPanel, PixelText, PixelButton, PixelToast, COLORS } from '../components/Pixel';

// Bouquet table — a full screen on bouquetshop.png (1376×768 base). Left: pick
// your wrapping paper. Centre: the bouquet on the table. Right: secret recipes.
// Table front: your flowers + the TIE & SELL button.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const PAPER_IMG = { plain: 'bouquetempty', layered: 'bouquetmixed', fancy: 'bouquetfancy' };
const DARK = { textShadowColor: 'rgba(255,240,200,0.7)', textShadowRadius: 0, textShadowOffset: { width: 1, height: 1 } };

export default function BouquetScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const found = state.player.bouquetBook ?? {};
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [picks, setPicks] = useState([]);
  const [paper, setPaper] = useState('plain');
  const [toast, setToast] = useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

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

  const add = (key) => { if (!full && left(key) > 0) setPicks([...picks, key]); };
  const removeAt = (i) => setPicks(picks.filter((_, j) => j !== i));

  const sell = () => {
    if (!result) return;
    dispatch({ type: 'SELL_BOUQUET', flowers: picks, paper });
    showToast(isNewRecipe
      ? `NEW RECIPE: ${result.name.toUpperCase()}! +${result.value}`
      : `SOLD ${result.name.toUpperCase()} +${result.value}`);
    setPicks([]);
  };

  const foundCount = BOUQUET_RECIPES.filter((r) => found[r.id]).length;
  const art = fx(330);

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={BOUQUET_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && (
        <>
          <PixelText size={fs(26, 12)} style={[styles.title, { top: fy(46) }]}>BOUQUET TABLE</PixelText>

          {/* ── Left: choose your paper ─────────────────────────────── */}
          <PixelPanel style={{ position: 'absolute', left: fx(60), top: fy(120), width: fx(300), height: fy(340) }}>
            <PixelText size={fs(11, 7)} style={{ textAlign: 'center', marginBottom: fy(8) }}>CHOOSE PAPER</PixelText>
            <View style={{ flex: 1, gap: fy(6) }}>
              {Object.values(BOUQUET_PAPERS).map((p) => {
                const on = paper === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.85}
                    onPress={() => setPaper(p.id)}
                    style={[styles.paperCard, on && styles.paperOn]}
                  >
                    <Image source={UI_IMAGES[PAPER_IMG[p.id]]} style={{ width: fx(62), height: fy(86) }} resizeMode="contain" />
                    <View style={{ flex: 1, marginLeft: fx(10) }}>
                      <PixelText size={fs(10, 7)} color="#5a3410" style={DARK}>{p.name.toUpperCase()}</PixelText>
                      <PixelText size={fs(8, 6)} color="#8a5a24" style={[DARK, { marginTop: 5 }]}>
                        {p.bonus > 1 ? `+${Math.round((p.bonus - 1) * 100)}% VALUE` : 'BASE VALUE'}
                      </PixelText>
                    </View>
                    {on && <PixelText size={fs(12, 8)} color={COLORS.green} style={DARK}>✓</PixelText>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </PixelPanel>

          {/* ── Centre: the bouquet ─────────────────────────────────── */}
          <View style={{ position: 'absolute', left: fx(688) - art / 2, top: fy(138), width: art, alignItems: 'center' }}>
            <BouquetArt flowers={[picks[0], picks[1], picks[2]]} size={art} tier={paper} />
          </View>
          <View style={[styles.namePlate, { left: fx(688) - fx(190), width: fx(380), top: fy(486) }]}>
            <PixelText size={fs(11, 7)}>{previewName}</PixelText>
            {result && !isNewRecipe && (
              <PixelText size={fs(8, 6)} color={COLORS.gold} style={{ marginTop: 5 }}>
                x{(result.multiplier * result.paperBonus).toFixed(2)} VALUE
              </PixelText>
            )}
          </View>

          {/* ── Right: secret recipes ───────────────────────────────── */}
          <PixelPanel style={{ position: 'absolute', left: fx(1016), top: fy(120), width: fx(300), height: fy(340) }}>
            <PixelText size={fs(11, 7)} style={{ textAlign: 'center', marginBottom: fy(6) }}>RECIPES {foundCount}/{BOUQUET_RECIPES.length}</PixelText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BOUQUET_RECIPES.map((r) => {
                const got = !!found[r.id];
                return (
                  <View key={r.id} style={styles.recipe}>
                    {got ? (
                      <>
                        <PixelText size={fs(8, 6)} color="#5a3410" style={DARK}>{r.name.toUpperCase()}  x{r.multiplier}</PixelText>
                        <View style={{ flexDirection: 'row', gap: 3, marginTop: 4 }}>
                          {r.flowers.map((k, i) => (
                            <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} style={{ width: fx(26), height: fx(26) }} resizeMode="contain" />
                          ))}
                        </View>
                      </>
                    ) : (
                      <>
                        <PixelText size={fs(8, 6)} color="#a07a48" style={DARK}>???</PixelText>
                        <PixelText size={fs(7, 5)} color="#8a5a24" style={[DARK, { marginTop: 4, lineHeight: fs(11, 8) }]}>{r.hint.toUpperCase()}</PixelText>
                      </>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </PixelPanel>

          {/* ── Table front: your flowers + sell ────────────────────── */}
          <View style={[styles.tray, { left: fx(60), top: fy(584), width: fx(880), height: fy(150) }]}>
            <PixelText size={fs(9, 6)} color="#f6e2b8" style={{ marginBottom: fy(6) }}>YOUR FLOWERS - TAP TO ADD</PixelText>
            {owned.length === 0 ? (
              <PixelText size={fs(9, 6)} color="#f6e2b8">NO HARVESTED FLOWERS YET - GROW SOME FIRST!</PixelText>
            ) : (
              <View style={styles.grid}>
                {owned.map((key) => {
                  const n = left(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.75}
                      onPress={() => add(key)}
                      style={[styles.cell, { width: fx(66), height: fx(66) }, (n <= 0 || full) && { opacity: 0.4 }]}
                    >
                      <Image source={TRADE_IMAGES[TRADE_FLOWERS[key].img]} style={{ width: fx(48), height: fx(48) }} resizeMode="contain" />
                      <PixelText size={fs(8, 6)} style={styles.cellCount}>{n}</PixelText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={[styles.sellBox, { left: fx(980), top: fy(584), width: fx(336), height: fy(150) }]}>
            <View style={styles.pickRow}>
              {Array.from({ length: BOUQUET_SIZE }).map((_, i) => (
                <TouchableOpacity key={i} style={[styles.pickSlot, { width: fx(56), height: fx(56) }]} onPress={() => picks[i] && removeAt(i)} activeOpacity={0.7}>
                  {picks[i] && <Image source={TRADE_IMAGES[TRADE_FLOWERS[picks[i]].img]} style={{ width: fx(42), height: fx(42) }} resizeMode="contain" />}
                </TouchableOpacity>
              ))}
            </View>
            <PixelButton
              onPress={full ? sell : undefined}
              disabled={!full}
              size={fs(10, 7)}
              label={full ? `TIE & SELL  ${result.value}` : 'TIE & SELL'}
              style={{ alignSelf: 'stretch' }}
            />
          </View>
        </>
      )}

      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
      />
      <PixelToast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2a1608' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  title: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  paperCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8,
    backgroundColor: COLORS.cream, borderRadius: 4, borderWidth: 3, borderColor: 'transparent',
  },
  paperOn: { borderColor: COLORS.green, backgroundColor: '#fff3d6' },
  namePlate: {
    position: 'absolute', alignItems: 'center', paddingVertical: 8,
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
  },
  recipe: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(42,22,8,0.35)' },
  tray: { position: 'absolute' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    borderRadius: 4, backgroundColor: COLORS.cream, borderWidth: 3, borderColor: COLORS.creamEdge,
    alignItems: 'center', justifyContent: 'center',
  },
  cellCount: { position: 'absolute', right: 3, bottom: 1 },
  sellBox: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 12 },
  pickRow: { flexDirection: 'row', gap: 10 },
  pickSlot: {
    borderRadius: 4, backgroundColor: 'rgba(255,243,214,0.18)', borderWidth: 3,
    borderColor: 'rgba(255,243,214,0.5)', alignItems: 'center', justifyContent: 'center',
  },
});
