import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES, UI_IMAGES, TRADE_IMAGES, PET_IMAGES, PAINTING_IMAGES, BOOK_DIVIDER } from '../engine/assets';
import {
  FLOWER_BOOK, RARE_BOOK, POTTED_FLOWERS, HANGING_PLANTS, BOUQUET_RECIPES, TRADE_FLOWERS, seedType,
  FLOWER_GROWTH, formatDuration, seedUnlockLevel, playerLevel, CUSTOMERS, knownPetKeys,
} from '../constants/gameData';
import BouquetArt from '../components/BouquetArt';
import BackSign from '../components/BackSign';
import CareGuide from '../components/CareGuide';
import BookFrame from '../components/BookFrame';
import BookCustomers from '../components/BookCustomers';
import BookPets from '../components/BookPets';
import BookPaintings from '../components/BookPaintings';
import { BookTabs, RibbonTitle, BODY, HEAD, SOFT } from '../components/BookParts';
import Portrait from '../components/Portrait';
import TileFrame from '../components/TileFrame';
import AdventureResult from '../components/AdventureResult';
import { BookProvider, useBook, CHAPTERS } from '../components/BookNav';

// Garden journal — an open journal you turn page by page (arrows, swipe, or the
// contents page): Flowers, Bouquets, Care (3 spreads), Customers, Pets, Paintings.
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
  if (POTTED_FLOWERS[key]?.rare) {
    // rare plants only have two growth stages
    return [
      { img: POTTED_PLANT_IMAGES._seedVisible, label: 'Seed' },
      { img: imgs[0], label: 'Bud' },
      { img: imgs[1], label: 'Full' },
    ];
  }
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
  return (
    <BookProvider startKey={route?.params?.tab ?? 'flowers'}>
      <FlowerBookPages navigation={navigation} />
    </BookProvider>
  );
}

// A little picture for each chapter on the contents page.
function chapterIcon(key) {
  const box = { width: 30, height: 30 };
  switch (key) {
    case 'flowers': return <Image source={flowerArt(FLOWER_BOOK[0].key)} style={box} resizeMode="contain" />;
    case 'rare': return <Image source={flowerArt(RARE_BOOK[0].key)} style={box} resizeMode="contain" />;
    case 'bouquets': return <Image source={UI_IMAGES.bouquetmixed} style={box} resizeMode="contain" />;
    case 'care': return <Image source={UI_IMAGES.wateringcan1} style={box} resizeMode="contain" />;
    case 'customers': return <Portrait customerKey="clara" size={30} bare />;
    case 'pets': return <Image source={PET_IMAGES.george} style={box} resizeMode="contain" />;
    case 'paintings': return <Image source={PAINTING_IMAGES.beachpainting} style={box} resizeMode="contain" />;
    default: return null;
  }
}

