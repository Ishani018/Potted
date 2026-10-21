import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { PixelText, COLORS } from './Pixel';
import { levelInfo, playerLevel, SEED_UNLOCK_LEVEL, POTTED_FLOWERS, HANGING_PLANTS, BOUQUET_PAPERS } from '../constants/gameData';

// Player level + XP bar. Tap for the XP numbers and what unlocks next.
export default function LevelBadge({ style }) {
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
    <TouchableOpacity style={[styles.wrap, style]} activeOpacity={0.85} onPress={() => setOpen(!open)}>
      <View style={styles.badge}>
        <PixelText size={9} color={COLORS.gold}>LV {level}</PixelText>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${Math.round(info.progress * 100)}%` }]} />
        </View>
      </View>
      {open && (
        <View style={styles.tip}>
          <PixelText size={7}>{info.into} / {info.need} XP</PixelText>
          {nextUnlock && (
            <PixelText size={6} color="#cfe8a0" style={{ marginTop: 4 }}>
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
  badge: {
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 4, gap: 4,
  },
  bar: { height: 6, backgroundColor: '#2a1608', borderRadius: 2, overflow: 'hidden', minWidth: 54 },
  fill: { height: '100%', backgroundColor: COLORS.green },
  tip: {
    marginTop: 4, backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge,
    borderRadius: 4, padding: 6, maxWidth: 190,
  },
});
