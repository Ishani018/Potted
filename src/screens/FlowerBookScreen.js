import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES, UI_IMAGES, TRADE_IMAGES } from '../engine/assets';
import {
  FLOWER_BOOK, POTTED_FLOWERS, HANGING_PLANTS, BOUQUET_RECIPES, TRADE_FLOWERS, seedType,
  FLOWER_GROWTH, formatDuration, seedUnlockLevel, playerLevel,
} from '../constants/gameData';
import BouquetArt from '../components/BouquetArt';
import BackSign from '../components/BackSign';
import CareGuide from '../components/CareGuide';
import BookFrame from '../components/BookFrame';
import BookCustomers from '../components/BookCustomers';
import BookPets from '../components/BookPets';
import BookPaintings from '../components/BookPaintings';
import { BookTabs } from '../components/BookParts';

// Flower book — an open two-page journal with six tabs: Flowers, Bouquets, Care,
// Customers, Pets and Paintings.
// Flowers: every flower (silhouettes until discovered); a page unlocks the first
// time that flower reaches full bloom (see WATER_PLANT).
// Bouquets: the secret bouquet recipes; one unlocks the first time it's tied
// and sold at the market (see SELL_BOUQUET). Locked ones show only a hint.
// Care: a guide to looking after plants — watering, bugs, remedies (CareGuide).
// Customers / Pets / Paintings: portrait cards for the florist's visitors, your
// pets (choose where they live, rename them) and the gallery's paintings (hang
// one in the Balcony frame). These used to live in settings.

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

// Close-up of just the bloom (the market art) — fills a tile far better than the
// whole potted plant, which is mostly empty space. Falls back to the plant image.
function flowerArt(key) {
  return TRADE_IMAGES[TRADE_FLOWERS[key]?.img] ?? bloomImage(key);
}

export default function FlowerBookScreen({ navigation, route }) {
  const { state } = useGame();
  const book = state.player.flowerBook ?? {};
  const bouquetBook = state.player.bouquetBook ?? {};
  const [tab, setTab] = useState(route?.params?.tab ?? 'flowers');
  const [selected, setSelected] = useState(FLOWER_BOOK[0].key);
  const [selectedRecipe, setSelectedRecipe] = useState(BOUQUET_RECIPES[0].id);

  const level = playerLevel(state.player);
  const found = FLOWER_BOOK.filter((f) => book[f.key]).length;
  const entry = FLOWER_BOOK.find((f) => f.key === selected);
  const record = book[selected];
  const unlocked = !!record;
  const type = seedType(selected);

  return (
    <View style={styles.root}>
      <BackSign onPress={() => navigation.goBack()} />

      {tab === 'customers' ? (
        <BookCustomers tab={tab} setTab={setTab} />
      ) : tab === 'pets' ? (
        <BookPets tab={tab} setTab={setTab} />
      ) : tab === 'paintings' ? (
        <BookPaintings tab={tab} setTab={setTab} />
      ) : tab === 'care' ? (
        <CareGuide tabs={<BookTabs tab={tab} setTab={setTab} />} />
      ) : tab === 'bouquets' ? (
        <BouquetPages
          found={bouquetBook}
          selected={selectedRecipe}
          onSelect={setSelectedRecipe}
          tabs={<BookTabs tab={tab} setTab={setTab} />}
        />
      ) : (
      <BookFrame
        left={(
        <View style={styles.pageInner}>
          <BookTabs tab={tab} setTab={setTab} />
          <Text style={styles.progress}>{found} / {FLOWER_BOOK.length} discovered</Text>
          <View style={styles.grid}>
            {FLOWER_BOOK.map((f) => {
              const isFound = !!book[f.key];
              const isSel = f.key === selected;
              const seedLocked = !isFound && level < seedUnlockLevel(f.key);
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.tile, isFound && styles.tileFound, isSel && styles.tileSel]}
                  onPress={() => setSelected(f.key)}
                  activeOpacity={0.75}
                >
                  <View style={styles.tileArt}>
                    <Image
                      source={flowerArt(f.key)}
                      style={[styles.tileImg, !isFound && styles.silhouette]}
                      resizeMode="contain"
                    />
                    {!isFound && <Text style={styles.tileQ}>?</Text>}
                    {isFound && <Text style={styles.tileStar}>✦</Text>}
                  </View>
                  <Text numberOfLines={1} style={[styles.tileName, !isFound && styles.tileNameLocked]}>
                    {isFound ? flowerName(f.key) : seedLocked ? `Lv ${seedUnlockLevel(f.key)}` : '???'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        )}
        right={(
          <ScrollView style={styles.pageInner} contentContainerStyle={styles.detail} showsVerticalScrollIndicator={false}>
            {/* Big close-up of the bloom on a soft glow */}
            <View style={styles.hero}>
              <View style={[styles.heroGlow, !unlocked && styles.heroGlowLocked]} />
              <Image
                source={flowerArt(selected)}
                style={[styles.heroImg, !unlocked && styles.silhouette]}
                resizeMode="contain"
              />
              {unlocked ? (
                <>
                  <Text style={[styles.heroSpark, { left: '8%', top: '12%' }]}>✦</Text>
                  <Text style={[styles.heroSpark, { right: '10%', top: '4%', fontSize: 11 }]}>✦</Text>
                  <Text style={[styles.heroSpark, { right: '6%', bottom: '14%', fontSize: 9 }]}>✦</Text>
                </>
              ) : (
                <Text style={styles.heroQ}>?</Text>
              )}
            </View>
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
                  <Text style={styles.stat}>
                    Water every {formatDuration((FLOWER_GROWTH[selected]?.hours ?? 3) * 3600000)} · bloom in {formatDuration((FLOWER_GROWTH[selected]?.hours ?? 3) * 3600000 * (type === 'hanging' ? 1 : 2))}
                  </Text>
                  <Text style={styles.stat}>
                    Level {seedUnlockLevel(selected)} · grown {record.grown}× · first {new Date(record.firstAt).toLocaleDateString()}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.lockedHint}>Grow one to full bloom to fill in this page.</Text>
                <Text style={styles.lockedLevel}>
                  {level >= seedUnlockLevel(selected)
                    ? 'The seeds are waiting for you at the nursery.'
                    : `Its seeds unlock at level ${seedUnlockLevel(selected)}.`}
                </Text>
              </>
            )}
          </ScrollView>
        )}
      />
      )}
    </View>
  );
}

