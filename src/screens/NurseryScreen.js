import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { useLayout } from '../context/LayoutContext';
import { NURSERY_BG, SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { POTTED_FLOWERS, HANGING_PLANTS } from '../constants/gameData';
import { projectPoint, projectSize } from '../engine/project';

// The image has two shelf units side by side:
//   LEFT cabinet  → potted seeds (7)
//   RIGHT cabinet → hanging plants (5)
const POTTED_SEEDS = Object.values(POTTED_FLOWERS).map((s) => ({ key: s.key, name: s.name, price: s.seedPrice ?? 10 }));
const HANGING_SEEDS = Object.values(HANGING_PLANTS).map((s) => ({ key: s.key, name: s.name, price: s.seedPrice ?? 10 }));

// ── Cabinet layout (base coords vs the 1376×768 nursery image) ───────────────
// Each cabinet is a small grid. COLS = bags per shelf row inside a cabinet.
// X_START/Y_START = center of the top-left bag; X_GAP/Y_GAP = spacing.
const SHELF_BAG_BASE = 80;  // bag size on the shelves
const CABINET_COLS = 4;     // bags per row within a cabinet
const X_GAP = 70;
const Y_GAP = 95;

// Left cabinet (potted) and right cabinet (hanging) top-left anchors.
const LEFT_CABINET = { x: 400, y: 145 };
const RIGHT_CABINET = { x: 700, y: 145 };

function gridSlots(seeds, anchor) {
  return seeds.map((seed, i) => ({
    seed,
    x: anchor.x + (i % CABINET_COLS) * X_GAP,
    y: anchor.y + Math.floor(i / CABINET_COLS) * Y_GAP,
  }));
}
const SHELF_ITEMS = [
  ...gridSlots(POTTED_SEEDS, LEFT_CABINET),
  ...gridSlots(HANGING_SEEDS, RIGHT_CABINET),
];

export default function NurseryScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const { width: sw, height: sh } = useLayout();
  const coins = state.player.coins;

  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  };

  const INVENTORY_CAP = 35;
  const invFull = (state.inventory?.length ?? 0) >= INVENTORY_CAP;

  const handleBuy = (seed) => {
    if (coins < seed.price) { showToast('Not enough coins'); return; }
    if (invFull) { showToast('Inventory full'); return; }
    dispatch({ type: 'BUY_SEED', flowerKey: seed.key, price: seed.price });
    showToast(`Bought ${seed.name}`);
  };

  const bagSize = Math.round(projectSize(SHELF_BAG_BASE, sw, sh));

  return (
    <View style={styles.root}>
      <Image
        source={NURSERY_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      {/* Back + settings (top-left), coins (top-right) */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Image source={UI_IMAGES.back} style={styles.backImg} resizeMode="contain" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Room')}>
        <Image source={UI_IMAGES.settingsnobg} style={styles.settingsImg} resizeMode="contain" />
      </TouchableOpacity>
      <View style={styles.coinBox}>
        <Image source={UI_IMAGES.goldcoins} style={styles.coinIcon} resizeMode="contain" />
        <Text style={styles.coinText}>{coins}</Text>
      </View>

      {/* Seed bags placed on the painted shelves — tap to buy */}
      {SHELF_ITEMS.map(({ seed, x, y }) => {
        const pos = projectPoint(x, y, sw, sh);
        const affordable = coins >= seed.price;
        return (
          <TouchableOpacity
            key={seed.key}
            style={{ position: 'absolute', left: pos.x - bagSize / 2, top: pos.y - bagSize / 2, width: bagSize, height: bagSize, alignItems: 'center', zIndex: 5 }}
            activeOpacity={0.7}
            onPress={() => handleBuy(seed)}
          >
            <Image
              source={SEED_IMAGES[seed.key]}
              style={{ width: bagSize, height: bagSize, opacity: affordable ? 1 : 0.5 }}
              resizeMode="contain"
            />
            {/* Price tag under the bag */}
            <View style={styles.priceTag}>
              <Image source={UI_IMAGES.goldcoins} style={styles.priceIcon} resizeMode="contain" />
              <Text style={[styles.priceText, !affordable && styles.priceBroke]}>{seed.price}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0f00', overflow: 'hidden' },

  backBtn: { position: 'absolute', top: 12, left: 12, width: 66, height: 66, zIndex: 50 },
  backImg: { width: 66, height: 66 },

  settingsBtn: { position: 'absolute', bottom: 14, right: 14, width: 44, height: 44, zIndex: 50 },
  settingsImg: { width: 44, height: 44 },

  coinBox: {
    position: 'absolute', top: 12, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5, zIndex: 50,
  },
  coinIcon: { width: 26, height: 26 },
  coinText: {
    color: '#ffd060', fontSize: 15, fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },

  priceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(18,8,0,0.8)',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
    marginTop: -4,
  },
  priceIcon: { width: 13, height: 13 },
  priceText: { color: '#ffd060', fontSize: 11, fontWeight: 'bold' },
  priceBroke: { color: '#c06060' },

  toast: {
    position: 'absolute', bottom: 22, alignSelf: 'center',
    backgroundColor: 'rgba(18,8,0,0.94)',
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9,
    borderWidth: 1.5, borderColor: '#c8873a', zIndex: 50,
  },
  toastText: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },
});
