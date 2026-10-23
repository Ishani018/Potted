import React, { useEffect, useRef, useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES, HPLANT_IMAGES, PPLANT_IMAGES, UI_IMAGES } from '../engine/assets';
import PottedArt, { pottedLayout } from './PottedArt';
import HangingArt, { hangingBox } from './HangingArt';
import { projectSize } from '../engine/project';
import { useLayout } from '../context/LayoutContext';
import { isThirsty } from '../engine/gameEngine';
import { FLOWER_STAGE_SCALE, PEST_CONFIG, isShielded } from '../constants/gameData';
import { useGame } from '../context/GameContext';
import RemedyIcon from './RemedyIcon';
import Pest from './Pest';

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

// Fallback aspect ratios (h/w), used only until the real image size is known.
// Each flower's PNGs have different dimensions, so useImageAspect() reads the
// actual size per image — a hardcoded aspect makes resizeMode="contain" shrink
// the image and float the pot above the shelf.
// Natural aspect ratio (h/w) per stage — potted (0=seed,1=bud,2=slight,3=bloom)
const POTTED_ASPECT = { 0: 344 / 347, 1: 673 / 351, 2: 1, 3: 1 };

// Natural aspect ratio (h/w) per stage — hanging (0=seed,1=bud,2=full)
// Stage 0: emptyhangingpotwithseed 1024×1024 = 1:1; 1-2 assumed square.
const HANGING_ASPECT = { 0: 891 / 367, 1: 1, 2: 1 };
// ────────────────────────────────────────────────────────────────────────────

// Real h/w of a bundled image. Native: resolveAssetSource is synchronous.
// Web: the require() result may carry width/height, else fall back to getSize.
const aspectCache = new Map();
function readAspectSync(img) {
  if (!img) return null;
  if (aspectCache.has(img)) return aspectCache.get(img);
  const src = Image.resolveAssetSource ? Image.resolveAssetSource(img) : img;
  if (src && src.width && src.height) {
    const a = src.height / src.width;
    aspectCache.set(img, a);
    return a;
  }
  return null;
}
function imageUri(img) {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object') return img.uri || img.default || null;
  return null;
}
function useImageAspect(img) {
  const [aspect, setAspect] = useState(() => readAspectSync(img));
  useEffect(() => {
    const sync = readAspectSync(img);
    if (sync) { setAspect(sync); return; }
    setAspect(null);
    const uri = imageUri(img);
    if (!uri) return;
    let alive = true;
    Image.getSize(uri, (w, h) => {
      if (!w || !h) return;
      aspectCache.set(img, h / w);
      if (alive) setAspect(h / w);
    }, () => {});
    return () => { alive = false; };
  }, [img]);
  return aspect;
}

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

