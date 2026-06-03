import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useGame } from '../context/GameContext';
import { INVENTORY_BG, SEED_IMAGES, POTTED_PLANT_IMAGES } from '../engine/assets';

// inventory.png is a 7×5 wooden grid (1226×912 native).
const GRID_COLS = 7;
const GRID_ROWS = 5;
const IMG_W = 1226;
const IMG_H = 912;

// ── Grid cell geometry (as fractions of the image) ───────────────────────────
// INSET_* = padding from the image edge to the first/last cell center band.
// Tweak these so the bags line up inside the painted slots.
const INSET_X = 0.06;   // left/right margin fraction
const INSET_Y = 0.065;  // top/bottom margin fraction
const BAG_FRAC = 0.10;  // bag size as a fraction of image width
const SHIFT_X = 0.01;  // uniform horizontal nudge (fraction of image width; + = right)
const SHIFT_Y = 0.009;      // uniform vertical nudge (+ = down)

function seedImg(flowerKey) { return SEED_IMAGES[flowerKey] ?? POTTED_PLANT_IMAGES._seed; }

// Full-screen inventory. Tap a seed bag → onPick(item) (parent holds it & closes).
export default function InventoryOverlay({ onClose, onPick }) {
  const { state } = useGame();
  const inventory = state.inventory ?? [];
  const { width: winW, height: winH } = useWindowDimensions();

  // Show the grid as a centered panel (not full-screen). Lower these fractions
  // to make the panel smaller. Aspect ratio is preserved.
  const maxW = winW * 0.42;
  const maxH = winH * 0.52;
  const scale = Math.min(maxW / IMG_W, maxH / IMG_H);
  const dispW = IMG_W * scale;
  const dispH = IMG_H * scale;
  const bag = Math.round(IMG_W * BAG_FRAC * scale);

  // Cell center for index i, in displayed-image pixel coords.
  const cellCenter = (i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const usableW = dispW * (1 - 2 * INSET_X);
    const usableH = dispH * (1 - 2 * INSET_Y);
    const x = dispW * INSET_X + (usableW * (col + 0.5)) / GRID_COLS + dispW * SHIFT_X;
    const y = dispH * INSET_Y + (usableH * (row + 0.5)) / GRID_ROWS + dispH * SHIFT_Y;
    return { x, y };
  };

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      {/* Stop taps on the grid from closing */}
      <TouchableOpacity activeOpacity={1} onPress={() => { }}>
        <View style={{ width: dispW, height: dispH }}>

          {/* ✕ close button — top-right of panel */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Image source={INVENTORY_BG} style={{ width: dispW, height: dispH }} resizeMode="contain" />

          {inventory.slice(0, GRID_COLS * GRID_ROWS).map((item, i) => {
            const c = cellCenter(i);
            return (
              <TouchableOpacity
                key={item.id}
                style={{ position: 'absolute', left: c.x - bag / 2, top: c.y - bag / 2, width: bag, height: bag }}
                activeOpacity={0.7}
                onPress={() => onPick(item)}
              >
                <Image source={seedImg(item.flowerKey)} style={{ width: bag, height: bag }} resizeMode="contain" />
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9000,
  },
  closeBtn: {
    position: 'absolute',
    top: -14,
    right: -14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3d1800',
    borderWidth: 2,
    borderColor: '#c8873a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeTxt: { color: '#ffe8a0', fontSize: 15, fontWeight: 'bold', lineHeight: 18 },
});
