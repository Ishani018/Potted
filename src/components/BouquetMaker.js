import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_IMAGES, UI_IMAGES } from '../engine/assets';
import { TRADE_FLOWERS, BOUQUET_SIZE, BOUQUET_RECIPES, evaluateBouquet } from '../constants/gameData';
import BouquetArt from './BouquetArt';
import { globalPetEffects } from '../engine/petEffects';
import { PixelPanel, PixelText, PixelButton, COLORS } from './Pixel';

// Bouquet table (market). Pick BOUQUET_SIZE harvested flowers, see the bouquet
// and its price, then tie & sell. Secret recipes pay more; unfound ones show a
// hint. onSold(message) lets the parent show a toast.
export default function BouquetMaker({ onClose, onSold }) {
  const { state, dispatch } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const found = state.player.bouquetBook ?? {};
  const [picks, setPicks] = useState([]);

  // Flowers still available after the current picks.
  const left = (key) => (harvested[key] ?? 0) - picks.filter((k) => k === key).length;
  const owned = Object.keys(harvested).filter((k) => harvested[k] > 0 && TRADE_FLOWERS[k]);

  const full = picks.length === BOUQUET_SIZE;
  const result = full ? evaluateBouquet(picks, globalPetEffects(state.player).bouquetMult) : null;
  // Recipes stay secret until you've tied one at least once.
  const isNewRecipe = result?.recipe && !found[result.recipe.id];
  const isTrio = !!result && !result.recipe && picks.every((k) => k === picks[0]);
  const tier = result?.recipe ? 'fancy' : isTrio ? 'layered' : 'plain';
  const previewName = !result ? 'PICK 3 FLOWERS' : isNewRecipe ? 'SOMETHING SPECIAL...' : result.name.toUpperCase();

  const add = (key) => { if (!full && left(key) > 0) setPicks([...picks, key]); };
  const removeAt = (i) => setPicks(picks.filter((_, j) => j !== i));

  const sell = () => {
    if (!result) return;
    dispatch({ type: 'SELL_BOUQUET', flowers: picks });
    onSold && onSold(isNewRecipe
      ? `New recipe: ${result.name}! +${result.value} coins`
      : `Sold ${result.name} · +${result.value} coins`);
    setPicks([]);
  };

  const foundCount = BOUQUET_RECIPES.filter((r) => found[r.id]).length;
  const DARK = { textShadowColor: 'rgba(255,240,200,0.7)', textShadowRadius: 0, textShadowOffset: { width: 1, height: 1 } };

  return (
    <View style={styles.overlay}>
      <PixelPanel style={styles.panel}>
        <View style={styles.header}>
          <PixelText size={13}>BOUQUET TABLE</PixelText>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
            <Image source={UI_IMAGES.cancelbutton} style={styles.closeImg} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <View style={styles.cols}>
          {/* ── Left: the bouquet being made ─────────────────────────── */}
          <PixelPanel cream style={styles.colLeft}>
            <BouquetArt flowers={[picks[0], picks[1], picks[2]]} size={170} tier={tier} />
            <PixelText size={9} color="#5a3410" style={[DARK, { textAlign: 'center', marginTop: 2 }]}>{previewName}</PixelText>
            {result && !isNewRecipe && (
              <PixelText size={7} color="#8a5a24" style={[DARK, { marginTop: 4 }]}>x{result.multiplier} VALUE</PixelText>
            )}
            <View style={styles.pickRow}>
              {Array.from({ length: BOUQUET_SIZE }).map((_, i) => (
                <TouchableOpacity key={i} style={styles.pickSlot} onPress={() => picks[i] && removeAt(i)} activeOpacity={0.7}>
                  {picks[i] && (
                    <Image source={TRADE_IMAGES[TRADE_FLOWERS[picks[i]].img]} style={styles.pickImg} resizeMode="contain" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <PixelButton
              onPress={full ? sell : undefined}
              disabled={!full}
              label={full ? `TIE & SELL  ${result.value}` : 'TIE & SELL'}
              size={9}
            />
          </PixelPanel>

          {/* ── Right: flowers + recipes ─────────────────────────────── */}
          <PixelPanel cream style={styles.colRight}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
              <PixelText size={9} color="#5a3410" style={DARK}>YOUR FLOWERS</PixelText>
              {owned.length === 0 ? (
                <PixelText size={7} color="#8a5a24" style={[DARK, { marginVertical: 10 }]}>NO HARVESTED FLOWERS YET</PixelText>
              ) : (
                <View style={styles.grid}>
                  {owned.map((key) => {
                    const n = left(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.cell, (n <= 0 || full) && styles.cellDim]}
                        onPress={() => add(key)}
                        activeOpacity={0.75}
                      >
                        <Image source={TRADE_IMAGES[TRADE_FLOWERS[key].img]} style={styles.cellImg} resizeMode="contain" />
                        <PixelText size={8} style={styles.cellCount}>{n}</PixelText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* The three papers, fancier each step */}
              <PixelText size={9} color="#5a3410" style={[DARK, { marginTop: 8 }]}>PAPERS</PixelText>
              <View style={styles.tiers}>
                {[
                  ['bouquetempty', 'MIXED', 'x1.1', 'plain'],
                  ['bouquetmixed', '3 ALIKE', 'x1.3', 'layered'],
                  ['bouquetfancy', 'SECRET', 'x1.6+', 'fancy'],
                ].map(([img, name, mult, id]) => (
                  <View key={id} style={[styles.tier, tier === id && !!result && styles.tierOn]}>
                    <Image source={UI_IMAGES[img]} style={styles.tierImg} resizeMode="contain" />
                    <PixelText size={7} color="#5a3410" style={DARK}>{name}</PixelText>
                    <PixelText size={7} color="#8a5a24" style={DARK}>{mult}</PixelText>
                  </View>
                ))}
              </View>

              <PixelText size={9} color="#5a3410" style={[DARK, { marginTop: 8, marginBottom: 4 }]}>SECRET RECIPES {foundCount}/{BOUQUET_RECIPES.length}</PixelText>
              {BOUQUET_RECIPES.map((r) => {
                const got = !!found[r.id];
                return (
                  <View key={r.id} style={styles.recipe}>
                    <PixelText size={7} color={got ? '#5a3410' : '#a07a48'} style={[DARK, { width: 108 }]}>
                      {got ? `${r.name.toUpperCase()} x${r.multiplier}` : '???'}
                    </PixelText>
                    {got ? (
                      <View style={styles.recipeFlowers}>
                        {r.flowers.map((k, i) => (
                          <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} style={styles.recipeImg} resizeMode="contain" />
                        ))}
                      </View>
                    ) : (
                      <PixelText size={7} color="#8a5a24" style={[DARK, { flex: 1, lineHeight: 11 }]}>{r.hint.toUpperCase()}</PixelText>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </PixelPanel>
        </View>
      </PixelPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  panel: { width: '92%', maxWidth: 760, height: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 8 },
  closeImg: { width: 34, height: 34 },
  cols: { flex: 1, flexDirection: 'row', gap: 10 },

  colLeft: { width: '40%', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  colRight: { flex: 1, padding: 8 },

  pickRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  pickSlot: {
    width: 42, height: 42, borderRadius: 4, backgroundColor: '#fff3d6',
    borderWidth: 3, borderColor: COLORS.creamEdge, alignItems: 'center', justifyContent: 'center',
  },
  pickImg: { width: 32, height: 32 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  cell: {
    width: 46, height: 46, borderRadius: 4, backgroundColor: '#fff3d6',
    borderWidth: 3, borderColor: COLORS.creamEdge, alignItems: 'center', justifyContent: 'center',
  },
  cellDim: { opacity: 0.4 },
  cellImg: { width: 34, height: 34 },
  cellCount: { position: 'absolute', right: 2, bottom: 0 },

  tiers: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tier: {
    flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  tierOn: { borderColor: COLORS.green, backgroundColor: 'rgba(61,122,42,0.15)' },
  tierImg: { width: 44, height: 48 },

  recipe: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(184,121,58,0.5)', paddingVertical: 5,
  },
  recipeFlowers: { flexDirection: 'row', gap: 2 },
  recipeImg: { width: 22, height: 22 },
});
