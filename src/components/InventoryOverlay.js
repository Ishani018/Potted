import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { useGame } from '../context/GameContext';
import { SEED_IMAGES, POTTED_PLANT_IMAGES, SET_UI } from '../engine/assets';
import { seedType } from '../constants/gameData';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const COLS = 6;
const SLOTS = 30;   // 6 x 5 slots, empty ones shown too

function seedImg(flowerKey) { return SEED_IMAGES[flowerKey] ?? POTTED_PLANT_IMAGES._seed; }

// The bag, drawn with the painted UI pieces. Tap a seed bag → onPick(item) (parent holds it & closes).
// roomTypes (optional): pot types in the current room, e.g. ['potted']. Seeds that don't fit any
// of them are dimmed and tapping one calls onBlocked(item).
export default function InventoryOverlay({ onClose, onPick, roomTypes, onBlocked }) {
  const { state } = useGame();
  const inventory = state.inventory ?? [];
  const { width: winW, height: winH } = useLayout();   // size against the game frame, not the browser window

  const panelW = Math.min(winW * 0.78, 480);
  const slot = Math.floor((panelW - 44 - (COLS - 1) * 8) / COLS) - 1;
  const maxH = Math.max(240, winH * 0.9);
  const cells = Array.from({ length: Math.max(SLOTS, Math.ceil(inventory.length / COLS) * COLS) });

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.panel, { width: panelW, maxHeight: maxH }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Bag</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.close}>
            <Image source={SET_UI.close.src} resizeMode="contain" style={{ width: 36 * SET_UI.close.w / SET_UI.close.h, height: 36 }} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {cells.map((_, i) => {
            const item = inventory[i];
            const fits = item && (!roomTypes || roomTypes.includes(seedType(item.flowerKey)));
            return (
              <TouchableOpacity
                key={item ? item.id : 'e' + i}
                disabled={!item}
                activeOpacity={0.7}
                onPress={() => (fits ? onPick(item) : onBlocked && onBlocked(item))}
                style={[styles.slot, { width: slot, height: slot }]}
              >
                {item && <Image source={seedImg(item.flowerKey)} style={{ width: slot * 0.82, height: slot * 0.82, opacity: fits ? 1 : 0.35 }} resizeMode="contain" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={styles.hint}>{inventory.length === 0 ? 'Your bag is empty. Buy seeds at the market.' : `${inventory.length} seed bag${inventory.length === 1 ? '' : 's'}`}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 9000 },
  panel: { backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10 },
  titleRow: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontFamily: SERIF, fontSize: 24, color: '#4a2a10', fontWeight: 'bold' },
  close: { position: 'absolute', right: -6, top: -2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { borderRadius: 10, backgroundColor: '#e8cf9a', borderWidth: 2, borderColor: '#b98a4e', alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: SERIF, fontSize: 13, color: '#7a5030', textAlign: 'center', marginTop: 8 },
});
