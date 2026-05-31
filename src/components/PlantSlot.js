import React, { useRef } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES } from '../engine/assets';
import { projectSize } from '../engine/project';
import { useLayout } from '../context/LayoutContext';

// ── Pot display size (base coords against 1376×768) ─────────────────────────
// BASE_POT_W is the fixed width for ALL stages. Height scales by natural aspect
// ratio so the pot bottom always sits on the shelf and flowers grow upward.
// Tweak BASE_POT_W to resize everything uniformly.
// ── Pot/plant display sizes (base coords against 1376×768) ──────────────────
// All sizes are scaled proportionally to screen via projectSize.
// Increase to make bigger, decrease to make smaller.
const BASE_POT_W = 90;       // ← Room 1 potted pot width — CHANGE THIS
const BASE_HANGING_W = 75;  // ← Room 2 hanging pot width — CHANGE THIS
// ────────────────────────────────────────────────────────────────────────────

// Natural aspect ratio (h/w) per stage — potted
const POTTED_ASPECT = { 0: 344 / 347, 1: 673 / 351, 2: 1, 3: 1, 4: 1 };

// Natural aspect ratio (h/w) per stage — hanging
// Stage 0: emptyhangingpotwithseed 1024×1024 = 1:1
// Stage 1-2: hanging plant images 1024×1024 = 1:1 (assumed square)
// hangingpotwithseedvisible (shown as _seedVisible): 891/367 ≈ 2.43
const HANGING_ASPECT = { 0: 891 / 367, 1: 1, 2: 1, 3: 1 };
// ────────────────────────────────────────────────────────────────────────────

function getPlantImage(slot) {
  if (!slot.flowerKey) return null;

  if (slot.type === 'potted') {
    if (slot.stage === 0) return POTTED_PLANT_IMAGES._seedVisible;
    if (slot.isDead || slot.stage === 4) return POTTED_PLANT_IMAGES._dead;
    const imgs = POTTED_PLANT_IMAGES[slot.flowerKey];
    if (!imgs) return POTTED_PLANT_IMAGES._seed;
    return imgs[slot.stage - 1] ?? imgs[0];
  }

  // hanging
  if (slot.stage === 0) return HANGING_PLANT_IMAGES._seedVisible;
  if (slot.isDead || slot.stage === 3) {
    const imgs = HANGING_PLANT_IMAGES[slot.flowerKey];
    return imgs ? imgs[2] : HANGING_PLANT_IMAGES._seed;
  }
  const imgs = HANGING_PLANT_IMAGES[slot.flowerKey];
  if (!imgs) return HANGING_PLANT_IMAGES._seed;
  return imgs[slot.stage - 1] ?? imgs[0];
}

export default function PlantSlot({ slot, position, onPress, baseWidthOverride, aspectOverride }) {
  const { width: sw, height: sh } = useLayout();
  const isPotted = slot.type === 'potted';
  // baseWidthOverride lets a room set its own hanging-pot width (room 2) without
  // affecting other rooms that use the shared BASE_HANGING_W.
  const baseW = baseWidthOverride ?? (isPotted ? BASE_POT_W : BASE_HANGING_W);
  const imgW = Math.round(projectSize(baseW, sw, sh));
  // aspectOverride lets a room force its own h/w ratio (room 2 keeps stage 0 square
  // to match emptyhangingpotwithseed) without touching the shared aspect tables.
  const aspect = aspectOverride ?? (isPotted
    ? (POTTED_ASPECT[slot.stage] ?? 1)
    : (HANGING_ASPECT[slot.stage] ?? 1));
  const imgH = Math.round(imgW * aspect);

  const img = getPlantImage(slot);
  if (!img) return null;

  const left = position.x - imgW / 2;
  const top = isPotted ? position.y - imgH : position.y;

  // Use raw responder instead of TouchableOpacity so the watering can's pan
  // gesture always wins — TouchableOpacity intercepts drags and causes a jump.
  const pressStart = useRef(null);
  return (
    <View
      style={[styles.container, { left, top, width: imgW, height: imgH }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => { pressStart.current = Date.now(); }}
      onResponderRelease={() => {
        if (pressStart.current && Date.now() - pressStart.current < 300) {
          onPress(slot, position);
        }
        pressStart.current = null;
      }}
    >
      <Image source={img} style={{ width: imgW, height: imgH }} resizeMode="contain" />
      {slot.isDead && <View style={styles.deadOverlay} />}
    </View>
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
