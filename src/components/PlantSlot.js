import React, { useRef } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES } from '../engine/assets';
import { projectSize } from '../engine/project';
import { useLayout } from '../context/LayoutContext';
import { isThirsty } from '../engine/gameEngine';
import { FLOWER_STAGE_SCALE } from '../constants/gameData';

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

// Natural aspect ratio (h/w) per stage — potted (0=seed,1=bud,2=slight,3=bloom)
const POTTED_ASPECT = { 0: 344 / 347, 1: 673 / 351, 2: 1, 3: 1 };

// Natural aspect ratio (h/w) per stage — hanging (0=seed,1=bud,2=full)
// Stage 0: emptyhangingpotwithseed 1024×1024 = 1:1; 1-2 assumed square.
const HANGING_ASPECT = { 0: 891 / 367, 1: 1, 2: 1 };
// ────────────────────────────────────────────────────────────────────────────

function getPlantImage(slot) {
  if (!slot.flowerKey) return null;

  if (slot.type === 'potted') {
    if (slot.stage <= 0) return POTTED_PLANT_IMAGES._seedVisible;
    const imgs = POTTED_PLANT_IMAGES[slot.flowerKey];
    if (!imgs || !imgs.length) return POTTED_PLANT_IMAGES._seed;
    // Clamp (old saves may have stage 4 from the previous death model).
    const idx = Math.min(slot.stage - 1, imgs.length - 1);
    return imgs[idx] ?? imgs[0];
  }

  // hanging
  if (slot.stage <= 0) return HANGING_PLANT_IMAGES._seedVisible;
  const imgs = HANGING_PLANT_IMAGES[slot.flowerKey];
  if (!imgs || !imgs.length) return HANGING_PLANT_IMAGES._seed;
  const idx = Math.min(slot.stage - 1, imgs.length - 1);
  return imgs[idx] ?? imgs[0];
}

export default function PlantSlot({ slot, position, onPress, baseWidthOverride, aspectOverride }) {
  const { width: sw, height: sh } = useLayout();
  const isPotted = slot.type === 'potted';
  // baseWidthOverride lets a room set its own hanging-pot width (room 2) without
  // affecting other rooms that use the shared BASE_HANGING_W.
  const baseW = baseWidthOverride ?? (isPotted ? BASE_POT_W : BASE_HANGING_W);
  // Per-flower, per-stage scale compensates for each PNG's tight crop (stage 0
  // uses the shared pot image, so it's never scaled).
  const stageScale = slot.stage > 0
    ? (FLOWER_STAGE_SCALE[slot.flowerKey]?.[slot.stage] ?? 1)
    : 1;
  const imgW = Math.round(projectSize(baseW, sw, sh) * stageScale);
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

  const thirsty = isThirsty(slot);
  const drop = Math.round(imgW * 0.22); // water-drop badge size

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
      <Image
        source={img}
        style={{ width: imgW, height: imgH, opacity: slot.wilting ? 0.55 : 1 }}
        resizeMode="contain"
      />
      {/* Wilting tint — washed-out, never a "dead" red */}
      {slot.wilting && <View style={styles.wiltOverlay} />}
      {/* Thirsty water-drop hint (CSS droplet — no asset needed) */}
      {thirsty && (
        <View style={[styles.drop, { width: drop, height: drop, left: imgW / 2 - drop / 2, top: -drop * 0.6 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute' },
  // Wilting = desaturated/grey wash (cozy, not death). Watering revives.
  wiltOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(90,80,40,0.28)',
    borderRadius: 4,
  },
  // Droplet shape: a rounded square rounded extra on 3 corners, rotated 45°.
  drop: {
    position: 'absolute',
    backgroundColor: '#5bc0f0',
    borderColor: '#2a90c8',
    borderWidth: 1.5,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    borderBottomLeftRadius: 3,
    transform: [{ rotate: '45deg' }],
    zIndex: 9,
  },
});
