import React, { useState } from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet, Text,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { PETSHOP_BG, PET_IMAGES, UI_IMAGES } from '../engine/assets';
import { PETS } from '../constants/gameData';
import InventoryOverlay from '../components/InventoryOverlay';

// Pets were laid out in Plopper on a 1376×768 canvas with the bg STRETCHED to
// fill it. To match exactly, we render the bg stretched and position pets as
// fractions of the full screen (x/1376, y/768) — no cover-crop.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;

// ── Pet positions in petshop.png — base 1376×768 coords, sprite CENTER anchor ─
// Laid out visually in Plopper. x/y = center, w = width (base px), flip = mirror,
// z = stack order (low = back). Projected to screen via projectPoint/projectSize.
const SHOP_PETS = [
  { key: 'tiger',         x: 870,  y: 181, w: 108, h: 141, flip: false, z: 1 },
  { key: 'koazy',         x: 261,  y: 621, w: 148, h: 85,  flip: false, z: 2 },
  { key: 'brownie',       x: 978,  y: 488, w: 137, h: 149, flip: false, z: 3 },
  { key: 'aki',           x: 421,  y: 487, w: 136, h: 161, flip: false, z: 4 },
  { key: 'cherry',        x: 1263, y: 609, w: 126, h: 70,  flip: false, z: 5 },
  { key: 'oreo',          x: 1152, y: 723, w: 170, h: 76,  flip: false, z: 6 },
  { key: 'ebonyandivory', x: 531,  y: 359, w: 142, h: 88,  flip: false, z: 7 },
  { key: 'george',        x: 319,  y: 366, w: 96,  h: 108, flip: false, z: 8 },
  { key: 'martin',        x: 241,  y: 369, w: 114, h: 165, flip: true,  z: 9 },
  { key: 'milk',          x: 780,  y: 332, w: 94,  h: 129, flip: true,  z: 10 },
  { key: 'storm',         x: 1198, y: 483, w: 108, h: 144, flip: false, z: 11 },
];

