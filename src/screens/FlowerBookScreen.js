import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { SET_UI, POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES, UI_IMAGES, TRADE_IMAGES, PET_IMAGES, PAINTING_IMAGES, BOOK_DIVIDER } from '../engine/assets';
import {
  SEED_LOCKS,
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
import { RibbonTitle, BODY, HEAD, SOFT } from '../components/BookParts';
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

const PIXEL_FONT = HEAD;


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

// Tiles that always fit the page: measures the space, then sizes every tile so all rows are on the page.
function FitGrid({ items, cols, gap = 8, aspect = 0.94, render }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const tw = box.w ? Math.max(20, Math.min((box.w - gap * (cols - 1)) / cols, ((box.h - gap * (rows - 1)) / rows) / aspect)) : 0;
  return (
    <View style={{ flex: 1 }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {tw > 0 && (
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap, justifyContent: 'center', alignContent: 'center' }}>
          {items.map((it, i) => <View key={i} style={{ width: tw, height: tw * aspect }}>{render(it, tw)}</View>)}
        </View>
      )}
    </View>
  );
}

// A small heart that favourites a book entry (saved in the player's favourites).
function Heart({ id, size = 22, style }) {
  const { state, dispatch } = useGame();
  const on = (state.player.favourites ?? []).includes(id);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => dispatch({ type: 'TOGGLE_FAV', id })} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={style}>
      <Image source={(on ? SET_UI.heart : SET_UI.heartOff).src} style={{ width: size, height: size * 0.88 }} resizeMode="contain" />
    </TouchableOpacity>
  );
}

// The page heading: the chapter name, then how much you have found as a slim bar.
function PageHead({ title, have, total, what }) {
  return (
    <View style={styles.head}>
      <Text style={styles.headTitle}>{title}</Text>
      <View style={styles.headBarRow}>
        <View style={styles.headBar}><View style={[styles.headFill, { width: `${total ? (have / total) * 100 : 0}%` }]} /></View>
        <Text style={styles.headCount}>{have} / {total} {what}</Text>
      </View>
    </View>
  );
}

const Row = ({ k, v }) => (
  <View style={styles.statRow}><Text style={styles.statKey}>{k}</Text><Text style={styles.statVal}>{v}</Text></View>
);