export default function PlantSlot({ slot, position, onPress, onPestPress, baseWidthOverride, aspectOverride, potHeightOverride, potWidthOverride }) {
  const { width: sw, height: sh } = useLayout();
  const { state } = useGame();
  const armed = !!state.heldRemedy;   // a remedy is picked up: taps go to the plant
  const isPotted = slot.type === 'potted';
  // Hanging plants with the new art: a chosen pot (bare while a seed) with the plant drawn on top of its rim.
  const newHang = !isPotted && !!slot.flowerKey && !!HPLANT_IMAGES[slot.flowerKey];
  const potStyle = slot.pot ?? 'macrame';
  // Shelf plants with the new art: a chosen pot (bare while a seed) with the plant growing out of its soil.
  const newPot = isPotted && !!slot.flowerKey && !!PPLANT_IMAGES[slot.flowerKey];
  const shelfPot = slot.pot ?? 4;
  // baseWidthOverride lets a room set its own hanging-pot width (room 2) without
  // affecting other rooms that use the shared BASE_HANGING_W.
  const baseW = baseWidthOverride ?? (isPotted ? BASE_POT_W : BASE_HANGING_W);
  // Per-flower, per-stage scale compensates for each PNG's tight crop (stage 0
  // uses the shared pot image, so it's never scaled).
  const stageScale = slot.stage > 0
    ? (FLOWER_STAGE_SCALE[slot.flowerKey]?.[slot.stage] ?? 1)
    : 1;
  const imgW = Math.round(projectSize(baseW, sw, sh) * stageScale);
  const img = getPlantImage(slot);
  const realAspect = useImageAspect(img);
  // Box matches the image's real proportions so nothing is letterboxed: the pot
  // stays on the shelf and each stage grows upward. aspectOverride still wins.
  const aspect = aspectOverride ?? realAspect ?? (isPotted
    ? (POTTED_ASPECT[slot.stage] ?? 1)
    : (HANGING_ASPECT[slot.stage] ?? 1));
  const imgH = Math.round(imgW * aspect);

  const left = position.x - imgW / 2;
  const top = isPotted ? position.y - imgH : position.y;

  // A pest replaces the thirsty hint — it has to go before the plant can grow.
  const thirsty = isThirsty(slot) && !slot.pest;
  const drop = Math.round(Math.max(imgW * 0.26, 18)); // water-drop badge size
  // Pest sits on the foliage: size from the un-scaled pot width so it's the same
  // on every flower (base px, scaled to the screen); PEST_X/PEST_Y are fractions
  // of the plant box for the pest's centre.
  const pestSize = Math.round(projectSize(isPotted ? 58 : 64, sw, sh));
  const PEST_X = 0.55;
  const PEST_Y = isPotted ? 0.42 : 0.5;

  // Use raw responder instead of TouchableOpacity so the watering can's pan
  // gesture always wins — TouchableOpacity intercepts drags and causes a jump.
  const pressStart = useRef(null);
  if (newPot) {
    const potW = Math.round(projectSize(potWidthOverride ?? 90, sw, sh));
    const L = pottedLayout(shelfPot, slot.flowerKey, slot.stage, potW);
    return (
      <View
        style={[styles.container, { left: position.x - L.anchorX, top: position.y - L.anchorBottom, width: L.boxW, height: L.boxH }]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => { pressStart.current = Date.now(); }}
        onResponderRelease={() => { if (pressStart.current && Date.now() - pressStart.current < 300) onPress(slot, position); pressStart.current = null; }}
      >
        <PottedArt layout={L} potW={potW} wilting={slot.wilting} />
        {thirsty && <Image source={UI_IMAGES.waterdrop} style={{ position: 'absolute', width: Math.round(potW * 0.26), height: Math.round(potW * 0.3), left: L.anchorX - potW * 0.13, top: -potW * 0.1, zIndex: 9 }} resizeMode="contain" />}
        {slot.pest && <Pest type={slot.pest} size={Math.round(projectSize(58, sw, sh))} cx={L.anchorX} cy={L.boxH * 0.4} onClear={() => onPestPress && onPestPress(slot)} armed={armed} interactive={PEST_CONFIG.handClearing} />}
        {isShielded(slot) && (
          <View style={{ position: 'absolute', right: -Math.round(potW * 0.06), top: Math.round(L.boxH * 0.1), zIndex: 9 }} pointerEvents="none">
            <RemedyIcon kind="sachet" size={Math.max(18, Math.round(potW * 0.3))} />
          </View>
        )}
      </View>
    );
  }
  if (newHang) {
    const ph = Math.round(projectSize(potHeightOverride ?? 150, sw, sh));
    const bx = hangingBox(potStyle, ph);
    return (
      <View
        style={[styles.container, { left: position.x - bx.hookX, top: position.y, width: bx.w, height: ph }]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => { pressStart.current = Date.now(); }}
        onResponderRelease={() => { if (pressStart.current && Date.now() - pressStart.current < 300) onPress(slot, position); pressStart.current = null; }}
      >
        <HangingArt pot={potStyle} plantKey={slot.flowerKey} stage={slot.stage} h={ph} wilting={slot.wilting} />
        {thirsty && <Image source={UI_IMAGES.waterdrop} style={{ position: 'absolute', width: Math.round(ph * 0.1), height: Math.round(ph * 0.116), left: bx.hookX - ph * 0.05, top: ph * 0.2, zIndex: 9 }} resizeMode="contain" />}
        {slot.pest && <Pest type={slot.pest} size={Math.round(projectSize(64, sw, sh))} cx={bx.hookX} cy={ph * 0.6} onClear={() => onPestPress && onPestPress(slot)} armed={armed} interactive={PEST_CONFIG.handClearing} />}
        {isShielded(slot) && (
          <View style={{ position: 'absolute', right: -Math.round(ph * 0.02), top: Math.round(ph * 0.3), zIndex: 9 }} pointerEvents="none">
            <RemedyIcon kind="sachet" size={Math.max(18, Math.round(ph * 0.14))} />
          </View>
        )}
      </View>
    );
  }
  if (!img) return null;
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
      {/* Thirsty water-drop hint (pixel droplet sprite) */}
      {thirsty && (
        <Image
          source={UI_IMAGES.waterdrop}
          style={{ position: 'absolute', width: drop, height: drop * (14 / 12), left: imgW / 2 - drop / 2, top: -drop * 1.1, zIndex: 9 }}
          resizeMode="contain"
        />
      )}
      {slot.pest && (
        <Pest
          type={slot.pest}
          size={pestSize}
          cx={imgW * PEST_X}
          cy={imgH * PEST_Y}
          onClear={() => onPestPress && onPestPress(slot)}
          armed={armed}
          interactive={PEST_CONFIG.handClearing}
        />
      )}
      {/* a Scent Sachet hangs on the plant while it's protected */}
      {isShielded(slot) && (
        <View style={{ position: 'absolute', right: -Math.round(imgW * 0.06), top: Math.round(imgH * 0.04), zIndex: 9 }} pointerEvents="none">
          <RemedyIcon kind="sachet" size={Math.max(18, Math.round(imgW * 0.3))} />
        </View>
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
});
