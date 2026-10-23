import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Platform } from 'react-native';
import { POTTED_PLANT_IMAGES, TRADE_IMAGES, PET_IMAGES, PETFOOD_IMAGES, UI_IMAGES, FOSTER_BG } from '../engine/assets';
import { PEST_IMAGES } from '../engine/pestImages';
import {
  PEST_INFO, PEST_CONFIG, FLOWER_GROWTH, GROWTH_TIMERS, HERBALIST, HERBALIST_TRADES, REMEDIES,
  SCENT_SHIELD, PETS, TRADE_FLOWERS, SACHET_MS, formatDuration,
  PET_FOOD, FED_BOOST, FED_MAX_HOURS, STRAY_MS, STRAY_MAX,
} from '../constants/gameData';
import RemedyIcon from './RemedyIcon';
import HerbalistSprite from './HerbalistSprite';
import BookFrame from './BookFrame';

// The garden journal's care chapter: how to look after your plants and pets, over four spreads.
//   1. Watering  |  Bugs (and how to clear each kind)
//   2. Wilting & harvesting  |  Granny Mae's remedies and swaps
//   3. Using a remedy  |  Keeping bugs away (scented flowers, pets)
//   4. Feeding your pets  |  The Foster Center
// All numbers come from the game data, so the guide stays right when they change.
const PAPER = '#f3e3c0';
const INK = '#4a2a10';
const SOFT = '#8a6a40';
const PIXEL_FONT = 'PressStart2P';
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });
const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

