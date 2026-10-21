import React, { useState } from 'react';
import { View, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_IMAGES } from '../engine/assets';
import { HERBALIST, HERBALIST_TRADES, REMEDIES, TRADE_FLOWERS } from '../constants/gameData';
import { dayKey } from '../engine/petEffects';
import { PixelPanel, PixelButton, PixelText, COLORS } from './Pixel';
import HerbalistSprite, { HERBALIST_ASPECT } from './HerbalistSprite';
import Portrait from './Portrait';
import RemedyIcon from './RemedyIcon';

// Granny Mae the herbalist waits at the Home screen. Tap her to take today's free Bug Balm
// or swap harvested flowers for more remedies — nothing here is bought with
// coins. A "!" bubble shows when she has something for you.
// Position is in the 1376×768 base space (feet on the floor); tune to the art.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
export const HERBALIST_SPOT = { x: 1210, feetY: 700, h: 270 };

export default function HerbalistCorner({ sw, sh }) {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false);
  if (!sw || !sh) return null;

  const harvested = state.player.harvestedFlowers ?? {};
  const rem = state.player.remedies ?? {};
  const canClaim = state.player.herbalistDay !== dayKey(Date.now());
  const have = (k) => harvested[k] ?? 0;
  const canAfford = (t) => Object.entries(t.give).every(([k, n]) => have(k) >= n);
  const anyTrade = HERBALIST_TRADES.some(canAfford);

  const h = HERBALIST_SPOT.h * (sh / PLOPPER_H);
  const w = h * HERBALIST_ASPECT;
  const left = HERBALIST_SPOT.x * (sw / PLOPPER_W) - w / 2;
  const top = HERBALIST_SPOT.feetY * (sh / PLOPPER_H) - h;
  const flag = canClaim || anyTrade;

  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(true)} style={{ position: 'absolute', left, top, width: w, height: h, zIndex: 20 }}>
        <HerbalistSprite height={h} />
        {flag && <View style={styles.bubble}><PixelText size={Math.max(8, Math.round(h * 0.07))} color={COLORS.gold}>!</PixelText></View>}
      </TouchableOpacity>

      {open && (
        <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: Math.min(sw - 24, 400), maxHeight: sh - 24 }}>
            <PixelPanel>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
                <View style={styles.head}>
                  <Portrait customerKey={HERBALIST.sprite} size={72} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <PixelText size={11} color={COLORS.gold}>{HERBALIST.name.toUpperCase()}</PixelText>
                    <PixelText size={7}>{HERBALIST.title}</PixelText>
                    {/* what you're carrying */}
                    <View style={styles.bag}>
                      <PixelText size={6}>BAG</PixelText>
                      <RemedyIcon kind="balm" size={20} /><PixelText size={8}>x{rem.balm ?? 0}</PixelText>
                      <RemedyIcon kind="sachet" size={20} /><PixelText size={8}>x{rem.sachet ?? 0}</PixelText>
                    </View>
                  </View>
                </View>

                <View style={styles.speech}>
                  <PixelText size={8} color="#5a3410" style={{ lineHeight: 14 }}>{canClaim ? HERBALIST.greetDaily : HERBALIST.greetNone}</PixelText>
                </View>

                {/* today's free balm */}
                <View style={styles.row}>
                  <RemedyIcon kind="balm" size={34} />
                  <View style={{ flex: 1 }}>
                    <PixelButton
                      label={canClaim ? "TAKE TODAY'S BUG BALM" : 'BACK TOMORROW FOR MORE'}
                      size={8}
                      disabled={!canClaim}
                      onPress={() => dispatch({ type: 'CLAIM_DAILY_REMEDY' })}
                    />
                  </View>
                </View>

                {/* swaps */}
                <PixelText size={8} color="#cfe8a0">SWAP HERBS FOR REMEDIES</PixelText>
                {HERBALIST_TRADES.map((t) => {
                  const ok = canAfford(t);
                  return (
                    <View key={t.id} style={styles.trade}>
                      <View style={styles.give}>
                        {Object.entries(t.give).map(([k, n]) => (
                          <View key={k} style={styles.giveItem}>
                            {TRADE_IMAGES[TRADE_FLOWERS[k]?.img] && <Image source={TRADE_IMAGES[TRADE_FLOWERS[k].img]} style={styles.flower} resizeMode="contain" />}
                            <PixelText size={7} color={have(k) >= n ? '#cfe8a0' : '#ff9a7a'}>{Math.min(have(k), n)}/{n}</PixelText>
                          </View>
                        ))}
                      </View>
                      <PixelText size={9}>›</PixelText>
                      <View style={styles.giveItem}>
                        <RemedyIcon kind={t.get} size={28} />
                        <PixelText size={7}>{REMEDIES[t.get].name.toUpperCase()}</PixelText>
                      </View>
                      <PixelButton label="SWAP" size={8} disabled={!ok} onPress={() => dispatch({ type: 'TRADE_REMEDY', id: t.id })} style={{ paddingHorizontal: 10, paddingVertical: 7 }} />
                    </View>
                  );
                })}
                <PixelButton label="CLOSE" tone="wood" size={9} onPress={() => setOpen(false)} />
              </ScrollView>
            </PixelPanel>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute', top: -6, right: -4,
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', zIndex: 250,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  speech: { backgroundColor: '#fbf0cf', borderRadius: 4, borderWidth: 2, borderColor: COLORS.creamEdge, padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trade: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between',
    backgroundColor: 'rgba(42,22,8,0.35)', borderRadius: 4, paddingVertical: 4, paddingHorizontal: 6,
  },
  give: { flexDirection: 'row', gap: 6 },
  giveItem: { alignItems: 'center', gap: 2 },
  flower: { width: 26, height: 26 },
  bag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
