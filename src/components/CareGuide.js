import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { POTTED_PLANT_IMAGES, TRADE_IMAGES, PET_IMAGES } from '../engine/assets';
import { PEST_IMAGES } from '../engine/pestImages';
import {
  PEST_INFO, PEST_CONFIG, FLOWER_GROWTH, GROWTH_TIMERS, HERBALIST, HERBALIST_TRADES, REMEDIES,
  SCENT_SHIELD, PETS, TRADE_FLOWERS, SACHET_MS, formatDuration,
} from '../constants/gameData';
import RemedyIcon from './RemedyIcon';
import BookFrame from './BookFrame';

// The flower book's "Care" tab: how to look after your plants, in two spreads.
//   1. Watering  |  Bugs (and how to clear each kind)
//   2. Wilting & harvesting  |  Granny Mae's remedies and swaps
//   3. Using a remedy  |  Keeping bugs away (scented flowers, pets)
// All numbers come from the game data, so the guide stays right when they change.
const PAPER = '#f3e3c0';
const INK = '#4a2a10';
const SOFT = '#8a6a40';
const PIXEL_FONT = 'PressStart2P';
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

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
        <P>Drag the watering can over a plant and hold it there. Every watering grows the plant one stage.</P>
        <View style={styles.stageRow}>
          {stages.map((s, i) => (
            <View key={s.label} style={styles.stage}>
              <Image source={s.img} style={styles.stageImg} resizeMode="contain" />
              <Text style={styles.small}>{s.label}</Text>
              {i < stages.length - 1 && <Text style={styles.arrow}>›</Text>}
            </View>
          ))}
        </View>
        <P>A blue drop above a plant means it is thirsty and ready for the next drink. How long that takes depends on the flower: {fmtH(lo)} for the quickest, {fmtH(hi)} for the slowest. Each flower's own page tells you.</P>
      </Block>
    </>
  );
}


function WiltingHarvest() {
  const coins = GROWTH_TIMERS.hangingPassiveCoins;
  return (
    <>
      <Block title="Wilting">
        <P>If a plant stays thirsty for a whole day it droops and turns pale. Water it and it perks right back up. Plants never die, and a plant in full bloom never wilts.</P>
      </Block>
      <Block title="Harvesting">
        <P>At full bloom, tap the plant and choose Harvest. Shelf flowers give you flowers to sell at the market, tie into bouquets or hand to customers.</P>
        <P>Hanging plants earn {coins.amount} coins every {fmtH(coins.interval / 3600000)} while they bloom. Harvesting one gives a flower instead, and the coins stop.</P>
      </Block>
    </>
  );
}

