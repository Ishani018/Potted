import React, { useState } from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet,
  Text, useWindowDimensions,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { PETSHOP_BG, PET_IMAGES, UI_IMAGES } from '../engine/assets';
import { PETS } from '../constants/gameData';
import InventoryOverlay from '../components/InventoryOverlay';

// ── Pet positions in petshop.png ─────────────────────────────────────────────
// x/y = sprite CENTER as fraction of screen. w = width fraction of screen width.
// Estimated from reference art; tune per pet after seeing first render.
// ebony + ivory share the ebonyandivory.png sprite (two sleeping cats).
const SHOP_PETS = [
  { key: 'martin',  x: 0.10, y: 0.47, w: 0.09 },   // old tabby, left bench
  { key: 'george',  x: 0.17, y: 0.43, w: 0.10 },   // tabby cat, left bench
  { key: 'ebony',   x: 0.34, y: 0.47, w: 0.14 },   // sleeping pair (ebonyandivory), center bench
  { key: 'ivory',   x: 0.53, y: 0.45, w: 0.08 },   // white cat on cat-tree (shared sprite)
  { key: 'tiger',   x: 0.54, y: 0.22, w: 0.08 },   // calico, top of cat-tree
  { key: 'aki',     x: 0.22, y: 0.70, w: 0.11 },   // akita, blue dog bed
  { key: 'koazy',   x: 0.09, y: 0.81, w: 0.11 },   // ragdoll sleeping, bottom-left mat
  { key: 'brownie', x: 0.65, y: 0.59, w: 0.09 },   // pomeranian
  { key: 'storm',   x: 0.78, y: 0.60, w: 0.11 },   // husky
  { key: 'cherry',  x: 0.78, y: 0.80, w: 0.10 },   // golden puppy, pink bed
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
  const { width: sw, height: sh } = useWindowDimensions();
  const { state } = useGame();
  const ownedPets = state.player.ownedPets ?? [];

  const [selected, setSelected] = useState(null); // petKey of open adopt popup
  const [invOpen, setInvOpen] = useState(false);

  return (
    <View style={styles.root}>
      <Image source={PETSHOP_BG} style={styles.bg} resizeMode="cover" />

      {/* ── Pet sprites ─────────────────────────────────────────────────── */}
      {SHOP_PETS.map(({ key, x, y, w: wFrac }) => {
        const spriteW = sw * wFrac;
        const spriteH = spriteW; // assume ~square; tune aspect per pet if needed
        const owned = ownedPets.includes(key);
        return (
          <TouchableOpacity
            key={key}
            style={{
              position: 'absolute',
              left: sw * x - spriteW / 2,
              top: sh * y - spriteH / 2,
              width: spriteW,
              height: spriteH,
              zIndex: 10,
            }}
            activeOpacity={0.75}
            onPress={() => setSelected(key)}
          >
            <Image
              source={PET_IMAGES[key]}
              style={{ width: spriteW, height: spriteH, opacity: owned ? 0.55 : 1 }}
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