function Block({ title, children }) {
  return (
    <View style={styles.block}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}
const P = ({ children, style }) => <Text style={[styles.body, style]}>{children}</Text>;

const hoursRange = () => {
  const hs = Object.values(FLOWER_GROWTH).map((f) => f.hours);
  return [Math.min(...hs), Math.max(...hs)];
};
const fmtH = (h) => formatDuration(h * 3600000);
const flowerPic = (k) => TRADE_IMAGES[TRADE_FLOWERS[k]?.img];

// A picture on the left, a short caption on the right.
function Pic({ src, size = 34, title, children }) {
  return (
    <View style={styles.itemRow}>
      <View style={{ width: size, alignItems: 'center' }}>{src}</View>
      <View style={{ flex: 1 }}>
        {title ? <Text style={styles.bugName}>{title}</Text> : null}
        {children}
      </View>
    </View>
  );
}
const Img = ({ source, w, h }) => <Image source={source} style={{ width: w, height: h ?? w }} resizeMode="contain" />;

// ── Spread 1 ──────────────────────────────────────────────────────────────────
function Watering() {
  const [lo, hi] = hoursRange();
  const daisy = POTTED_PLANT_IMAGES.daisy ?? [];
  const stages = [
    { img: POTTED_PLANT_IMAGES._seedVisible, label: 'Seed' },
    { img: daisy[0], label: 'Bud' },
    { img: daisy[1], label: 'Bloom' },
    { img: daisy[2], label: 'Full' },
  ];
  return (
    <>
      <Block title="Watering">
        <Pic src={<Img source={UI_IMAGES.wateringcan1} w={40} h={36} />} size={48}>
          <P>Drag the can over a plant and hold it there. Each drink grows it one stage.</P>
        </Pic>
        <View style={styles.stageRow}>
          {stages.map((s, i) => (
            <View key={s.label} style={styles.stage}>
              <Image source={s.img} style={styles.stageImg} resizeMode="contain" />
              <Text style={styles.small}>{s.label}</Text>
              {i < stages.length - 1 && <Text style={styles.arrow}>›</Text>}
            </View>
          ))}
        </View>
        <Pic src={<Img source={UI_IMAGES.waterdrop} w={26} h={30} />} size={48}>
          <P>A blue drop means it is thirsty. Waits run from {fmtH(lo)} to {fmtH(hi)}, depending on the flower.</P>
        </Pic>
      </Block>
    </>
  );
}

function WiltingHarvest() {
  const coins = GROWTH_TIMERS.hangingPassiveCoins;
  const daisy = POTTED_PLANT_IMAGES.daisy ?? [];
  return (
    <>
      <Block title="Wilting">
        <Pic src={<View style={{ opacity: 0.55 }}><Img source={daisy[2]} w={40} h={46} /></View>} size={52}>
          <P>Thirsty for a whole day, a plant droops. Water it and it perks up. Plants never die.</P>
        </Pic>
      </Block>
      <Block title="Harvesting">
        <Pic src={<Img source={flowerPic('daisy')} w={40} h={46} />} size={52}>
          <P>At full bloom, tap the plant and Harvest it for the market, bouquets or customers.</P>
        </Pic>
        <Pic src={<Img source={UI_IMAGES.goldcoins} w={36} h={36} />} size={52}>
          <P>Hanging plants earn {coins.amount} coins every {fmtH(coins.interval / 3600000)} while they bloom.</P>
        </Pic>
      </Block>
    </>
  );
}

function Bugs() {
  const kinds = Object.keys(PEST_INFO);
  return (
    <>
      <Block title="Bugs">
        <P>A bug stops its plant growing until it is gone. {PEST_CONFIG.handClearing ? `Clear it for ${PEST_CONFIG.reward} coins.` : 'Only remedies clear them.'}</P>
      </Block>
      {kinds.map((k) => {
        const info = PEST_INFO[k];
        return (
          <View key={k} style={styles.bugRow}>
            <View style={styles.bugImgBox}>
              <Image source={PEST_IMAGES[k]} style={{ width: 36, height: 36 * info.aspect }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bugName}>{info.name}</Text>
              
            </View>
          </View>
        );
      })}
    </>
  );
}

// ── Spread 2 ──────────────────────────────────────────────────────────────────
const flowerName = (k) => TRADE_FLOWERS[k]?.name ?? k;

function Remedies() {
  return (
    <>
      <Block title={`${HERBALIST.name}'s remedies`}>
        <P>Granny Mae strolls the town streets. Tap her on the map for a free gift every day, or to swap herbs.</P>
        <Pic src={<RemedyIcon kind="balm" size={46} />} size={54} title={REMEDIES.balm.name}>
          <Text style={styles.small}>{REMEDIES.balm.desc}</Text>
        </Pic>
        <Pic src={<RemedyIcon kind="sachet" size={46} />} size={54} title={REMEDIES.sachet.name}>
          <Text style={styles.small}>Keeps a growing plant bug-free for {SACHET_MS / 3600000} hours.</Text>
        </Pic>
      </Block>
    </>
  );
}

function KeepingAway() {
  const scented = Object.entries(SCENT_SHIELD);
  // Pets whose perk is about bugs.
  const helpers = Object.values(PETS).filter((p) => !p.stray).filter((p) => {
    const r = p.effect?.room;
    return r && (r.pestChance < 1 || r.autoCatch > 0 || r.pestRewardMult > 1);
  });
  return (
    <>
      <Block title="Scented flowers">
        {scented.slice(0, 3).map(([k, mult]) => (
          <Pic key={k} src={<Img source={flowerPic(k)} w={32} h={34} />} size={38} title={flowerName(k)}>
            <Text style={styles.small}>{Math.round((1 - mult) * 100)}% fewer bugs</Text>
          </Pic>
        ))}
      </Block>
      <Block title="Pet helpers">
        {helpers.slice(0, 3).map((p) => (
          <Pic key={p.key} src={<Img source={PET_IMAGES[p.key]} w={36} h={32} />} size={40} title={p.name}>
            <Text style={styles.small}>{PET_SHORT[p.key] ?? p.effect.desc}</Text>
          </Pic>
        ))}
      </Block>
    </>
  );
}

function UsingRemedies() {
  return (
    <>
      <Block title="Using a remedy">
        <Pic src={<RemedyIcon kind="balm" size={34} />} size={56} title="Pick it up">
          <P>Open your bag, tap a remedy, then tap the plant.</P>
        </Pic>
        <Pic src={<RemedyIcon kind="balm" size={34} />} size={56} title="Balm">
          <Text style={styles.small}>Only works on a plant with a bug.</Text>
        </Pic>
        <Pic src={<RemedyIcon kind="sachet" size={34} />} size={56} title="Sachet">
          <Text style={styles.small}>Goes on a growing plant and hangs there until it wears off.</Text>
        </Pic>
      </Block>
    </>
  );
}

// ── Spread 4 ──────────────────────────────────────────────────────────────────
function Feeding() {
  const byKey = (k) => PET_FOOD.find((f) => f.key === k);
  const examples = ['biscuits', 'dogfood', 'seniorcare'].map(byKey);
  return (
    <>
      <Block title="Feeding your pets">
        <P>A fed pet's perk is {FED_BOOST}x as strong. Buy food in the pet shop's food aisle. It lasts up to {FED_MAX_HOURS}h.</P>
        <View style={styles.foodRow}>
          {examples.map((f) => (
            <View key={f.key} style={styles.foodCard}>
              <Img source={PETFOOD_IMAGES[f.key]} w={52} h={60} />
              <Text style={styles.bugName}>{f.name}</Text>
              <View style={styles.coinLine}>
                <Img source={UI_IMAGES.goldcoins} w={13} />
                <Text style={styles.small}>{f.price}</Text>
              </View>
              <Text style={styles.small}>{f.hours}h fed</Text>
            </View>
          ))}
        </View>
      </Block>
    </>
  );
}

function FosterCenter() {
  return (
    <>
      <Block title="The Foster Center">
        <View style={styles.fosterPic}>
          <Image source={FOSTER_BG} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <Pic src={<Img source={UI_IMAGES.pcPaw} w={24} />} size={30}>
          <P>Customers bring strays here, about one every {STRAY_MS / 3600000}h. Up to {STRAY_MAX} wait at once.</P>
        </Pic>
        <Pic src={<Img source={UI_IMAGES.goldcoins} w={24} />} size={30}>
          <P>Tap one to read its story, then adopt it. Older animals cost less and have calm perks.</P>
        </Pic>
      </Block>
    </>
  );
}

// Short versions of the pet perks for the guide (the full text is on each pet's card).
const PET_SHORT = {
  george: 'Half as many bugs in its room.',
  tiger: 'Sometimes catches bugs for you.',
  oreo: 'Bugs you clear pay double.',
  ebonyandivory: '25% fewer bugs in its room.',
};

const SPREADS = [
  { left: Watering, right: Bugs },
  { left: WiltingHarvest, right: Remedies },
  { left: UsingRemedies, right: KeepingAway },
  { left: Feeding, right: FosterCenter },
];

export default function CareGuide({ tabs, spread = 0 }) {
  const { left: Left, right: Right } = SPREADS[spread] ?? SPREADS[0];
  return (
    <BookFrame
      left={(
        <View style={{ flex: 1 }}>
          {tabs}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Left />
          </ScrollView>
        </View>
      )}
      right={(
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Right />
        </ScrollView>
      )}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'space-evenly', paddingBottom: 6, gap: 6 },

  block: { marginBottom: 2, gap: 4 },
  heading: { fontFamily: HEAD, fontSize: 21, color: '#4a2a10', marginBottom: 1, fontWeight: 'bold' },
  body: { fontFamily: BODY, color: INK, fontSize: 16, lineHeight: 18, marginBottom: 2 },
  small: { fontFamily: BODY, color: SOFT, fontSize: 14.5, lineHeight: 16 },

  stageRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  stage: { alignItems: 'center', flex: 1 },
  stageImg: { width: 36, height: 42 },
  arrow: { position: 'absolute', right: -4, top: 16, color: SOFT, fontFamily: BODY, fontSize: 18 },

  // plain entries, no boxes or lines
  bugRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 1, marginBottom: 0,
  },
  bugImgBox: { width: 46, alignItems: 'center', justifyContent: 'center' },
  bugName: { fontFamily: HEAD, color: INK, fontSize: 17, lineHeight: 18 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },

  herbRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  herbPic: { width: 70, height: 92, overflow: 'hidden', alignItems: 'center' },

  swapRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  swapGive: { flexDirection: 'row', alignItems: 'center' },
  swapN: { fontFamily: BODY, color: INK, fontSize: 14, marginRight: 1 },
  swapArrow: { fontFamily: HEAD, color: SOFT, fontSize: 20, marginHorizontal: 1 },

  foodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  foodCard: { flex: 1, alignItems: 'center' },
  coinLine: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  fosterPic: { height: 110, borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: '#b8793a', marginBottom: 4 },
});
