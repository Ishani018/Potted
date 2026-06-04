import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { NURSERY_BG, SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { POTTED_FLOWERS, HANGING_PLANTS } from '../constants/gameData';
import InventoryOverlay from '../components/InventoryOverlay';

// All buyable seeds keyed by flowerKey → { name, price }.
const SEED_INFO = {};
[...Object.values(POTTED_FLOWERS), ...Object.values(HANGING_PLANTS)].forEach((s) => {
  SEED_INFO[s.key] = { name: s.name, price: s.seedPrice ?? 10 };
});

// Seed-bag positions on the nursery shelves, laid out in Plopper (1376×768 base,
// CENTER anchor). The JSON keys are seed-image filenames; map them to flowerKeys.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const SHELF_ITEMS = [
  { key: 'snapdragon',     x: 475, y: 131, w: 61, h: 68, z: 1 },
  { key: 'stringofpearls', x: 749, y: 467, w: 65, h: 72, z: 2 },
  { key: 'hydrenga',       x: 362, y: 388, w: 63, h: 71, z: 3 },
  { key: 'daisy',          x: 534, y: 218, w: 63, h: 70, z: 4 },
  { key: 'peony',          x: 537, y: 131, w: 61, h: 69, z: 5 },
  { key: 'poppy',          x: 527, y: 392, w: 64, h: 71, z: 6 },
  { key: 'rose',           x: 445, y: 302, w: 67, h: 73, z: 7 },
  { key: 'marigold',       x: 368, y: 304, w: 65, h: 72, z: 8 },
  { key: 'petunia',        x: 733, y: 131, w: 61, h: 68, z: 9 },
  { key: 'Bougainvillea',  x: 817, y: 307, w: 62, h: 69, z: 10 },
  { key: 'jasmine',        x: 822, y: 389, w: 71, h: 71, z: 11 },
  { key: 'Philodendron',   x: 642, y: 297, w: 67, h: 74, z: 12 },
];

export default function NurseryScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const coins = state.player.coins;

  const [toast, setToast] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  };

  const INVENTORY_CAP = 35;
  const invFull = (state.inventory?.length ?? 0) >= INVENTORY_CAP;

  const handleBuy = (flowerKey, price, name) => {
    if (coins < price) { showToast('Not enough coins'); return; }
    if (invFull) { showToast('Inventory full'); return; }
    dispatch({ type: 'BUY_SEED', flowerKey, price });
    showToast(`Bought ${name}`);
  };

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image
        source={NURSERY_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        resizeMode="stretch"
      />

      {/* Settings — top-left */}
      <TouchableOpacity style={styles.hudTL} onPress={() => navigation.navigate('Room')}>
        <Image source={UI_IMAGES.settingsnobg} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Map — top-right */}
      <TouchableOpacity style={styles.hudTR} onPress={() => navigation.navigate('Map')}>
        <Image source={UI_IMAGES.mapicon} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Inventory — bottom-left (view-only; you buy here, not plant) */}
      <TouchableOpacity style={styles.hudBL} onPress={() => setInvOpen(true)}>
        <Image source={UI_IMAGES.inventorybtn} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Coins — bottom-right */}
      <View style={styles.coinBox}>
        <Image source={UI_IMAGES.goldcoins} style={styles.coinIcon} resizeMode="contain" />
        <Text style={styles.coinText}>{coins}</Text>
      </View>

      {/* Seed bags on the painted shelves (Plopper base-px coords) — tap to buy */}
      {SHELF_ITEMS.map(({ key, x, y, w, h, z }) => {
        const info = SEED_INFO[key];
        if (!info) return null;
        const cx = (x / PLOPPER_W) * sw;
        const cy = (y / PLOPPER_H) * sh;
        const bw = (w / PLOPPER_W) * sw;
        const bh = (h / PLOPPER_H) * sh;
        const affordable = coins >= info.price;
        return (
          <TouchableOpacity
            key={key}
            style={{ position: 'absolute', left: cx - bw / 2, top: cy - bh / 2, width: bw, height: bh, alignItems: 'center', zIndex: z + 5 }}
            activeOpacity={0.7}
            onPress={() => handleBuy(key, info.price, info.name)}
          >
            <Image
              source={SEED_IMAGES[key]}
              style={{ width: bw, height: bh, opacity: affordable ? 1 : 0.5 }}
              resizeMode="contain"
            />
            {/* Price tag under the bag */}
            <View style={styles.priceTag}>
              <Image source={UI_IMAGES.goldcoins} style={styles.priceIcon} resizeMode="contain" />
              <Text style={[styles.priceText, !affordable && styles.priceBroke]}>{info.price}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {invOpen && (
        <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0f00', overflow: 'hidden' },

  // Standard HUD
  hudTL: { position: 'absolute', top: 12, left: 12,   width: 48, height: 48, zIndex: 50 },
  hudTR: { position: 'absolute', top: 12, right: 14,  width: 48, height: 48, zIndex: 50 },
  hudBL: { position: 'absolute', bottom: 14, left: 14, width: 48, height: 48, zIndex: 50 },
  hudImg: { width: '100%', height: '100%' },

  coinBox: {
    position: 'absolute', bottom: 14, right: 14,
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