// Left page: the book's title and what you've collected. Right page: the contents.
function ContentsPages({ found, bouquetsFound }) {
  const { state } = useGame();
  const { goTo } = useBook();
  const p = state.player;
  const counts = {
    flowers: `${found} / ${FLOWER_BOOK.length}`,
    rare: `${RARE_BOOK.filter((f) => (p.flowerBook ?? {})[f.key]).length} / ${RARE_BOOK.length}`,
    bouquets: `${bouquetsFound} / ${BOUQUET_RECIPES.length}`,
    customers: `${Object.keys(p.customerBook ?? {}).length} / ${Object.keys(CUSTOMERS).length}`,
    pets: `${(p.ownedPets ?? []).length} / ${knownPetKeys(p).length}`,
    paintings: `${(p.ownedPaintings ?? []).length}`,
  };
  return (
    <BookFrame
      left={(
        <View style={styles.coverPage}>
          <Text style={styles.coverSmall}>The</Text>
          <Text style={styles.coverTitle}>Garden</Text>
          <Text style={styles.coverTitle}>Journal</Text>
          <Text style={styles.coverSub}>all about your nursery</Text>
          <Image source={BOOK_DIVIDER} style={styles.coverDivider} resizeMode="contain" />
          <View style={styles.coverArtRow}>
            <Image source={PET_IMAGES.george} style={styles.coverPet} resizeMode="contain" />
            <Image source={UI_IMAGES.bouquetmixed} style={styles.coverBouquet} resizeMode="contain" />
            <Image source={bloomImage(FLOWER_BOOK[0].key)} style={styles.coverBloom} resizeMode="contain" />
          </View>
          <Text style={styles.coverHint}>turn the page, or swipe</Text>
        </View>
      )}
      right={(
        <View style={styles.pageInner}>
          <View style={{ marginTop: 2, marginBottom: 8 }}><RibbonTitle width={236} size={24}>Contents</RibbonTitle></View>
          {CHAPTERS.map((c) => (
            <TouchableOpacity key={c.key} onPress={() => goTo(c.page)} activeOpacity={0.6} style={styles.contentsRow}>
              <View style={styles.contentsIcon}>{chapterIcon(c.key)}</View>
              <Text style={styles.contentsName}>{c.title}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.contentsCount}>{counts[c.key] ?? ''}</Text>
              <Text style={styles.contentsPage}>{c.page + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    />
  );
}

function FlowerBookPages({ navigation }) {
  const { state } = useGame();
  const { info } = useBook();
  const tab = info.key;
  const book = state.player.flowerBook ?? {};
  const bouquetBook = state.player.bouquetBook ?? {};
  const [pickedFlower, setSelected] = useState(FLOWER_BOOK[0].key);
  const [selectedRecipe, setSelectedRecipe] = useState(BOUQUET_RECIPES[0].id);

  const level = playerLevel(state.player);
  // the Flowers page and the Rare Plants page share this layout, with their own lists
  const isRare = tab === 'rare';
  const list = isRare ? RARE_BOOK : FLOWER_BOOK;
  const selected = list.some((f) => f.key === pickedFlower) ? pickedFlower : list[0].key;
  const found = list.filter((f) => book[f.key]).length;
  const entry = list.find((f) => f.key === selected);
  const record = book[selected];
  const unlocked = !!record;
  const type = seedType(selected);

  return (
    <View style={styles.root}>
      <BackSign onPress={() => navigation.goBack()} />
      <AdventureResult />

      {tab === 'contents' ? (
        <ContentsPages found={found} bouquetsFound={BOUQUET_RECIPES.filter((r) => bouquetBook[r.id]).length} />
      ) : tab === 'customers' ? (
        <BookCustomers />
      ) : tab === 'pets' ? (
        <BookPets />
      ) : tab === 'paintings' ? (
        <BookPaintings />
      ) : tab === 'care' ? (
        <CareGuide spread={info.spread} tabs={<BookTabs />} />
      ) : tab === 'bouquets' ? (
        <BouquetPages
          found={bouquetBook}
          selected={selectedRecipe}
          onSelect={setSelectedRecipe}
          tabs={<BookTabs />}
        />
      ) : (
      <BookFrame
        left={(
        <View style={styles.pageInner}>
          <BookTabs />
          <Text style={styles.progress}>{found} / {list.length} {isRare ? 'found' : 'discovered'}</Text>
          <View style={styles.grid}>
            {list.map((f) => {
              const isFound = !!book[f.key];
              const isSel = f.key === selected;
              const seedLocked = !isRare && !isFound && level < seedUnlockLevel(f.key);
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.tile, isFound && styles.tileFound, isSel && styles.tileSel]}
                  onPress={() => setSelected(f.key)}
                  activeOpacity={0.75}
                >
                  <TileFrame state={isSel ? 'selected' : isFound ? 'found' : seedLocked ? 'locked' : 'empty'} />
                  {/* a wax-sealed (level-locked) card shows no picture; the seal is the picture */}
                  {!seedLocked && (
                    <View style={styles.tileArt}>
                      <Image
                        source={flowerArt(f.key)}
                        style={[styles.tileImg, !isFound && styles.silhouette]}
                        resizeMode="contain"
                      />
                      {!isFound && <Text style={styles.tileQ}>?</Text>}
                      {isFound && <Text style={styles.tileStar}>✦</Text>}
                    </View>
                  )}
                  {seedLocked && <Text style={styles.tileLevel}>Lv {seedUnlockLevel(f.key)}</Text>}
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

            {/* Pot type is always shown so you know where a new seed goes */}
            <Text style={styles.tagline}>
              {type === 'hanging' ? 'Hanging pot' : 'Shelf pot'}{isRare ? '  ·  Rare' : ''}{unlocked ? `  ·  ${SEASON_LABEL[entry.season] ?? entry.season}` : ''}
            </Text>

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
                    Water every {formatDuration((FLOWER_GROWTH[selected]?.hours ?? 3) * 3600000)} · bloom in {formatDuration((FLOWER_GROWTH[selected]?.hours ?? 3) * 3600000 * (type === 'hanging' || isRare ? 1 : 2))}
                  </Text>
                  <Text style={styles.stat}>
                    {isRare ? 'Rare' : `Level ${seedUnlockLevel(selected)}`} · grown {record.grown}× · first {new Date(record.firstAt).toLocaleDateString()}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.lockedHint}>Grow one to full bloom to fill in this page.</Text>
                <Text style={styles.lockedLevel}>
                  {isRare
                    ? 'Pets sometimes bring its seed home from an adventure.'
                    : level >= seedUnlockLevel(selected)
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
                <TileFrame state={r.id === selected ? 'selected' : got ? 'found' : 'empty'} />
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
  coverPage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverSmall: { fontFamily: HEAD, fontSize: 18, color: SOFT, marginBottom: 0 },
  coverTitle: { fontFamily: HEAD, fontSize: 36, color: '#7a3e1a', lineHeight: 38 },
  coverRule: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 },
  coverDivider: { width: 200, height: 20, marginTop: 4 },
  coverSub: { fontFamily: BODY, fontSize: 16, color: INK, marginBottom: 8 },
  coverArtRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2, marginVertical: 8 },
  coverPet: { width: 62, height: 56 },
  coverBouquet: { width: 78, height: 84 },
  coverBloom: { width: 62, height: 70 },
  coverHint: { fontFamily: BODY, fontSize: 12.5, color: SOFT },
  contentsHead: { fontFamily: HEAD, fontSize: 26, color: '#7a3e1a', textAlign: 'center', marginTop: 0, marginBottom: 8 },
  contentsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 1 },
  contentsIcon: { width: 34, alignItems: 'center', marginRight: 6 },
  contentsName: { fontFamily: HEAD, fontSize: 21, color: INK },
  contentsCount: { fontFamily: BODY, fontSize: 13, color: SOFT, marginRight: 8, marginBottom: 1 },
  contentsPage: { fontFamily: HEAD, fontSize: 18, color: '#7a3e1a', width: 20, textAlign: 'right' },
  root: { flex: 1, backgroundColor: '#2a1608', alignItems: 'center', justifyContent: 'center' },
  backImg: { width: '100%', height: '100%' },

  // The page is painted (BookFrame); this just sits inside its content area.
  pageInner: { flex: 1 },

  recipeTile: { width: '29%' },
  recipeQ: { fontFamily: PIXEL_FONT, fontSize: 16, color: '#b89a6a' },
  recipeBigQ: { fontFamily: PIXEL_FONT, fontSize: 40, color: '#c9a86a', marginVertical: 14 },
  recipeImg: { width: 34, height: 34 },
  progress: { fontFamily: BODY, color: '#8a6a40', fontSize: 13, textAlign: 'center', marginBottom: 3 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 5 },
  tile: {
    width: '23%', aspectRatio: 0.88, paddingTop: 10, paddingBottom: 10, paddingHorizontal: 9,
    alignItems: 'center', justifyContent: 'space-between',
  },
  tileFound: {},
  tileSel: {},
  tileArt: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  tileImg: { width: '92%', height: '92%' },
  tileQ: { position: 'absolute', fontFamily: PIXEL_FONT, fontSize: 14, color: '#fbf0cf', textShadowColor: '#5a4630', textShadowRadius: 2 },
  tileStar: { position: 'absolute', right: 5, top: 0, fontSize: 9, color: '#e0a830' },
  // names live on the right-hand page; a tile only carries the picture (and a seed level when locked)
  tileLevel: { position: 'absolute', bottom: 9, alignSelf: 'center', fontFamily: BODY, color: '#5a3410', fontSize: 12 },
  silhouette: { tintColor: '#4a3a28', opacity: 0.4 },

  detail: { alignItems: 'center', paddingBottom: 8 },
  hero: { width: 110, height: 68, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  heroGlow: {
    position: 'absolute', width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#fbeab0', borderWidth: 3, borderColor: '#ecd48a',
  },
  heroGlowLocked: { backgroundColor: '#e6d6b0', borderColor: '#d2bd90' },
  heroImg: { width: 60, height: 60 },
  heroSpark: { position: 'absolute', fontSize: 14, color: '#e0a830' },
  heroQ: { position: 'absolute', fontFamily: PIXEL_FONT, fontSize: 26, color: '#fbf0cf', textShadowColor: '#5a4630', textShadowRadius: 3 },
  name: { fontFamily: HEAD, fontSize: 21, color: INK, marginBottom: 1, textAlign: 'center' },
  tagline: { fontFamily: BODY, color: '#8a6a40', fontSize: 13, textAlign: 'center', marginBottom: 4 },

  stageRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 5 },
  stage: { alignItems: 'center' },
  stageImg: { width: 34, height: 40 },
  stageLabel: { fontFamily: BODY, color: '#8a6a40', fontSize: 12, marginTop: 1 },
  blurb: { fontFamily: BODY, color: INK, fontSize: 13.5, textAlign: 'center', marginBottom: 2, lineHeight: 14.5 },
  tip: { fontFamily: BODY, color: '#5a7a2a', fontSize: 12.5, textAlign: 'center', marginBottom: 2, lineHeight: 14 },
  stats: { paddingTop: 4, alignSelf: 'stretch', alignItems: 'center' },
  stat: { fontFamily: BODY, color: '#8a6a40', fontSize: 13 },

  lockedHint: { fontFamily: BODY, color: '#8a6a40', fontSize: 14, textAlign: 'center' },
  lockedLevel: { fontFamily: BODY, color: '#a08860', fontSize: 13, textAlign: 'center', marginTop: 4 },
});
