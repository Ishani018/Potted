import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { GALLERY_BG, PAINTING_IMAGES, UI_IMAGES } from '../engine/assets';
import { PAINTINGS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import InventoryOverlay from '../components/InventoryOverlay';

// Paintings on the gallery wall, laid out in Plopper (1376×768 base, CENTER
// anchor). key = PAINTINGS / PAINTING_IMAGES key.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const WALL_ITEMS = [
  { key: 'newbaby',               x: 951, y: 236, w: 128, h: 128, z: 1 },
  { key: 'womanportraitpainting', x: 478, y: 226, w: 107, h: 102, z: 2 },
  { key: 'beachpainting',         x: 617, y: 265, w: 126, h: 121, z: 3 },
  { key: 'campfirepainting',      x: 787, y: 80,  w: 95,  h: 90,  z: 4 },
  { key: 'tabbycatpainting',      x: 948, y: 92,  w: 119, h: 114, z: 5 },
  { key: 'sleepingpuppypainting', x: 477, y: 92,  w: 94,  h: 90,  z: 6 },
  { key: 'weddingpainting',       x: 780, y: 209, w: 159, h: 151, z: 7 },
  { key: 'picnic',                x: 617, y: 107, w: 149, h: 149, z: 8 },
];

// ── Buy modal ─────────────────────────────────────────────────────────────────
function BuyModal({ paintingKey, onClose }) {
  const { state, dispatch } = useGame();
  const p = PAINTINGS[paintingKey];
  const owned = (state.player.ownedPaintings ?? []).includes(paintingKey);
  const canAfford = state.player.coins >= p.price;

  const handleBuy = () => {
    dispatch({ type: 'BUY_PAINTING', paintingKey, price: p.price });
    onClose();
  };

  return (
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={styles.modal} activeOpacity={1} onPress={() => {}}>
        <TouchableOpacity style={styles.modalClose} onPress={onClose}>
          <Text style={styles.modalCloseTxt}>✕</Text>
        </TouchableOpacity>

        <Image source={PAINTING_IMAGES[paintingKey]} style={styles.modalImg} resizeMode="contain" />
        <Text style={styles.modalName}>{p.name}</Text>

        {owned ? (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedTxt}>In your collection</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.buyBtn, !canAfford && styles.buyBtnDim]}
            onPress={canAfford ? handleBuy : undefined}
            activeOpacity={0.8}
          >
            <Image source={UI_IMAGES.goldcoins} style={{ width: 18, height: 18 }} resizeMode="contain" />
            <Text style={styles.buyBtnTxt}>
              {canAfford ? `Buy  ·  ${p.price}` : `Need ${p.price - state.player.coins} more`}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function GalleryScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={GALLERY_BG} style={styles.bg} resizeMode="stretch" />

      {/* Paintings on the wall (Plopper base-px coords) — tap to view/buy */}
      {WALL_ITEMS.map(({ key, x, y, w, h, z }) => {
        const cx = (x / PLOPPER_W) * sw;
        const cy = (y / PLOPPER_H) * sh;
        const iw = (w / PLOPPER_W) * sw;
        const ih = (h / PLOPPER_H) * sh;
        return (
          <TouchableOpacity
            key={key}
            style={{ position: 'absolute', left: cx - iw / 2, top: cy - ih / 2, width: iw, height: ih, zIndex: z }}
            activeOpacity={0.8}
            onPress={() => setSelected(key)}
          >
            <Image source={PAINTING_IMAGES[key]} style={{ width: iw, height: ih }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}

      {/* Standard HUD — settings (TL) + map (TR) + inventory (BL) */}
      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
      />

      {selected && <BuyModal paintingKey={selected} onClose={() => setSelected(null)} />}
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1208' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  mapBtn: { position: 'absolute', top: 12, right: 14, width: 48, height: 48, zIndex: 30 },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    backgroundColor: '#2a1608', borderRadius: 16,
    borderWidth: 2, borderColor: '#c8873a',
    padding: 22, alignItems: 'center', minWidth: 220, maxWidth: 300,
  },
  modalClose: {
    position: 'absolute', top: 8, right: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#3d1800', borderWidth: 1.5, borderColor: '#c8873a',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseTxt: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },
  modalImg: { width: 130, height: 120, marginBottom: 10, borderRadius: 4 },
  modalName: { color: '#ffe8a0', fontSize: 20, fontWeight: 'bold', letterSpacing: 1, marginBottom: 14 },

  ownedBadge: {
    backgroundColor: '#1e4a10', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#5aaa3a',
  },
  ownedTxt: { color: '#c0ffa0', fontSize: 13, fontWeight: 'bold' },

  buyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3d6020', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#70a840',
  },
  buyBtnDim: { backgroundColor: '#2a2a1a', borderColor: '#555' },
  buyBtnTxt: { color: '#e0ffc0', fontSize: 14, fontWeight: 'bold' },
});