function FlowerBookPages({ navigation }) {
  const { state } = useGame();
  const { info } = useBook();
  const tab = info.key;
  const book = state.player.flowerBook ?? {};
  const favs = state.player.favourites ?? [];
  const bouquetBook = state.player.bouquetBook ?? {};
  const [pickedFlower, setSelected] = useState(FLOWER_BOOK[0].key);
  const [selectedRecipe, setSelectedRecipe] = useState(BOUQUET_RECIPES[0].id);

  const level = playerLevel(state.player);
  // the Flowers page and the Rare Plants page share this layout, with their own lists (favourites first)
  const isRare = tab === 'rare';
  const base = isRare ? RARE_BOOK : FLOWER_BOOK;
  const list = [...base].sort((x, y) => (favs.includes('book:' + y.key) ? 1 : 0) - (favs.includes('book:' + x.key) ? 1 : 0));
  const selected = base.some((f) => f.key === pickedFlower) ? pickedFlower : base[0].key;
  const found = base.filter((f) => book[f.key]).length;
  const entry = base.find((f) => f.key === selected);
  const record = book[selected];
  const unlocked = !!record;
  const type = seedType(selected);
  const hours = (FLOWER_GROWTH[selected]?.hours ?? 3) * 3600000;

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
        <BouquetPages found={bouquetBook} selected={selectedRecipe} onSelect={setSelectedRecipe} />
      ) : (
      <BookFrame
        left={(
        <View style={styles.pageInner}>
          <PageHead title={info.title} have={found} total={base.length} what={isRare ? 'found' : 'discovered'} />
          <FitGrid items={list} cols={4} render={(f, tw) => {
            const isFound = !!book[f.key];
            const isSel = f.key === selected;
            const seedLocked = SEED_LOCKS && !isRare && !isFound && level < seedUnlockLevel(f.key);
            return (
              <TouchableOpacity style={styles.tile} onPress={() => setSelected(f.key)} activeOpacity={0.75}>
                <TileFrame state={isSel ? 'selected' : isFound ? 'found' : seedLocked ? 'locked' : 'empty'} />
                {!seedLocked && (
                  <Image source={flowerArt(f.key)} style={[{ width: tw * 0.72, height: tw * 0.72 }, !isFound && styles.silhouette]} resizeMode="contain" />
                )}
                {seedLocked && <Text style={styles.tileLevel}>Lv {seedUnlockLevel(f.key)}</Text>}
                {isFound && <Heart id={'book:' + f.key} size={Math.max(14, tw * 0.26)} style={styles.tileHeart} />}
              </TouchableOpacity>
            );
          }} />
        </View>
        )}
        right={(
          <ScrollView style={styles.pageInner} contentContainerStyle={styles.detail} showsVerticalScrollIndicator={false}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{unlocked ? flowerName(selected) : 'Not found yet'}</Text>
                <Text style={styles.tagline}>{type === 'hanging' ? 'Hanging pot' : 'Shelf pot'}{isRare ? ' · Rare' : ''}</Text>
              </View>
              {unlocked && <Heart id={'book:' + selected} size={26} />}
            </View>
            <View style={styles.hero}>
              <View style={[styles.heroGlow, !unlocked && styles.heroGlowLocked]} />
              <Image source={flowerArt(selected)} style={[styles.heroImg, !unlocked && styles.silhouette]} resizeMode="contain" />
            </View>

            {unlocked ? (
              <>
                <View style={styles.stageRow}>
                  {stageImages(selected).map((st, i) => (
                    <React.Fragment key={st.label}>
                      {i > 0 && <Text style={styles.stageArrow}>›</Text>}
                      <View style={styles.stage}>
                        <Image source={st.img} style={styles.stageImg} resizeMode="contain" />
                        <Text style={styles.stageLabel}>{st.label}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
                <Text style={styles.blurb}>{entry.blurb}</Text>
                <Text style={styles.tip}><Text style={styles.tipKey}>Tip  </Text>{entry.tip}</Text>
                <View style={styles.stats}>
                  <Row k="Water every" v={formatDuration(hours)} />
                  <Row k="Blooms in" v={formatDuration(hours * (type === 'hanging' || isRare ? 1 : 2))} />
                  <Row k="Grown" v={`${record.grown} time${record.grown === 1 ? '' : 's'}`} />
                  <Row k="First bloom" v={new Date(record.firstAt).toLocaleDateString()} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.lockedHint}>Grow one to full bloom to fill in this page.</Text>
                <Text style={styles.lockedLevel}>
                  {isRare
                    ? 'Pets sometimes bring its seed home from an adventure.'
                    : !SEED_LOCKS || level >= seedUnlockLevel(selected)
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

// Bouquet chapter: left page lists the recipes, right page shows the selected one.
function BouquetPages({ found, selected, onSelect }) {
  const { state } = useGame();
  const favs = state.player.favourites ?? [];
  const recipe = BOUQUET_RECIPES.find((r) => r.id === selected);
  const record = found[selected];
  const count = BOUQUET_RECIPES.filter((r) => found[r.id]).length;
  const list = [...BOUQUET_RECIPES].sort((x, y) => (favs.includes('book:' + y.id) ? 1 : 0) - (favs.includes('book:' + x.id) ? 1 : 0));
  return (
    <BookFrame
      left={(
      <View style={styles.pageInner}>
        <PageHead title="Bouquets" have={count} total={BOUQUET_RECIPES.length} what="found" />
        <FitGrid items={list} cols={3} aspect={0.9} render={(r, tw) => {
          const got = !!found[r.id];
          return (
            <TouchableOpacity style={styles.tile} onPress={() => onSelect(r.id)} activeOpacity={0.75}>
              <TileFrame state={r.id === selected ? 'selected' : got ? 'found' : 'empty'} />
              {got ? <BouquetArt flowers={r.flowers} size={tw * 0.66} fancy /> : <Text style={styles.recipeQ}>?</Text>}
              {got && <Heart id={'book:' + r.id} size={Math.max(14, tw * 0.24)} style={styles.tileHeart} />}
            </TouchableOpacity>
          );
        }} />
      </View>
      )}
      right={(
        <ScrollView style={styles.pageInner} contentContainerStyle={styles.detail} showsVerticalScrollIndicator={false}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{record ? recipe.name : 'Secret recipe'}</Text>
              <Text style={styles.tagline}>{record ? 'Bouquet recipe' : 'Not found yet'}</Text>
            </View>
            {record && <Heart id={'book:' + selected} size={26} />}
          </View>
          {record ? (
            <>
              <View style={[styles.hero, { height: 104 }]}>
                <View style={[styles.heroGlow, { width: 96, height: 96, borderRadius: 48 }]} />
                <BouquetArt flowers={recipe.flowers} size={92} fancy />
              </View>
              <View style={styles.stageRow}>
                {recipe.flowers.map((k, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Text style={styles.stageArrow}>+</Text>}
                    <View style={styles.stage}>
                      <Image source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} style={styles.recipeImg} resizeMode="contain" />
                      <Text style={styles.stageLabel}>{TRADE_FLOWERS[k].name}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              <View style={styles.stats}>
                <Row k="Sells for" v={`x${recipe.multiplier} the flowers' value`} />
                <Row k="Made" v={`${record.made} time${record.made === 1 ? '' : 's'}`} />
                <Row k="First made" v={new Date(record.firstAt).toLocaleDateString()} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.hero}><View style={[styles.heroGlow, styles.heroGlowLocked]} /><Text style={styles.heroQ}>?</Text></View>
              <Text style={styles.blurb}>{recipe.hint}</Text>
              <Text style={styles.lockedHint}>Tie the right 3 flowers at the bouquet table to find it.</Text>
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
  coverTitle: { fontFamily: HEAD, fontSize: 36, fontWeight: 'bold', color: '#7a3e1a', lineHeight: 38 },
  coverDivider: { width: 200, height: 20, marginTop: 4 },
  coverSub: { fontFamily: BODY, fontSize: 16, color: INK, marginBottom: 8 },
  coverArtRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2, marginVertical: 8 },
  coverPet: { width: 62, height: 56 },
  coverBouquet: { width: 78, height: 84 },
  coverBloom: { width: 62, height: 70 },
  coverHint: { fontFamily: BODY, fontSize: 12.5, color: SOFT },
  contentsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  contentsIcon: { width: 34, alignItems: 'center', marginRight: 6 },
  contentsName: { fontFamily: HEAD, fontSize: 21, color: INK },
  contentsCount: { fontFamily: BODY, fontSize: 13, color: SOFT, marginRight: 8, marginBottom: 1 },
  contentsPage: { fontFamily: HEAD, fontSize: 18, color: '#7a3e1a', width: 20, textAlign: 'right' },
  root: { flex: 1, backgroundColor: '#2a1608', alignItems: 'center', justifyContent: 'center' },

  pageInner: { flex: 1 },

  // page heading
  head: { alignItems: 'center', marginBottom: 8 },
  headTitle: { fontFamily: HEAD, fontSize: 26, fontWeight: 'bold', color: '#7a3e1a', lineHeight: 28 },
  headBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, alignSelf: 'stretch', paddingHorizontal: 6 },
  headBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#e3cf9c', borderWidth: 1, borderColor: '#cdae78', overflow: 'hidden' },
  headFill: { height: '100%', backgroundColor: '#6a9a3a' },
  headCount: { fontFamily: HEAD, fontSize: 13, color: SOFT },

  // tiles
  tile: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tileHeart: { position: 'absolute', right: 4, top: 4 },
  tileLevel: { position: 'absolute', bottom: 8, alignSelf: 'center', fontFamily: HEAD, color: '#5a3410', fontSize: 13 },
  recipeQ: { fontFamily: HEAD, fontSize: 26, fontWeight: 'bold', color: '#c4a56e' },
  silhouette: { tintColor: '#4a3a28', opacity: 0.35 },

  // detail page
  detail: { alignItems: 'stretch', paddingBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontFamily: HEAD, fontSize: 25, fontWeight: 'bold', color: INK },
  tagline: { fontFamily: HEAD, color: SOFT, fontSize: 14 },
  hero: { height: 92, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  heroGlow: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: '#fbeab0', borderWidth: 3, borderColor: '#ecd48a' },
  heroGlowLocked: { backgroundColor: '#e6d6b0', borderColor: '#d2bd90' },
  heroImg: { width: 76, height: 76 },
  heroQ: { position: 'absolute', fontFamily: HEAD, fontSize: 40, fontWeight: 'bold', color: '#c4a56e' },
  stageRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginVertical: 4 },
  stage: { alignItems: 'center' },
  stageImg: { width: 36, height: 42 },
  stageArrow: { fontFamily: HEAD, fontSize: 20, color: '#b98a4e', marginTop: -10 },
  stageLabel: { fontFamily: HEAD, color: SOFT, fontSize: 13, marginTop: 1 },
  recipeImg: { width: 38, height: 38 },
  blurb: { fontFamily: HEAD, color: INK, fontSize: 15, lineHeight: 18, marginTop: 2 },
  tip: { fontFamily: HEAD, color: '#4a6a22', fontSize: 14, lineHeight: 17, marginTop: 4 },
  tipKey: { fontWeight: 'bold', color: '#2f5a22' },
  stats: { marginTop: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#d9bd86', paddingVertical: 3 },
  statKey: { fontFamily: HEAD, color: SOFT, fontSize: 14 },
  statVal: { fontFamily: HEAD, color: INK, fontSize: 14, fontWeight: 'bold' },
  lockedHint: { fontFamily: HEAD, color: SOFT, fontSize: 15, textAlign: 'center', marginTop: 4 },
  lockedLevel: { fontFamily: HEAD, color: '#a08860', fontSize: 14, textAlign: 'center', marginTop: 4 },
});
