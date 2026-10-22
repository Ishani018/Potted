import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { GALLERY_BGS, PAINTING_IMAGES, UI_IMAGES, CUSTOMER_IMAGES } from '../engine/assets';
import { PAINTINGS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import { pixelText } from '../components/Pixel';
import { Skinned } from '../components/NineSlice';
import { useNotice } from '../components/PurchaseNotice';
import InventoryOverlay from '../components/InventoryOverlay';

// Paintings on the gallery wall, laid out in Plopper (1376×768 base, CENTER
// anchor). key = PAINTINGS / PAINTING_IMAGES key.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
// The paintings hang from the café wall (two rows under the four hooks).
// which café picture is used: 'a' (open room) or 'b' (closer in, bar and tables)
export const CAFE = 'b';
const BAR = { a: { x: 222, top: 441, feet: 563 }, b: { x: 212, top: 437, feet: 560 } };   // where Ben stands, per picture
// All eight paintings hang along the high beam, up by the ceiling, in a mix of sizes (like a real gallery wall).
const WALL_ITEMS = [
  { key: 'sleepingpuppypainting',  x: 540, y: 88, w: 46, h: 44, z: 1 },
  { key: 'tabbycatpainting',       x: 612, y: 86, w: 34, h: 32, z: 2 },
  { key: 'campfirepainting',       x: 676, y: 90, w: 42, h: 40, z: 3 },
  { key: 'picnic',                 x: 758, y: 87, w: 50, h: 50, z: 4 },
  { key: 'beachpainting',          x: 836, y: 91, w: 38, h: 37, z: 5 },
  { key: 'womanportraitpainting',  x: 908, y: 85, w: 44, h: 42, z: 6 },
  { key: 'weddingpainting',        x: 986, y: 89, w: 36, h: 34, z: 7 },
  { key: 'newbaby',                x: 1060, y: 88, w: 48, h: 48, z: 8 },
];

// ── Buy modal ─────────────────────────────────────────────────────────────────
function BuyModal({ paintingKey, onClose, onBought }) {
  const { state, dispatch } = useGame();
  const p = PAINTINGS[paintingKey];
  const owned = (state.player.ownedPaintings ?? []).includes(paintingKey);
  const canAfford = state.player.coins >= p.price;

  const handleBuy = () => {
    dispatch({ type: 'BUY_PAINTING', paintingKey, price: p.price });
    onBought && onBought(p);
    onClose();
  };

  // The ornate floral frame (ornate_frame.png, 606×572) is the card. Fractions below
  // locate its parchment area and its baked red X.
  const W = 400, H = W * (572 / 606);
  const INK = '#5a3410';
  const text = { fontFamily: 'PressStart2P', color: INK };

  return (
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: W, height: H }}>
        <Image source={UI_IMAGES.ornateFrame} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} resizeMode="stretch" />

        {/* red X (painted into the frame) */}
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ position: 'absolute', left: W * 0.785, top: H * 0.05, width: W * 0.15, height: H * 0.15 }} />

        {/* parchment area */}
        <View style={{ position: 'absolute', left: W * 0.15, top: H * 0.17, width: W * 0.7, height: H * 0.64, alignItems: 'center' }}>
          <Skinned src={UI_IMAGES.pcPicFrame} sw={96} sh={96} inset={26} scale={0.6} style={{ padding: 4 }}>
            <Image source={PAINTING_IMAGES[paintingKey]} style={{ width: W * 0.4, height: W * 0.33 }} resizeMode="cover" />
          </Skinned>
          <Text style={[text, { fontSize: 13, marginTop: 10, textAlign: 'center' }]}>{p.name.toUpperCase()}</Text>
          {!owned && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Image source={UI_IMAGES.goldcoins} style={{ width: 22, height: 22 }} resizeMode="contain" />
              <Text style={[text, { fontSize: 12 }]}>{p.price}</Text>
            </View>
          )}
          <View style={{ marginTop: 8, alignSelf: 'stretch', paddingHorizontal: W * 0.04 }}>
            {owned ? (
              <Text style={[text, { fontSize: 8, textAlign: 'center', color: '#3f7a2e', marginTop: 6 }]}>IN YOUR COLLECTION</Text>
            ) : (
              <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.5} onPress={canAfford ? handleBuy : undefined} disabled={!canAfford} style={{ paddingVertical: 11, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[pixelText(11, '#fff')]}>{canAfford ? 'BUY' : `NEED ${p.price - state.player.coins} MORE`}</Text>
              </Skinned>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function GalleryScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const [notice, notify] = useNotice();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={GALLERY_BGS[CAFE]} style={styles.bg} resizeMode="stretch" />

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
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.8}
            onPress={() => setSelected(key)}
          >
            <Image source={PAINTING_IMAGES[key]} style={{ width: iw, height: ih }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}

      {/* Ben behind the bar: drawn above the picture but cut off at the counter's top edge */}
      {sw > 0 && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: sw, height: (BAR[CAFE].top / PLOPPER_H) * sh, overflow: 'hidden', zIndex: 20 }}>
          <Image source={CUSTOMER_IMAGES.ben} resizeMode="contain" style={{ position: 'absolute', left: (BAR[CAFE].x / PLOPPER_W) * sw - (92 / PLOPPER_W) * sw, top: (BAR[CAFE].feet / PLOPPER_H) * sh - (276 / PLOPPER_H) * sh, width: (184 / PLOPPER_W) * sw, height: (276 / PLOPPER_H) * sh }} />
        </View>
      )}

      {/* Standard HUD — settings (TL) + map (TR) + inventory (BL) */}
      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
      />

      {selected && (
        <BuyModal
          paintingKey={selected}
          onClose={() => setSelected(null)}
          onBought={(p) => notify({ icon: PAINTING_IMAGES[selected], title: `Bought ${p.name}!`, subtitle: 'Hang it in your Balcony photo frame.' })}
        />
      )}
      {notice}
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