// ── Adoption modal ────────────────────────────────────────────────────────────
function AdoptModal({ petKey, onClose }) {
  const { state, dispatch } = useGame();
  const pet = PETS[petKey];
  const owned = (state.player.ownedPets ?? []).includes(petKey);
  const canAfford = state.player.coins >= pet.price;

  const handleAdopt = () => {
    dispatch({ type: 'BUY_PET', petKey, price: pet.price });
    onClose();
  };

  return (
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={styles.modal} activeOpacity={1} onPress={() => {}}>
        {/* Close */}
        <TouchableOpacity style={styles.modalClose} onPress={onClose}>
          <Text style={styles.modalCloseTxt}>✕</Text>
        </TouchableOpacity>

        <Image source={PET_IMAGES[petKey]} style={styles.modalPetImg} resizeMode="contain" />

        <Text style={styles.modalName}>{pet.name}</Text>
        <Text style={styles.modalBreed}>{pet.breed}</Text>

        {owned ? (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedTxt}>✓ Already in your home</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.adoptBtn, !canAfford && styles.adoptBtnDim]}
            onPress={canAfford ? handleAdopt : undefined}
            activeOpacity={0.8}
          >
            <Image source={UI_IMAGES.goldcoins} style={{ width: 18, height: 18 }} resizeMode="contain" />
            <Text style={styles.adoptBtnTxt}>
              {canAfford ? `Adopt  ·  ${pet.price}` : `Need ${pet.price - state.player.coins} more`}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PetShopScreen({ navigation }) {
  const { state } = useGame();
  const ownedPets = state.player.ownedPets ?? [];

  const [selected, setSelected] = useState(null); // petKey of open adopt popup
  const [invOpen, setInvOpen] = useState(false);
  // Measure the actual rendered box so pets share the bg's exact coordinate space
  // (window dimensions can include status-bar/safe-area insets the bg doesn't).
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;

  // Match Plopper: bg fills the whole frame (stretch), pets placed by fraction.
  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={PETSHOP_BG} style={styles.bg} resizeMode="stretch" />

      {/* ── Pet sprites — Plopper base-px (1376×768) → screen fraction ─────── */}
      {SHOP_PETS.map(({ key, x, y, w, h, flip, z }) => {
        const cx = (x / PLOPPER_W) * sw;
        const cy = (y / PLOPPER_H) * sh;
        const spriteW = (w / PLOPPER_W) * sw;
        const spriteH = (h / PLOPPER_H) * sh;
        const owned = ownedPets.includes(key);
        return (
          <TouchableOpacity
            key={key}
            style={{
              position: 'absolute',
              left: cx - spriteW / 2,
              top: cy - spriteH / 2,
              width: spriteW,
              height: spriteH,
              zIndex: z,
            }}
            activeOpacity={0.75}
            onPress={() => setSelected(key)}
          >
            <Image
              source={PET_IMAGES[key]}
              style={{
                width: spriteW,
                height: spriteH,
                opacity: owned ? 0.55 : 1,
                transform: flip ? [{ scaleX: -1 }] : undefined,
              }}
              resizeMode="contain"
            />
            {/* Owned tick */}
            {owned && (
              <View style={styles.ownedTick}>
                <Text style={styles.ownedTickTxt}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* ── Standard HUD ────────────────────────────────────────────────── */}
      {/* Settings — top-left */}
      <TouchableOpacity style={styles.hudTL} onPress={() => navigation.navigate('Room')}>
        <Image source={UI_IMAGES.settingsnobg} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Map — top-right */}
      <TouchableOpacity style={styles.hudTR} onPress={() => navigation.navigate('Map')}>
        <Image source={UI_IMAGES.mapicon} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Inventory — bottom-left */}
      <TouchableOpacity style={styles.hudBL} onPress={() => setInvOpen(true)}>
        <Image source={UI_IMAGES.inventorybtn} style={styles.hudImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {selected && <AdoptModal petKey={selected} onClose={() => setSelected(null)} />}

      {invOpen && (
        <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1200' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },

  // Standard HUD corners
  hudTL: { position: 'absolute', top: 10, left: 14, width: 48, height: 48, zIndex: 30 },
  hudTR: { position: 'absolute', top: 10, right: 14, width: 48, height: 48, zIndex: 30 },
  hudBL: { position: 'absolute', bottom: 14, left: 14, width: 48, height: 48, zIndex: 30 },
  hudImg: { width: '100%', height: '100%' },

  // Owned indicator on top of sprite
  ownedTick: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#2a6010',
    borderWidth: 1.5, borderColor: '#88dd40',
    alignItems: 'center', justifyContent: 'center',
  },
  ownedTickTxt: { color: '#d0ff80', fontSize: 10, fontWeight: 'bold' },

  // Adopt modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    backgroundColor: '#2a1608',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#c8873a',
    padding: 22,
    alignItems: 'center',
    minWidth: 220,
    maxWidth: 300,
  },
  modalClose: {
    position: 'absolute', top: 8, right: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#3d1800',
    borderWidth: 1.5, borderColor: '#c8873a',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseTxt: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },
  modalPetImg: { width: 110, height: 110, marginBottom: 10 },
  modalName: {
    color: '#ffe8a0', fontSize: 20, fontWeight: 'bold',
    letterSpacing: 1, marginBottom: 2,
  },
  modalBreed: {
    color: '#c8873a', fontSize: 12, marginBottom: 14,
    fontStyle: 'italic',
  },

  ownedBadge: {
    backgroundColor: '#1e4a10',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#5aaa3a',
  },
  ownedTxt: { color: '#c0ffa0', fontSize: 13, fontWeight: 'bold' },

  adoptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3d6020',
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#70a840',
  },
  adoptBtnDim: { backgroundColor: '#2a2a1a', borderColor: '#555' },
  adoptBtnTxt: { color: '#e0ffc0', fontSize: 14, fontWeight: 'bold' },
});
