import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES } from '../engine/assets';

// Returns the correct image source for a slot
function getPlantImage(slot) {
  if (!slot.flowerKey) return null;

  if (slot.type === 'hanging') {
    if (slot.stage === 0) return HANGING_PLANT_IMAGES._seed;
    if (slot.isDead || slot.stage === 3) {
      const imgs = HANGING_PLANT_IMAGES[slot.flowerKey];
      return imgs ? imgs[2] : HANGING_PLANT_IMAGES._seed;
    }
    const imgs = HANGING_PLANT_IMAGES[slot.flowerKey];
    if (!imgs) return HANGING_PLANT_IMAGES._seed;
    // stage 1 = bud (index 0), stage 2 = full (index 1)
    return imgs[slot.stage - 1] ?? imgs[0];
  }

  // potted
  if (slot.stage === 0) return POTTED_PLANT_IMAGES._seed;
  if (slot.isDead || slot.stage === 4) return POTTED_PLANT_IMAGES._dead;
  const imgs = POTTED_PLANT_IMAGES[slot.flowerKey];
  if (!imgs) return POTTED_PLANT_IMAGES._seed;
  // stage 1=bud(0), 2=slight(1), 3=bloom(2) — array is 0-indexed growth stages
  return imgs[slot.stage - 1] ?? imgs[0];
}

export default function PlantSlot({ slot, position, onPress }) {
  const isPotted = slot.type === 'potted';
  const imgW = isPotted ? 70 : 90;
  const imgH = isPotted ? 90 : 110;

  const img = getPlantImage(slot);
  if (!img) return null;

  // Anchor: bottom-center for potted, top-center for hanging
  const left = isPotted ? position.x - imgW / 2 : position.x - imgW / 2;
  const top  = isPotted ? position.y - imgH     : position.y;

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
  container: {
    position: 'absolute',
  },
  deadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(80,0,0,0.18)',
    borderRadius: 4,
  },
});
