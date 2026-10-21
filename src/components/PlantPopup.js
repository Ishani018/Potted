import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { PixelPanel, PixelButton, PixelText, COLORS } from './Pixel';
import { useLayout } from '../context/LayoutContext';
import { projectSize } from '../engine/project';
import { msUntilThirsty, maxStageFor } from '../engine/gameEngine';
import { POTTED_FLOWERS, HANGING_PLANTS, formatDuration } from '../constants/gameData';

// Re-render every `ms` so countdowns tick while the popup is open.
function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

// What the plant needs right now → { text, color }.
function plantStatus(slot, now) {
  const max = maxStageFor(slot.type);
  if (slot.pest) return { text: 'A BUG! SHOO IT AWAY', color: '#ff9a7a' };
  if (slot.stage >= max) {
    return slot.type === 'potted'
      ? { text: 'FULL BLOOM - READY!', color: COLORS.gold }
      : { text: 'FULL BLOOM - EARNS COINS', color: COLORS.gold };
  }
  if (slot.wilting) return { text: 'WILTING - WATER ME!', color: '#ff9a7a' };
  const wait = msUntilThirsty(slot, now);
  if (wait === 0) return { text: 'THIRSTY - WATER ME!', color: '#7ad0ff' };
  return { text: `THIRSTY IN ${formatDuration(wait).toUpperCase()}`, color: '#fff' };
}

export default function PlantPopup({ slot, position, onHarvest, onRemove, onClose }) {
  const { width: sw, height: sh } = useLayout();
  const now = useNow(1000);
  if (!slot) return null;

  // Full bloom is harvestable: potted stage 3, hanging stage 2.
  const canHarvest = !!slot.flowerKey && slot.stage >= maxStageFor(slot.type);
  const hasPlant = !!slot.flowerKey;
  const name = POTTED_FLOWERS[slot.flowerKey]?.name ?? HANGING_PLANTS[slot.flowerKey]?.name;
  const status = hasPlant ? plantStatus(slot, now) : null;

  // Sit the popup right on the tapped plant: centred over a shelf pot, or just
  // under the hook for a hanging one. Clamped so it never leaves the screen.
  const W = 190;
  const H = (canHarvest ? 112 : 58) + (hasPlant ? 46 : 0);
  const plantH = projectSize(slot.type === 'potted' ? 120 : 140, sw, sh);
  const left = Math.max(8, Math.min(position.x - W / 2, sw - W - 8));
  const rawTop = slot.type === 'potted' ? position.y - plantH * 0.75 - H : position.y + plantH * 0.35;
  const top = Math.max(8, Math.min(rawTop, sh - H - 8));

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={[styles.popup, { left, top, width: W }]}>
        <PixelPanel>
          <View style={{ gap: 8 }}>
            {hasPlant && (
              <View style={styles.info}>
                <PixelText size={9} color={COLORS.gold}>{(name ?? '').toUpperCase()}</PixelText>
                <PixelText size={7} color={status.color} style={{ textAlign: 'center' }}>{status.text}</PixelText>
              </View>
            )}
            {canHarvest && <PixelButton label="HARVEST" onPress={onHarvest} />}
            <PixelButton label="REMOVE" tone="wood" onPress={onRemove} />
          </View>
        </PixelPanel>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  popup: { position: 'absolute' },
  info: { alignItems: 'center', gap: 5, paddingBottom: 2 },
});
