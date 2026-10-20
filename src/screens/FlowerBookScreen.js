import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES, UI_IMAGES, TRADE_IMAGES } from '../engine/assets';
import {
  FLOWER_BOOK, POTTED_FLOWERS, HANGING_PLANTS, BOUQUET_RECIPES, TRADE_FLOWERS, seedType,
} from '../constants/gameData';
import BouquetArt from '../components/BouquetArt';

// Flower book — an open two-page journal with two tabs.
// Flowers: every flower (silhouettes until discovered); a page unlocks the first
// time that flower reaches full bloom (see WATER_PLANT).
// Bouquets: the secret bouquet recipes; one unlocks the first time it's tied
// and sold at the market (see SELL_BOUQUET). Locked ones show only a hint.

const PIXEL_FONT = 'PressStart2P';

const SEASON_LABEL = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };

function flowerName(key) {
  return POTTED_FLOWERS[key]?.name ?? HANGING_PLANTS[key]?.name ?? key;
}

// [{ img, label }] for each growth stage, seed → full bloom.
function stageImages(key) {
  if (seedType(key) === 'hanging') {
    const imgs = HANGING_PLANT_IMAGES[key] ?? [];
    return [
      { img: HANGING_PLANT_IMAGES._seedVisible, label: 'Seed' },
      { img: imgs[0], label: 'Bud' },
      { img: imgs[1], label: 'Full' },
    ];
  }
  const imgs = POTTED_PLANT_IMAGES[key] ?? [];
  return [
    { img: POTTED_PLANT_IMAGES._seedVisible, label: 'Seed' },
    { img: imgs[0], label: 'Bud' },
    { img: imgs[1], label: 'Bloom' },
    { img: imgs[2], label: 'Full' },
  ];
}

function bloomImage(key) {
  const stages = stageImages(key);
  return stages[stages.length - 1].img;
}

