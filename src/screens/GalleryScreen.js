import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { GALLERY_BG, PAINTING_IMAGES, UI_IMAGES } from '../engine/assets';
import { PAINTINGS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import { PixelPanel, PixelText, PixelButton } from '../components/Pixel';
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
      <TouchableOpacity activeOpacity={1} onPress={() => {}}>
        <PixelPanel style={{ alignItems: 'center', minWidth: 260, paddingTop: 16 }}>
          <TouchableOpacity style={{ position: 'absolute', top: 6, right: 6, width: 34, height: 34, zIndex: 5 }} onPress={onClose} activeOpacity={0.8}>
            <Image source={UI_IMAGES.cancelbutton} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </TouchableOpacity>
          <PixelPanel cream>
            <Image source={PAINTING_IMAGES[paintingKey]} style={styles.modalImg} resizeMode="contain" />
          </PixelPanel>
          <PixelText size={13} style={{ marginTop: 14, marginBottom: 8, textAlign: 'center' }}>{p.name.toUpperCase()}</PixelText>
          {!owned && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Image source={UI_IMAGES.goldcoins} style={{ width: 20, height: 20 }} resizeMode="contain" />
              <PixelText size={11} color="#ffd060">{p.price}</PixelText>
            </View>
          )}
          {owned ? (
            <PixelText size={9} color="#e8c890">IN YOUR COLLECTION</PixelText>
          ) : (
            <PixelButton
              onPress={canAfford ? handleBuy : undefined}
              disabled={!canAfford}
              label={canAfford ? 'BUY' : `NEED ${p.price - state.player.coins} MORE`}
            />
          )}
        </PixelPanel>
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
  modalImg: { width: 170, height: 150 },

});
