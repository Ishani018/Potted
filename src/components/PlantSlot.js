import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES } from '../engine/assets';
import { projectSize } from '../engine/project';
import { useLayout } from '../context/LayoutContext';

// ── Pot display size (base coords against 1376×768) ─────────────────────────
// Increase BASE_POT_W / BASE_POT_H to make pots bigger, decrease to shrink.
// These are scaled proportionally to the screen via projectSize.
const BASE_POT_W = 90;  // pot width  — tweak this
const BASE_POT_H = 115; // pot height — tweak this
// ────────────────────────────────────────────────────────────────────────────

function getPlantImage(slot) {
  if (!slot.flowerKey) return null;

  if (slot.type === 'potted') {
    if (slot.stage === 0) return POTTED_PLANT_IMAGES._seed;
    if (slot.isDead || slot.stage === 4) return POTTED_PLANT_IMAGES._dead;
    const imgs = POTTED_PLANT_IMAGES[slot.flowerKey];
    if (!imgs) return POTTED_PLANT_IMAGES._seed;
    return imgs[slot.stage - 1] ?? imgs[0];
  }

  // hanging
  if (slot.stage === 0) return HANGING_PLANT_IMAGES._seed;
  if (slot.isDead || slot.stage === 3) {
    const imgs = HANGING_PLANT_IMAGES[slot.flowerKey];
    return imgs ? imgs[2] : HANGING_PLANT_IMAGES._seed;
  }
  const imgs = HANGING_PLANT_IMAGES[slot.flowerKey];
  if (!imgs) return HANGING_PLANT_IMAGES._seed;
  return imgs[slot.stage - 1] ?? imgs[0];
}

export default function PlantSlot({ slot, position, onPress }) {
  const { width: sw, height: sh } = useLayout();
  const isPotted = slot.type === 'potted';
  const imgW = Math.round(projectSize(isPotted ? BASE_POT_W : 130, sw, sh));
  const imgH = Math.round(projectSize(isPotted ? BASE_POT_H : 160, sw, sh));

  const img = getPlantImage(slot);
  if (!img) return null;

  const left = position.x - imgW / 2;
  const top = isPotted ? position.y - imgH : position.y;

  return (
    <TouchableOpacity
      style={[styles.container, { left, top, width: imgW, height: imgH }]}
      onPress={() => onPress(slot, position)}
      activeOpacity={0.85}
    >
      <Image source={img} style={{ width: imgW, height: imgH }} resizeMode="contain" />
      {slot.isDead && <View style={styles.deadOverlay} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute' },
  deadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(80,0,0,0.18)',
    borderRadius: 4,
  },
});
