import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { BOOK_MEDAL, BOOK_XP } from '../engine/assets';
import { useGame } from '../context/GameContext';
import { PixelText, COLORS } from './Pixel';
import { levelInfo, playerLevel, SEED_UNLOCK_LEVEL, POTTED_FLOWERS, HANGING_PLANTS, BOUQUET_PAPERS } from '../constants/gameData';

// Player level + XP bar. Tap for the XP numbers and what unlocks next.
export default function LevelBadge({ style, inline }) {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const info = levelInfo(state.player.xp ?? 0);
  const level = playerLevel(state.player);

  // Next level at which something new unlocks (seed or paper).
  const nextUnlock = (() => {
    const upcoming = [
      ...Object.entries(SEED_UNLOCK_LEVEL).map(([k, lv]) => ({ lv, name: `${POTTED_FLOWERS[k]?.name ?? HANGING_PLANTS[k]?.name ?? k} seeds` })),
      ...Object.values(BOUQUET_PAPERS).map((p) => ({ lv: p.level, name: `${p.name} paper` })),
    ].filter((u) => u.lv > level).sort((a, b) => a.lv - b.lv);
    if (!upcoming.length) return null;
    const lv = upcoming[0].lv;
    return { lv, names: upcoming.filter((u) => u.lv === lv).map((u) => u.name) };
  })();

  return (
    <TouchableOpacity style={[inline ? styles.inline : styles.wrap, style]} activeOpacity={inline ? 1 : 0.85} onPress={() => !inline && setOpen(!open)}>
      <View style={styles.badge}>
        {/* the painted medal, with the level written in its circle */}
        <View style={styles.medal}>
          <Image source={BOOK_MEDAL} style={styles.medalImg} resizeMode="contain" />
          <View style={styles.medalNum} pointerEvents="none">
            <PixelText size={level > 9 ? 8 : 10} color="#5a3410" style={{ textShadowRadius: 0 }}>{level}</PixelText>
          </View>
        </View>
        <View style={styles.bar}>
          <Image source={BOOK_XP.frame} style={styles.barFrame} resizeMode="stretch" />
          <View style={styles.barInner}>
            <View style={{ width: `${Math.round(info.progress * 100)}%`, height: '100%', overflow: 'hidden' }}>
              <Image source={BOOK_XP.fill} style={styles.barFill} resizeMode="stretch" />
            </View>
          </View>
        </View>
      </View>
      {(open || inline) && (
        <View style={[styles.tip, inline && { maxWidth: 320, marginTop: 8 }]}>
          <PixelText size={8}>{info.into} / {info.need} XP</PixelText>
          {nextUnlock && (
            <PixelText size={6} color="#cfe8a0" style={{ marginTop: 6, lineHeight: 11 }}>
              LV {nextUnlock.lv}: {nextUnlock.names.join(', ').toUpperCase()}
            </PixelText>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 31 },
  inline: { alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  medal: { width: 44, height: 51 },
  medalImg: { width: 44, height: 51 },
  medalNum: { position: 'absolute', left: 0, right: 0, top: 11, height: 22, alignItems: 'center', justifyContent: 'center' },
  bar: { width: 84, height: 14 },
  barFrame: { position: 'absolute', width: 84, height: 14 },
  barInner: { position: 'absolute', left: 7, right: 7, top: 4, bottom: 4, overflow: 'hidden' },
  barFill: { width: 70, height: 6 },
  tip: {
    marginTop: 4, backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a',
    borderRadius: 12, padding: 6, maxWidth: 190,
  },
});
