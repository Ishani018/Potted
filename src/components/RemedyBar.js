import React, { useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { REMEDIES, SACHET_MS, isShielded, formatDuration } from '../constants/gameData';
import { maxStageFor } from '../engine/gameEngine';
import { PixelText, COLORS } from './Pixel';
import HeldSeedBanner from './HeldSeedBanner';
import RemedyIcon from './RemedyIcon';

// The bag of herbalist remedies, shown in the garden rooms. Tap a remedy to pick
// it up (tap again to put it back), then tap a plant to use it. Hidden while the
// bag is empty. Position is in the 1376×768 base space, next to the inventory button.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const TRAY = { x: 140, y: 717, item: 66, gap: 10 };

const HINTS = {
  balm: 'TAP A PLANT WITH A BUG TO USE BUG BALM',
  sachet: 'TAP A GROWING PLANT TO HANG A SCENT SACHET ON IT',
};

export default function RemedyBar({ sw, sh }) {
  const { state, dispatch } = useGame();
  if (!sw || !sh) return null;
  const rem = state.player.remedies ?? {};
  const held = state.heldRemedy;
  const kinds = ['balm', 'sachet'].filter((k) => (rem[k] ?? 0) > 0);

  const item = (TRAY.item / PLOPPER_W) * sw;
  const gap = (TRAY.gap / PLOPPER_W) * sw;
  const cy = (TRAY.y / PLOPPER_H) * sh;
  const left0 = (TRAY.x / PLOPPER_W) * sw;

  return (
    <>
      {kinds.map((k, i) => {
        const on = held === k;
        return (
          <TouchableOpacity
            key={k}
            activeOpacity={0.8}
            onPress={() => dispatch({ type: 'HOLD_REMEDY', kind: k })}
            style={[styles.slot, on && styles.slotOn, { left: left0 + i * (item + gap), top: cy - item / 2, width: item, height: item }]}
          >
            <RemedyIcon kind={k} size={item * 0.72} />
            <View style={styles.badge}><PixelText size={Math.max(7, Math.round(item * 0.2))}>{rem[k]}</PixelText></View>
          </TouchableOpacity>
        );
      })}
      {held && (
        <HeldSeedBanner
          icon={(size) => <RemedyIcon kind={held} size={size} />}
          hint={HINTS[held]}
          onCancel={() => dispatch({ type: 'CLEAR_REMEDY' })}
        />
      )}
    </>
  );
}

// Use inside a room: returns tryUse(slot) → true if a remedy is armed (the tap was
// handled, with a toast saying what happened), false to let the tap open the plant.
export function useRemedyUse(showToast) {
  const { state, dispatch } = useGame();
  const held = state.heldRemedy;
  return useCallback((slot) => {
    if (!held) return false;
    if (held === 'balm') {
      if (!slot.pest) { showToast('No bug on this plant'); return true; }
      dispatch({ type: 'USE_REMEDY', slotId: slot.slotId });
      showToast('The bug is gone!');
      return true;
    }
    if (slot.stage >= maxStageFor(slot.type)) { showToast('Already in full bloom, it needs no protection'); return true; }
    if (isShielded(slot)) { showToast(`Already protected for ${formatDuration(slot.shieldUntil - Date.now())}`); return true; }
    dispatch({ type: 'USE_REMEDY', slotId: slot.slotId });
    showToast(`Protected from bugs for ${formatDuration(SACHET_MS)}`);
    return true;
  }, [held, dispatch, showToast]);
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute', zIndex: 30, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 6,
  },
  slotOn: { borderColor: COLORS.gold, backgroundColor: '#7a5a1c' },
  badge: {
    position: 'absolute', right: -6, bottom: -6, backgroundColor: COLORS.woodDark,
    borderWidth: 2, borderColor: COLORS.woodEdge, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
});