function Bugs() {
  const kinds = Object.keys(PEST_INFO);
  return (
    <>
      <Block title="Bugs">
        <P>A bug stops its plant growing until it is gone. {PEST_CONFIG.handClearing ? `Clearing one by hand pays ${PEST_CONFIG.reward} coins and a little XP:` : "Only the herbalist's remedies clear them. You might meet:"}</P>
      </Block>
      {kinds.map((k) => {
        const info = PEST_INFO[k];
        return (
          <View key={k} style={styles.bugRow}>
            <View style={styles.bugImgBox}>
              <Image source={PEST_IMAGES[k]} style={{ width: 44, height: 44 * info.aspect }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bugName}>{info.name}</Text>
              {PEST_CONFIG.handClearing && <Text style={styles.small}>{info.verb}</Text>}
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
        <P>{HERBALIST.name} waits at Home. She never sells anything, but she is happy to help a good gardener.</P>
        <View style={styles.itemRow}>
          <RemedyIcon kind="balm" size={30} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bugName}>{REMEDIES.balm.name}</Text>
            <Text style={styles.small}>{REMEDIES.balm.desc} She gives you one free every day.</Text>
          </View>
        </View>
        <View style={styles.itemRow}>
          <RemedyIcon kind="sachet" size={30} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bugName}>{REMEDIES.sachet.name}</Text>
            <Text style={styles.small}>Keeps one growing plant bug-free for {SACHET_MS / 3600000} hours, even while you are away.</Text>
          </View>
        </View>
      </Block>
      <Block title="Swaps">
        {HERBALIST_TRADES.map((t) => (
          <Text key={t.id} style={styles.swap}>
            {Object.entries(t.give).map(([k, n]) => `${n} ${flowerName(k)}`).join(' + ')}  ›  {REMEDIES[t.get].name}
          </Text>
        ))}
      </Block>
    </>
  );
}

function KeepingAway() {
  const scented = Object.entries(SCENT_SHIELD);
  // Pets whose perk is about bugs.
  const helpers = Object.values(PETS).filter((p) => {
    const r = p.effect?.room;
    return r && (r.pestChance < 1 || r.autoCatch > 0 || r.pestRewardMult > 1);
  });
  return (
    <>
      <Block title="Scented flowers">
        <P>Some flowers smell too sweet for bugs. In full bloom they keep bugs away from the whole room.</P>
        {scented.map(([k, mult]) => (
          <View key={k} style={styles.itemRow}>
            {TRADE_IMAGES[TRADE_FLOWERS[k]?.img] && <Image source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} style={styles.flowerImg} resizeMode="contain" />}
            <View style={{ flex: 1 }}>
              <Text style={styles.bugName}>{flowerName(k)}</Text>
              <Text style={styles.small}>{Math.round((1 - mult) * 100)}% fewer bugs in its room</Text>
            </View>
          </View>
        ))}
      </Block>
      <Block title="Pet helpers">
        {helpers.map((p) => (
          <View key={p.key} style={styles.itemRow}>
            {PET_IMAGES[p.key] && <Image source={PET_IMAGES[p.key]} style={styles.flowerImg} resizeMode="contain" />}
            <View style={{ flex: 1 }}>
              <Text style={styles.bugName}>{p.name}</Text>
              <Text style={styles.small}>{PET_SHORT[p.key] ?? p.effect.desc}</Text>
            </View>
          </View>
        ))}
      </Block>
    </>
  );
}

function UsingRemedies() {
  return (
    <>
      <Block title="Using a remedy">
        <P>Open the little bag at the bottom-left. Tap a remedy to pick it up, then tap the plant to use it on. Tap it again to put it back.</P>
        <P>A Bug Balm only works on a plant that has a bug. A Scent Sachet goes on a plant that is still growing, and hangs there until it wears off.</P>
      </Block>
      <Block title="Before you leave">
        <P>Bugs keep coming while you are away. Hang a Sachet on your favourite plants and keep a scented flower in bloom.</P>
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
];

export default function CareGuide({ tabs }) {
  const [spread, setSpread] = useState(0);
  const { left: Left, right: Right } = SPREADS[spread];
  const last = SPREADS.length - 1;

  const pager = (
    <View style={styles.pager}>
      <TouchableOpacity disabled={spread === 0} onPress={() => setSpread(spread - 1)} style={[styles.pageBtn, spread === 0 && styles.pageBtnOff]}>
        <Text style={styles.pageBtnTxt}>{'<'}</Text>
      </TouchableOpacity>
      <Text style={styles.pageNum}>Page {spread + 1} of {SPREADS.length}</Text>
      <TouchableOpacity disabled={spread === last} onPress={() => setSpread(spread + 1)} style={[styles.pageBtn, spread === last && styles.pageBtnOff]}>
        <Text style={styles.pageBtnTxt}>{'>'}</Text>
      </TouchableOpacity>
    </View>
  );

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
      pager={pager}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 6 },

  block: { marginBottom: 4 },
  heading: { fontFamily: PIXEL_FONT, fontSize: 8, color: '#5a7a2a', marginBottom: 3 },
  body: { fontFamily: BODY, color: INK, fontSize: 14, lineHeight: 16, marginBottom: 3 },
  small: { fontFamily: BODY, color: SOFT, fontSize: 12.5, lineHeight: 13 },
  swap: { fontFamily: BODY, color: INK, fontSize: 14, lineHeight: 16 },

  stageRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  stage: { alignItems: 'center', flex: 1 },
  stageImg: { width: 32, height: 38 },
  arrow: { position: 'absolute', right: -4, top: 14, color: SOFT, fontFamily: BODY, fontSize: 16 },

  // plain entries with a hairline between them, no boxes
  bugRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 2, marginBottom: 2, borderBottomWidth: 1, borderBottomColor: 'rgba(160,120,60,0.35)',
  },
  bugImgBox: { width: 52, alignItems: 'center', justifyContent: 'center' },
  bugName: { fontFamily: BODY, color: INK, fontSize: 15, marginBottom: 0 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  flowerImg: { width: 24, height: 24 },

  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pageBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  pageBtnOff: { opacity: 0.25 },
  pageBtnTxt: { fontFamily: PIXEL_FONT, color: '#7a3e1a', fontSize: 11 },
  pageNum: { fontFamily: BODY, color: SOFT, fontSize: 13 },
});
