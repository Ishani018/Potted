import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { PixelPanel, PixelButton } from './Pixel';

export default function PlantPopup({ slot, position, onHarvest, onRemove, onClose }) {
  if (!slot) return null;

  // Full bloom = potted stage 3 (the harvestable stage).
  const canHarvest = slot.type === 'potted' && slot.stage === 3;

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={[styles.popup, { left: Math.min(position.x - 70, 260), top: Math.max(position.y - 140, 10) }]}>
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
