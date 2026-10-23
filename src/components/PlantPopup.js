import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { HPOT_META, HPOT_ORDER, PPOT_META, PPOT_IDS, UI_IMAGES } from '../engine/assets';
import { PixelPanel, PixelButton, PixelText, COLORS } from './Pixel';
import { useLayout } from '../context/LayoutContext';
import { projectSize } from '../engine/project';
import { msUntilThirsty, maxStageFor } from '../engine/gameEngine';
import { POTTED_FLOWERS, HANGING_PLANTS, HPOT_INFO, PPOT_PRICE, formatDuration, pestInfo, isShielded } from '../constants/gameData';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

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
  const max = maxStageFor(slot.type, slot.flowerKey);
  if (slot.pest) {
    const p = pestInfo(slot.pest);
    return { text: `${p.name.toUpperCase()} ON IT!`, color: '#ff9a7a' };
  }
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
  const { state, dispatch } = useGame();
  if (!slot) return null;
  const isHang = slot.type === 'hanging';
  const owned = state.player.ownedHPots ?? ['macrame'];
  const curPot = slot.pot ?? state.player.hangingPot ?? 'macrame';
  const coins = state.player.coins;
  const isShelf = slot.type === 'potted';
  const ownedP = state.player.ownedPPots ?? [4];
  const curP = slot.pot ?? state.player.pottedPot ?? 4;

  // Full bloom is harvestable: potted stage 3, hanging stage 2.
  const canHarvest = !!slot.flowerKey && slot.stage >= maxStageFor(slot.type, slot.flowerKey);
  const hasPlant = !!slot.flowerKey;
  const name = POTTED_FLOWERS[slot.flowerKey]?.name ?? HANGING_PLANTS[slot.flowerKey]?.name;
  const status = hasPlant ? plantStatus(slot, now) : null;

  // Sit the popup right on the tapped plant: centred over a shelf pot, or just
  // under the hook for a hanging one. Clamped so it never leaves the screen.
  const W = isHang ? 250 : isShelf ? 262 : 190;
  const shielded = hasPlant && isShielded(slot, now);
  const H = (canHarvest ? 112 : 58) + (hasPlant ? 46 : 0) + (shielded ? 14 : 0) + (isHang ? 96 : 0) + (isShelf ? 230 : 0);
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
                {shielded && (
                  <PixelText size={6} color="#cfe8a0" style={{ textAlign: 'center' }}>SACHET: BUG-FREE FOR {formatDuration(slot.shieldUntil - now).toUpperCase()}</PixelText>
                )}
              </View>
            )}
            {isHang && (
              <View>
                <Text style={styles.potsTitle}>Pots</Text>
                <View style={styles.potRow}>
                  {HPOT_ORDER.map((id) => {
                    const m = HPOT_META[id], have = owned.includes(id), price = HPOT_INFO[id].price, can = have || coins >= price;
                    return (
                      <TouchableOpacity key={id} activeOpacity={0.8} disabled={!can}
                        onPress={() => { if (!have) dispatch({ type: 'BUY_HPOT', pot: id, price }); dispatch({ type: 'SET_SLOT_POT', slotId: slot.slotId, pot: id }); }}
                        style={[styles.potTile, curPot === id && styles.potOn, !can && { opacity: 0.45 }]}>
                        <Image source={m.src} style={{ width: 22, height: 22 * m.h / m.w > 40 ? 40 : 22 * m.h / m.w, maxHeight: 40 }} resizeMode="contain" />
                        {!have && <Text style={styles.potPrice}>{price}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            {isShelf && (
              <View>
                <Text style={styles.potsTitle}>Pots</Text>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  <View style={[styles.potRow, { flexWrap: 'wrap' }]}>
                    {PPOT_IDS.map((id) => {
                      const m = PPOT_META[id], have = ownedP.includes(id), price = PPOT_PRICE[id], can = have || coins >= price;
                      return (
                        <TouchableOpacity key={id} activeOpacity={0.8} disabled={!can}
                          onPress={() => { if (!have) dispatch({ type: 'BUY_PPOT', pot: id, price }); dispatch({ type: 'SET_SLOT_PPOT', slotId: slot.slotId, pot: id }); }}
                          style={[styles.potTile, { height: 40 }, curP === id && styles.potOn, !can && { opacity: 0.45 }]}>
                          <Image source={m.src} style={{ width: 24, height: 22 }} resizeMode="contain" />
                          {!have && <Text style={styles.potPrice}>{price}</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
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
  potsTitle: { fontFamily: SERIF, fontSize: 14, color: '#fff3d0', textAlign: 'center', marginBottom: 2 },
  potRow: { flexDirection: 'row', gap: 3, justifyContent: 'center' },
  potTile: { width: 29, height: 52, borderRadius: 6, backgroundColor: 'rgba(255,240,200,0.18)', borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  potOn: { borderColor: '#ffe29a', backgroundColor: 'rgba(255,240,200,0.35)' },
  potPrice: { fontFamily: SERIF, fontSize: 11, color: '#ffe29a' },
  info: { alignItems: 'center', gap: 5, paddingBottom: 2 },
});
