import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { PixelPanel, PixelButton } from './Pixel';
import { useLayout } from '../context/LayoutContext';
import { projectSize } from '../engine/project';

export default function PlantPopup({ slot, position, onHarvest, onRemove, onClose }) {
  const { width: sw, height: sh } = useLayout();
  if (!slot) return null;

  // Full bloom = potted stage 3 (the harvestable stage).
  const canHarvest = slot.type === 'potted' && slot.stage === 3;

  // Sit the popup right on the tapped plant: centred over a shelf pot, or just
  // under the hook for a hanging one. Clamped so it never leaves the screen.
  const W = 140, H = canHarvest ? 112 : 58;
  const plantH = projectSize(slot.type === 'potted' ? 120 : 140, sw, sh);
  const left = Math.max(8, Math.min(position.x - W / 2, sw - W - 8));
  const rawTop = slot.type === 'potted' ? position.y - plantH * 0.75 - H : position.y + plantH * 0.35;
  const top = Math.max(8, Math.min(rawTop, sh - H - 8));

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={[styles.popup, { left: left, top: top }]}>
        <PixelPanel>
          <View style={{ gap: 8 }}>
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
  popup: { position: 'absolute', minWidth: 140 },
});
