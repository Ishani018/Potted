import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_IMAGES, SET_UI, UI_IMAGES } from '../engine/assets';
import { Skinned } from './NineSlice';
import Btn from './PaintedButton';
import { pixelText } from './Pixel';
import { HERBALIST, HERBALIST_TRADES, REMEDIES, TRADE_FLOWERS } from '../constants/gameData';
import { dayKey } from '../engine/petEffects';
import Portrait from './Portrait';
import RemedyIcon from './RemedyIcon';

// Granny Mae the herbalist strolls the town map. Tap her to take today's free Bug Balm
// or swap harvested flowers for more remedies — nothing here is bought with
// coins. A "!" bubble shows when she has something for you.
// Position is in the 1376×768 base space (feet on the floor); tune to the art.
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const INK = '#4a2a10';
const bw = (key, h) => h * SET_UI[key].w / SET_UI[key].h;

// Granny Mae's menu: today's free balm and herb swaps. Controlled: the map's walking Granny opens it. `onFlag` isn't needed.
export function useHerbalistFlag() {
  const { state } = useGame();
  const harvested = state.player.harvestedFlowers ?? {};
  const canClaim = state.player.herbalistDay !== dayKey(Date.now());
  return canClaim || HERBALIST_TRADES.some((t) => Object.entries(t.give).every(([k, n]) => (harvested[k] ?? 0) >= n));
}

export default function HerbalistMenu({ sw, sh, open, setOpen }) {
  const { state, dispatch } = useGame();
  if (!sw || !sh || !open) return null;

  const harvested = state.player.harvestedFlowers ?? {};
  const rem = state.player.remedies ?? {};
  const canClaim = state.player.herbalistDay !== dayKey(Date.now());
  const have = (k) => harvested[k] ?? 0;
  const canAfford = (t) => Object.entries(t.give).every(([k, n]) => have(k) >= n);
  const anyTrade = HERBALIST_TRADES.some(canAfford);

  return (
    <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setOpen(false)}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.panel, { width: Math.min(sw - 24, 420), maxHeight: sh - 20 }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(false)} style={styles.close}>
          <Image source={SET_UI.close.src} resizeMode="contain" style={{ width: bw('close', 34), height: 34 }} />
        </TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingBottom: 2 }}>
          <View style={styles.head}>
            <Portrait customerKey={HERBALIST.sprite} size={72} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name}>{HERBALIST.name}</Text>
              <Text style={styles.sub}>{HERBALIST.title}</Text>
              <View style={styles.bag}>
                <Text style={styles.sub}>Bag</Text>
                <RemedyIcon kind="balm" size={22} /><Text style={styles.label}>x{rem.balm ?? 0}</Text>
                <RemedyIcon kind="sachet" size={22} /><Text style={styles.label}>x{rem.sachet ?? 0}</Text>
              </View>
            </View>
          </View>

          <View style={styles.speech}>
            <Text style={styles.speechText}>{canClaim ? HERBALIST.greetDaily : HERBALIST.greetNone}</Text>
          </View>

          {/* today's gift: a ticket with a green CLAIM button, or a note that it is already taken */}
          <View style={styles.gift}>
            <RemedyIcon kind="balm" size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.giftTitle}>Today's free bug balm</Text>
              <Text style={styles.sub}>{canClaim ? 'A gift from Granny Mae, once a day.' : 'Already taken. Come back tomorrow!'}</Text>
            </View>
            {canClaim ? (
              <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.5} onPress={() => dispatch({ type: 'CLAIM_DAILY_REMEDY' })} style={{ paddingVertical: 8, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.claimText}>CLAIM</Text>
              </Skinned>
            ) : <Text style={styles.done}>✓</Text>}
          </View>

          <View style={styles.rule} />
          <Text style={styles.section}>Swap herbs for remedies</Text>
          {HERBALIST_TRADES.map((t) => {
            const ok = canAfford(t);
            return (
              <View key={t.id} style={styles.trade}>
                <View style={styles.give}>
                  {Object.entries(t.give).map(([k, n]) => (
                    <View key={k} style={styles.giveItem}>
                      {TRADE_IMAGES[TRADE_FLOWERS[k]?.img] && <Image source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} style={styles.flower} resizeMode="contain" />}
                      <Text style={[styles.label, { color: have(k) >= n ? '#3c6a28' : '#a63a2a' }]}>{Math.min(have(k), n)}/{n}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.arrow}>›</Text>
                <View style={styles.giveItem}>
                  <RemedyIcon kind={t.get} size={30} />
                  <Text style={styles.label}>{REMEDIES[t.get].name}</Text>
                </View>
                <Btn label="Swap" disabled={!ok} h={32} fontSize={14} onPress={() => dispatch({ type: 'TRADE_REMEDY', id: t.id })} />
              </View>
            );
          })}
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 250 },
  panel: { backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  close: { position: 'absolute', right: 8, top: 6, zIndex: 5 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 34 },
  name: { fontFamily: SERIF, fontSize: 22, color: INK, fontWeight: 'bold' },
  sub: { fontFamily: SERIF, fontSize: 13, color: '#7a5030' },
  label: { fontFamily: SERIF, fontSize: 13, color: INK },
  btnText: { fontFamily: SERIF, fontSize: 15, color: INK, fontWeight: 'bold', textAlign: 'center' },
  section: { fontFamily: SERIF, fontSize: 16, color: INK },
  speech: { backgroundColor: '#fbf0cf', borderRadius: 12, borderWidth: 2, borderColor: '#d2b27a', padding: 10 },
  speechText: { fontFamily: SERIF, fontSize: 14, color: INK, lineHeight: 19 },
  rule: { height: 3, backgroundColor: '#d2b27a', borderRadius: 2 },
  gift: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fbf0cf', borderRadius: 12, borderWidth: 2, borderColor: '#d2b27a', borderStyle: 'dashed', paddingVertical: 8, paddingHorizontal: 10 },
  giftTitle: { fontFamily: SERIF, fontSize: 16, color: INK, fontWeight: 'bold' },
  claimText: { ...pixelText(10, '#fff') },
  done: { fontFamily: SERIF, fontSize: 26, color: '#3c6a28', paddingHorizontal: 10 },
  trade: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between', backgroundColor: '#e8cf9a', borderRadius: 12, borderWidth: 2, borderColor: '#b98a4e', paddingVertical: 6, paddingHorizontal: 8 },
  give: { flexDirection: 'row', gap: 6 },
  giveItem: { alignItems: 'center', gap: 2 },
  arrow: { fontFamily: SERIF, fontSize: 22, color: INK },
  flower: { width: 28, height: 28 },
  bag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