export default function FlowerBookScreen({ navigation }) {
  const { state } = useGame();
  const book = state.player.flowerBook ?? {};
  const bouquetBook = state.player.bouquetBook ?? {};
  const [tab, setTab] = useState('flowers');
  const [selected, setSelected] = useState(FLOWER_BOOK[0].key);
  const [selectedRecipe, setSelectedRecipe] = useState(BOUQUET_RECIPES[0].id);

  const found = FLOWER_BOOK.filter((f) => book[f.key]).length;
  const entry = FLOWER_BOOK.find((f) => f.key === selected);
  const record = book[selected];
  const unlocked = !!record;
  const type = seedType(selected);

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Image source={UI_IMAGES.back} style={styles.backImg} resizeMode="contain" />
      </TouchableOpacity>

      {tab === 'bouquets' ? (
        <BouquetPages
          found={bouquetBook}
          selected={selectedRecipe}
          onSelect={setSelectedRecipe}
          tabs={<Tabs tab={tab} setTab={setTab} />}
        />
      ) : (
      <View style={styles.book}>
        {/* ── Left page: index of every flower ─────────────────────────── */}
        <View style={[styles.page, styles.pageLeft]}>
          <Tabs tab={tab} setTab={setTab} />
          <Text style={styles.title}>Flower Book</Text>
          <Text style={styles.progress}>{found} / {FLOWER_BOOK.length} discovered</Text>
          <View style={styles.grid}>
            {FLOWER_BOOK.map((f) => {
              const isFound = !!book[f.key];
              const isSel = f.key === selected;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.tile, isSel && styles.tileSel]}
                  onPress={() => setSelected(f.key)}
                  activeOpacity={0.75}
                >
                  <Image
                    source={bloomImage(f.key)}
                    style={[styles.tileImg, !isFound && styles.silhouette]}
                    resizeMode="contain"
                  />
                  {!isFound && <Text style={styles.tileQ}>?</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.spine} />

        {/* ── Right page: selected flower ──────────────────────────────── */}
        <View style={[styles.page, styles.pageRight]}>
          <ScrollView contentContainerStyle={styles.detail} showsVerticalScrollIndicator={false}>
            <Text style={styles.name}>{unlocked ? flowerName(selected) : '???'}</Text>

            <View style={styles.chipRow}>
              {/* Pot type is always shown so you know where a new seed goes */}
              <View style={[styles.chip, type === 'hanging' ? styles.chipHang : styles.chipPot]}>
                <Text style={styles.chipTxt}>{type === 'hanging' ? 'Hanging pot' : 'Shelf pot'}</Text>
              </View>
              {unlocked && (
                <View style={[styles.chip, styles.chipSeason]}>
                  <Text style={styles.chipTxt}>{SEASON_LABEL[entry.season] ?? entry.season}</Text>
                </View>
              )}
            </View>

            {unlocked ? (
              <>
                <View style={styles.stageRow}>
                  {stageImages(selected).map((s) => (
                    <View key={s.label} style={styles.stage}>
                      <Image source={s.img} style={styles.stageImg} resizeMode="contain" />
                      <Text style={styles.stageLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.blurb}>{entry.blurb}</Text>
                <Text style={styles.tip}>Tip: {entry.tip}</Text>
                <View style={styles.stats}>
                  <Text style={styles.stat}>Grown to full bloom: {record.grown}</Text>
                  <Text style={styles.stat}>First bloom: {new Date(record.firstAt).toLocaleDateString()}</Text>
                </View>
              </>
            ) : (
              <>
                <Image source={bloomImage(selected)} style={[styles.lockedImg, styles.silhouette]} resizeMode="contain" />
                <Text style={styles.lockedHint}>Grow one to full bloom to fill in this page.</Text>
              </>
            )}
          </ScrollView>
        </View>
      </View>
      )}
    </View>
  );
}

function Tabs({ tab, setTab }) {
  return (
    <View style={styles.tabs}>
      {[['flowers', 'Flowers'], ['bouquets', 'Bouquets']].map(([key, label]) => (
        <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabOn]} onPress={() => setTab(key)}>
          <Text style={[styles.tabTxt, tab === key && styles.tabTxtOn]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Bouquet tab: left page lists the recipes, right page shows the selected one.
function BouquetPages({ found, selected, onSelect, tabs }) {
  const recipe = BOUQUET_RECIPES.find((r) => r.id === selected);
  const record = found[selected];
  const count = BOUQUET_RECIPES.filter((r) => found[r.id]).length;
  return (
    <View style={styles.book}>
      <View style={[styles.page, styles.pageLeft]}>
        {tabs}
        <Text style={styles.title}>Bouquets</Text>
        <Text style={styles.progress}>{count} / {BOUQUET_RECIPES.length} recipes found</Text>
        <View style={styles.grid}>
          {BOUQUET_RECIPES.map((r) => {
            const got = !!found[r.id];
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.tile, styles.recipeTile, r.id === selected && styles.tileSel]}
                onPress={() => onSelect(r.id)}
                activeOpacity={0.75}
              >
                {got ? <BouquetArt flowers={r.flowers} size={54} /> : <Text style={styles.recipeQ}>?</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.spine} />

      <View style={[styles.page, styles.pageRight]}>
        <ScrollView contentContainerStyle={styles.detail} showsVerticalScrollIndicator={false}>
          <Text style={styles.name}>{record ? recipe.name : '???'}</Text>
          {record ? (
            <>
              <BouquetArt flowers={recipe.flowers} size={110} />
              <View style={styles.stageRow}>
                {recipe.flowers.map((k, i) => (
                  <View key={i} style={styles.stage}>
                    <Image source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} style={styles.recipeImg} resizeMode="contain" />
                    <Text style={styles.stageLabel}>{TRADE_FLOWERS[k].name}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.tip}>Sells for ×{recipe.multiplier} the flowers' value</Text>
              <View style={styles.stats}>
                <Text style={styles.stat}>Bouquets made: {record.made}</Text>
                <Text style={styles.stat}>First made: {new Date(record.firstAt).toLocaleDateString()}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.recipeBigQ}>?</Text>
              <Text style={styles.blurb}>Hint: {recipe.hint}</Text>
              <Text style={styles.lockedHint}>Tie the right 3 flowers at the market's bouquet table to find this recipe.</Text>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const INK = '#4a2a10';
const PAPER = '#f3e3c0';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2a1608', alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 12, left: 14, width: 48, height: 48, zIndex: 20 },
  backImg: { width: '100%', height: '100%' },

  book: {
    flexDirection: 'row', width: '86%', height: '86%',
    backgroundColor: '#7a3e1a', borderRadius: 14, padding: 8,
    borderWidth: 2, borderColor: '#c8873a',
  },
  page: { flex: 1, backgroundColor: PAPER, padding: 12 },
  pageLeft: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  pageRight: { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  spine: { width: 4, backgroundColor: '#c9b48a' },

  tabs: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 },
  tab: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#c9a86a' },
  tabOn: { backgroundColor: '#7a3e1a', borderColor: '#7a3e1a' },
  tabTxt: { color: '#8a6a40', fontSize: 10, fontWeight: 'bold' },
  tabTxtOn: { color: PAPER },
  recipeTile: { width: '30%' },
  recipeQ: { fontFamily: PIXEL_FONT, fontSize: 16, color: '#b89a6a' },
  recipeBigQ: { fontFamily: PIXEL_FONT, fontSize: 40, color: '#c9a86a', marginVertical: 14 },
  recipeImg: { width: 40, height: 40 },
  title: { fontFamily: PIXEL_FONT, fontSize: 13, color: INK, textAlign: 'center', marginBottom: 4 },
  progress: { color: '#8a6a40', fontSize: 11, textAlign: 'center', marginBottom: 8 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 6 },
  tile: {
    width: '22%', aspectRatio: 1, borderRadius: 8,
    backgroundColor: '#e8d4a8', borderWidth: 1.5, borderColor: '#c9a86a',
    alignItems: 'center', justifyContent: 'center',
  },
  tileSel: { borderColor: '#5a8a2a', borderWidth: 2.5, backgroundColor: '#eef0c8' },
  tileImg: { width: '82%', height: '82%' },
  tileQ: { position: 'absolute', fontFamily: PIXEL_FONT, fontSize: 12, color: PAPER },
  silhouette: { tintColor: '#5a4630', opacity: 0.55 },

  detail: { alignItems: 'center', paddingBottom: 8 },
  name: { fontFamily: PIXEL_FONT, fontSize: 13, color: INK, marginBottom: 8, textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  chipPot: { backgroundColor: '#e7c9a0', borderColor: '#a8703a' },
  chipHang: { backgroundColor: '#cfe3b8', borderColor: '#6a9a3a' },
  chipSeason: { backgroundColor: '#f0dca0', borderColor: '#b8963a' },
  chipTxt: { color: INK, fontSize: 10, fontWeight: 'bold' },

  stageRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  stage: { alignItems: 'center' },
  stageImg: { width: 48, height: 60 },
  stageLabel: { color: '#8a6a40', fontSize: 9, marginTop: 2 },
  blurb: { color: INK, fontSize: 12, textAlign: 'center', marginBottom: 6, lineHeight: 17 },
  tip: { color: '#5a7a2a', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginBottom: 8 },
  stats: { borderTopWidth: 1, borderTopColor: '#c9a86a', paddingTop: 6, alignSelf: 'stretch', alignItems: 'center' },
  stat: { color: '#8a6a40', fontSize: 10 },

  lockedImg: { width: 90, height: 110, marginVertical: 8 },
  lockedHint: { color: '#8a6a40', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
});
