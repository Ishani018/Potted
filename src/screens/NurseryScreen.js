import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { NURSERY_BG, SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { POTTED_FLOWERS, HANGING_PLANTS, seedType, seedUnlockLevel, playerLevel, FLOWER_GROWTH, formatDuration } from '../constants/gameData';
import InventoryOverlay from '../components/InventoryOverlay';
import ScreenHud from '../components/ScreenHud';
import { PixelText, COLORS } from '../components/Pixel';
import { useNotice } from '../components/PurchaseNotice';

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

  const [notice, notify] = useNotice();
  const [invOpen, setInvOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  const level = playerLevel(state.player);
  const INVENTORY_CAP = 35;
  const invFull = (state.inventory?.length ?? 0) >= INVENTORY_CAP;

  const handleBuy = (flowerKey, price, name) => {
    const need = seedUnlockLevel(flowerKey);
    if (level < need) { notify({ icon: SEED_IMAGES[flowerKey], title: `${name} is locked`, subtitle: `Reach level ${need} to unlock these seeds. You are level ${level}.` }); return; }
    if (coins < price) { notify({ icon: UI_IMAGES.goldcoins, title: 'Not enough coins', subtitle: `You need ${price - coins} more for ${name}.` }); return; }
    if (invFull) { notify({ icon: UI_IMAGES.inventorybtn, title: 'Inventory full', subtitle: 'Plant some seeds to make room.' }); return; }
    dispatch({ type: 'BUY_SEED', flowerKey, price });
    const hrs = FLOWER_GROWTH[flowerKey]?.hours;
    notify({
      icon: SEED_IMAGES[flowerKey],
      title: `Bought ${name}!`,
      subtitle: `${seedType(flowerKey) === 'hanging' ? 'Grows in a hanging pot' : 'Grows in a shelf pot'}${hrs ? ` · water every ${formatDuration(hrs * 3600000)}` : ''}.`,
    });
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

      {/* Standard HUD — settings (TL) + map (TR) + inventory (BL) */}
      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
        onBook={() => navigation.navigate('FlowerBook')}
      />

      {/* Coins — bottom-right */}
      <View style={styles.coinBox}>
        <Image source={UI_IMAGES.goldcoins} style={styles.coinIcon} resizeMode="contain" />
        <PixelText size={11}>{coins}</PixelText>
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
        const lockedAt = seedUnlockLevel(key);
        const locked = level < lockedAt;
        return (
          <TouchableOpacity
            key={key}
            style={{ position: 'absolute', left: cx - bw / 2, top: cy - bh / 2, width: bw, height: bh, alignItems: 'center', zIndex: z + 5 }}
            activeOpacity={0.7}
            onPress={() => handleBuy(key, info.price, info.name)}
          >
            <Image
              source={SEED_IMAGES[key]}
              style={{ width: bw, height: bh, opacity: locked ? 0.3 : affordable ? 1 : 0.5 }}
              resizeMode="contain"
            />
            {/* Price tag under the bag — or the level it unlocks at */}
            {locked ? (
              <View style={styles.priceTag}>
                <PixelText size={8} color="#cfe8a0">LV {lockedAt}</PixelText>
              </View>
            ) : (
              <View style={styles.priceTag}>
                <Image source={UI_IMAGES.goldcoins} style={styles.priceIcon} resizeMode="contain" />
                <PixelText size={8} color={affordable ? '#fff' : '#ff8a8a'}>{info.price}</PixelText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {notice}

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
    position: 'absolute', bottom: 14, right: 14, zIndex: 50,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  coinIcon: { width: 22, height: 22 },

  priceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.woodDark, borderWidth: 2, borderColor: COLORS.woodEdge,
    borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, marginTop: -4,
  },
  priceIcon: { width: 13, height: 13 },
  priceText: { color: '#ffd060', fontSize: 11, fontWeight: 'bold' },
  priceBroke: { color: '#c06060' },

});