// Bouquet tab: left page lists the recipes, right page shows the selected one.
function BouquetPages({ found, selected, onSelect, tabs }) {
  const recipe = BOUQUET_RECIPES.find((r) => r.id === selected);
  const record = found[selected];
  const count = BOUQUET_RECIPES.filter((r) => found[r.id]).length;
  return (
    <BookFrame
      left={(
      <View style={styles.pageInner}>
        {tabs}
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
                {got ? <BouquetArt flowers={r.flowers} size={50} fancy /> : <Text style={styles.recipeQ}>?</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      )}
      right={(
        <ScrollView style={styles.pageInner} contentContainerStyle={styles.detail} showsVerticalScrollIndicator={false}>
          <Text style={styles.name}>{record ? recipe.name : '???'}</Text>
          {record ? (
            <>
              <BouquetArt flowers={recipe.flowers} size={96} fancy />
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
      )}
    />
  );
}

const INK = '#4a2a10';
const PAPER = '#f3e3c0';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2a1608', alignItems: 'center', justifyContent: 'center' },
  backImg: { width: '100%', height: '100%' },

  // The page is painted (BookFrame); this just sits inside its content area.
  pageInner: { flex: 1 },

  recipeTile: { width: '29%' },
  recipeQ: { fontFamily: PIXEL_FONT, fontSize: 16, color: '#b89a6a' },
  recipeBigQ: { fontFamily: PIXEL_FONT, fontSize: 40, color: '#c9a86a', marginVertical: 14 },
  recipeImg: { width: 34, height: 34 },
  progress: { color: '#8a6a40', fontSize: 10, textAlign: 'center', marginBottom: 4 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 5 },
  tile: {
    width: '23%', aspectRatio: 0.88, borderRadius: 8, paddingTop: 4, paddingBottom: 3,
    backgroundColor: '#e8d4a8', borderWidth: 1.5, borderColor: '#c9a86a',
    alignItems: 'center', justifyContent: 'space-between',
  },
  tileFound: { backgroundColor: '#fbf0cf', borderColor: '#d8b872' },
  tileSel: { borderColor: '#5a8a2a', borderWidth: 2.5, backgroundColor: '#eef0c8' },
  tileArt: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  tileImg: { width: '92%', height: '92%' },
  tileQ: { position: 'absolute', fontFamily: PIXEL_FONT, fontSize: 14, color: '#fbf0cf', textShadowColor: '#5a4630', textShadowRadius: 2 },
  tileStar: { position: 'absolute', right: 5, top: 0, fontSize: 9, color: '#e0a830' },
  tileName: { color: INK, fontSize: 8, fontWeight: 'bold', maxWidth: '96%' },
  tileNameLocked: { color: '#a08860' },
  silhouette: { tintColor: '#4a3a28', opacity: 0.4 },

  detail: { alignItems: 'center', paddingBottom: 8 },
  hero: { width: 110, height: 84, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  heroGlow: {
    position: 'absolute', width: 78, height: 78, borderRadius: 39,
    backgroundColor: '#fbeab0', borderWidth: 3, borderColor: '#ecd48a',
  },
  heroGlowLocked: { backgroundColor: '#e6d6b0', borderColor: '#d2bd90' },
  heroImg: { width: 72, height: 72 },
  heroSpark: { position: 'absolute', fontSize: 14, color: '#e0a830' },
  heroQ: { position: 'absolute', fontFamily: PIXEL_FONT, fontSize: 26, color: '#fbf0cf', textShadowColor: '#5a4630', textShadowRadius: 3 },
  name: { fontFamily: PIXEL_FONT, fontSize: 12, color: INK, marginBottom: 5, textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  chipPot: { backgroundColor: '#e7c9a0', borderColor: '#a8703a' },
  chipHang: { backgroundColor: '#cfe3b8', borderColor: '#6a9a3a' },
  chipSeason: { backgroundColor: '#f0dca0', borderColor: '#b8963a' },
  chipTxt: { color: INK, fontSize: 10, fontWeight: 'bold' },

  stageRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 5 },
  stage: { alignItems: 'center' },
  stageImg: { width: 34, height: 40 },
  stageLabel: { color: '#8a6a40', fontSize: 9, marginTop: 2 },
  blurb: { color: INK, fontSize: 11, textAlign: 'center', marginBottom: 4, lineHeight: 15 },
  tip: { color: '#5a7a2a', fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginBottom: 4, lineHeight: 13 },
  stats: { borderTopWidth: 1, borderTopColor: '#c9a86a', paddingTop: 4, alignSelf: 'stretch', alignItems: 'center' },
  stat: { color: '#8a6a40', fontSize: 10 },

  lockedHint: { color: '#8a6a40', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
  lockedLevel: { color: '#a08860', fontSize: 10, textAlign: 'center', marginTop: 6 },
});
