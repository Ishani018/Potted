import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { GALLERY_BGS, PAINTING_IMAGES, UI_IMAGES, CUSTOMER_IMAGES, PET_IMAGES } from '../engine/assets';
import { PAINTINGS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import PetSprite from '../components/PetSprite';
import { pixelText } from '../components/Pixel';
import { Skinned } from '../components/NineSlice';
import { useNotice } from '../components/PurchaseNotice';
import InventoryOverlay from '../components/InventoryOverlay';

// Paintings on the gallery wall, laid out in Plopper (1376×768 base, CENTER
// anchor). key = PAINTINGS / PAINTING_IMAGES key.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
// Pets that drop in on the café and lounge on the big empty floor (the ones you have adopted, in turn).
// Three arrangements to choose from: 'tables' (beside the table legs), 'nap' (sleeping in the open middle),
// 'corner' (a cosy huddle by the bar). Sizes are the sprite's width in base pixels; feet are at y.
export const CAFE_PETS = 'tables';
const PET_ASPECT = { george: 625 / 556, storm: 1200 / 896, koazy: 403 / 701, brownie: 582 / 537, aki: 637 / 537, cherry: 381 / 688, martin: 828 / 573, tiger: 768 / 587, ebonyandivory: 507 / 815, milk: 928 / 678, oreo: 387 / 868 };
const VISIT_SLOTS = {
  tables: [{ x: 535, y: 590, w: 70 }, { x: 905, y: 592, w: 74 }, { x: 760, y: 640, w: 96 }, { x: 1065, y: 628, w: 66 }, { x: 620, y: 690, w: 120 }, { x: 980, y: 700, w: 130 }],
  nap:    [{ x: 640, y: 660, w: 150 }, { x: 800, y: 700, w: 160 }, { x: 960, y: 665, w: 100 }, { x: 540, y: 705, w: 110 }, { x: 880, y: 745, w: 120 }, { x: 720, y: 600, w: 90 }],
  corner: [{ x: 300, y: 680, w: 130 }, { x: 400, y: 715, w: 110 }, { x: 480, y: 660, w: 90 }, { x: 360, y: 640, w: 86 }, { x: 250, y: 740, w: 100 }, { x: 460, y: 745, w: 120 }],
};
const SLEEPERS = ['koazy', 'cherry', 'oreo', 'ebonyandivory'];

// which café picture is used: 'a' (open room) or 'b' (closer in, bar and tables)
export const CAFE = 'd';
const BAR = { a: { x: 222, top: 441, feet: 563 }, b: { x: 212, top: 437, feet: 560 }, c: { x: 175, top: 447, feet: 575 }, d: { x: 372, top: 452, feet: 566, h: 250 } };   // where Ben stands, per picture
// A gallery wall: all eight paintings in a cluster of mixed sizes on the big empty wall.
const WALL_ITEMS = [
  { key: 'sleepingpuppypainting',  x: 690, y: 236, w: 56, h: 54, z: 1 },
  { key: 'picnic',                 x: 780, y: 250, w: 90, h: 90, z: 2 },
  { key: 'campfirepainting',       x: 872, y: 228, w: 50, h: 48, z: 3 },
  { key: 'tabbycatpainting',       x: 950, y: 246, w: 64, h: 60, z: 4 },
  { key: 'womanportraitpainting',  x: 712, y: 350, w: 60, h: 58, z: 5 },
  { key: 'beachpainting',          x: 800, y: 362, w: 76, h: 75, z: 6 },
  { key: 'weddingpainting',        x: 905, y: 352, w: 96, h: 90, z: 7 },
  { key: 'newbaby',                x: 1005, y: 356, w: 68, h: 68, z: 8 },
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
  const { state } = useGame();
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

      {/* visiting pets on the floor */}
      {sw > 0 && (state.player.ownedPets ?? []).filter((k) => PET_ASPECT[k]).slice(0, 6).map((k, i) => {
        const sl = VISIT_SLOTS[CAFE_PETS][i];
        const w = sl.w * (SLEEPERS.includes(k) ? 1.25 : 1) * (PET_ASPECT[k] > 1.15 ? 0.85 : 1), h = w * PET_ASPECT[k];
        return (
          <View key={k} pointerEvents="none" style={{ position: 'absolute', left: ((sl.x - w / 2) / PLOPPER_W) * sw, top: ((sl.y - h) / PLOPPER_H) * sh, width: (w / PLOPPER_W) * sw, height: (h / PLOPPER_H) * sh, zIndex: 10 + Math.round(sl.y / 10) }}>
            <PetSprite petKey={k} w={(w / PLOPPER_W) * sw} h={(h / PLOPPER_H) * sh} />
          </View>
        );
      })}

      {/* Ben behind the bar: drawn above the picture but cut off at the counter's top edge */}
      {sw > 0 && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: sw, height: (BAR[CAFE].top / PLOPPER_H) * sh, overflow: 'hidden', zIndex: 20 }}>
          <Image source={CUSTOMER_IMAGES.ben} resizeMode="contain" style={{ position: 'absolute', left: (BAR[CAFE].x / PLOPPER_W) * sw - ((BAR[CAFE].h ?? 276) / 3 / PLOPPER_W) * sw, top: (BAR[CAFE].feet / PLOPPER_H) * sh - ((BAR[CAFE].h ?? 276) / PLOPPER_H) * sh, width: ((BAR[CAFE].h ?? 276) * 2 / 3 / PLOPPER_W) * sw, height: ((BAR[CAFE].h ?? 276) / PLOPPER_H) * sh }} />
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
