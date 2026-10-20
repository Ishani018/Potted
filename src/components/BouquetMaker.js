import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_IMAGES, UI_IMAGES } from '../engine/assets';
import { TRADE_FLOWERS, BOUQUET_SIZE, BOUQUET_RECIPES, evaluateBouquet } from '../constants/gameData';
import BouquetArt from './BouquetArt';

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
  const result = full ? evaluateBouquet(picks) : null;
  // Recipes stay secret until you've tied one at least once.
  const isNewRecipe = result?.recipe && !found[result.recipe.id];
  const previewName = !result ? 'Pick 3 flowers' : isNewRecipe ? 'Something special…' : result.name;

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

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <TouchableOpacity style={styles.close} onPress={onClose}>
          <Image source={UI_IMAGES.cancelbutton} style={styles.closeImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* ── Left: the bouquet being made ───────────────────────────── */}
        <View style={styles.colLeft}>
          <Text style={styles.title}>Bouquet Table</Text>
          <BouquetArt flowers={[picks[0], picks[1], picks[2]]} size={120} />
          <Text style={styles.previewName}>{previewName}</Text>
          {/* Picked flowers — tap to put back */}
          <View style={styles.pickRow}>
            {Array.from({ length: BOUQUET_SIZE }).map((_, i) => (
              <TouchableOpacity key={i} style={styles.pickSlot} onPress={() => picks[i] && removeAt(i)} activeOpacity={0.7}>
                {picks[i] && (
                  <Image source={TRADE_IMAGES[TRADE_FLOWERS[picks[i]].img]} style={styles.pickImg} resizeMode="contain" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.sellBtn, !full && styles.sellBtnDim]}
            onPress={full ? sell : undefined}
            activeOpacity={0.8}
          >
            <Image source={UI_IMAGES.goldcoins} style={styles.coin} resizeMode="contain" />
            <Text style={styles.sellTxt}>{full ? `Tie & sell · ${result.value}` : 'Tie & sell'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Right: flowers to choose from + recipe hints ───────────── */}
        <ScrollView style={styles.colRight} contentContainerStyle={{ paddingBottom: 8 }}>
          <Text style={styles.section}>Your flowers</Text>
          {owned.length === 0 ? (
            <Text style={styles.empty}>No harvested flowers yet. Grow & harvest some first!</Text>
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
                    <Text style={styles.cellCount}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.section}>Secret recipes · {foundCount}/{BOUQUET_RECIPES.length}</Text>
          {BOUQUET_RECIPES.map((r) => {
            const got = !!found[r.id];
            return (
              <View key={r.id} style={styles.recipe}>
                <Text style={[styles.recipeName, !got && styles.recipeHidden]}>
                  {got ? `${r.name} ×${r.multiplier}` : '???'}
                </Text>
                {got ? (
                  <View style={styles.recipeFlowers}>
                    {r.flowers.map((k, i) => (
                      <Image key={i} source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} style={styles.recipeImg} resizeMode="contain" />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.hint}>{r.hint}</Text>
                )}
              </View>
            );
          })}
          <Text style={styles.footnote}>Any 3 flowers make a Mixed Bouquet (×1.1). Three of the same flower: ×1.3.</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  panel: {
    flexDirection: 'row', width: '88%', maxWidth: 680, height: '86%',
    backgroundColor: '#2a1608', borderRadius: 16, borderWidth: 2, borderColor: '#c8873a',
    padding: 14, gap: 14,
  },
  close: { position: 'absolute', top: 8, right: 10, zIndex: 5 },
  closeImg: { width: 64, height: 30 },

  colLeft: { width: '42%', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'PressStart2P', fontSize: 11, color: '#ffe8a0', marginBottom: 6 },
  previewName: { color: '#ffe8a0', fontSize: 14, fontWeight: 'bold', marginTop: 4, marginBottom: 6, textAlign: 'center' },
  pickRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  pickSlot: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#3d2810', borderWidth: 1.5, borderColor: '#7a4a18',
    alignItems: 'center', justifyContent: 'center',
  },
  pickImg: { width: 32, height: 32 },
  sellBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3d6020', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#70a840',
  },
  sellBtnDim: { backgroundColor: '#2a2a1a', borderColor: '#555' },
  coin: { width: 16, height: 16 },
  sellTxt: { color: '#e0ffc0', fontSize: 13, fontWeight: 'bold' },

  colRight: { flex: 1, marginTop: 30 },
  section: { color: '#b89a6a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  empty: { color: '#b89a6a', fontSize: 12, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  cell: {
    width: 50, height: 50, borderRadius: 8,
    backgroundColor: '#3d2810', borderWidth: 1.5, borderColor: '#7a4a18',
    alignItems: 'center', justifyContent: 'center',
  },
  cellDim: { opacity: 0.4 },
  cellImg: { width: 38, height: 38 },
  cellCount: { position: 'absolute', right: 3, bottom: 1, color: '#fff', fontSize: 11, fontWeight: 'bold' },

  recipe: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#4a2c12', paddingVertical: 5,
  },
  recipeName: { color: '#ffe8a0', fontSize: 12, fontWeight: 'bold', minWidth: 120 },
  recipeHidden: { color: '#8a6a40' },
  recipeFlowers: { flexDirection: 'row', gap: 2 },
  recipeImg: { width: 22, height: 22 },
  hint: { flex: 1, color: '#b89a6a', fontSize: 11, fontStyle: 'italic' },
  footnote: { color: '#8a6a40', fontSize: 10, marginTop: 8 },
});
