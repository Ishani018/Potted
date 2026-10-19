import React, { useState, useRef, useEffect } from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet, TextInput, Animated, Easing,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { PETSHOP_BG, PET_IMAGES, UI_IMAGES } from '../engine/assets';
import { PETS } from '../constants/gameData';
import InventoryOverlay from '../components/InventoryOverlay';
import ScreenHud from '../components/ScreenHud';
import PetSprite from '../components/PetSprite';
import { PixelText, PixelPanel, PixelButton, COLORS, PIXEL_FONT } from '../components/Pixel';

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

const REFUND_FRACTION = 0.5; // coins returned when giving a pet up for adoption

// Floating sign over each pet. Every pet bobs on its own rhythm (random delay +
// duration) so the signs ripple around the shop instead of moving together.
function PetTag({ label, adopted }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dur = 700 + Math.random() * 500;
    let loop;
    const t = setTimeout(() => {
      loop = Animated.loop(Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
      loop.start();
    }, Math.random() * 1500);
    return () => { clearTimeout(t); loop && loop.stop(); };
  }, []);
  const y = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  return (
    <Animated.View pointerEvents="none" style={[styles.tag, adopted && styles.tagOwned, { transform: [{ translateY: y }] }]}>
      <PixelText size={8}>{label}</PixelText>
    </Animated.View>
  );
}

// ── Pet popup — adopt (unowned), then name it; or manage (owned) ──────────────
function AdoptModal({ petKey, onClose }) {
  const { state, dispatch } = useGame();
  const pet = PETS[petKey];
  const owned = (state.player.ownedPets ?? []).includes(petKey);
  const placedRoom = state.player.petPlacements?.[petKey] ?? null;
  const savedName = state.player.petNames?.[petKey];
  const canAfford = state.player.coins >= pet.price;
  const refund = Math.floor(pet.price * REFUND_FRACTION);

  const [step, setStep] = useState(null); // null | 'greet' (just adopted) | 'rename'
  const [name, setName] = useState(savedName ?? pet.name);

  const handleAdopt = () => {
    dispatch({ type: 'BUY_PET', petKey, price: pet.price });
    setName(pet.name);
    setStep('greet'); // introduce the pet's name, offer to rename
  };
  const saveName = () => {
    dispatch({ type: 'NAME_PET', petKey, name });
    setStep(null);
  };
  const handlePlace = (room) => dispatch({ type: 'PLACE_PET', petKey, room });
  const handleGiveUp = () => {
    dispatch({ type: 'GIVE_UP_PET', petKey, refund });
    onClose();
  };

  const title = (savedName ?? pet.name).toUpperCase();
  const greeting = step === 'greet' && owned;
  const showNaming = step === 'rename' && owned;

  return (
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}}>
        <PixelPanel style={styles.modal}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.8}>
            <Image source={UI_IMAGES.cancelbutton} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </TouchableOpacity>

          <PixelPanel cream style={styles.portrait}>
            <View style={{ width: 120, height: 120 }}>
              <PetSprite petKey={petKey} w={120} h={120} />
            </View>
          </PixelPanel>

          {greeting ? (
            <>
              <PixelText size={9} color="#e8c890" style={{ marginTop: 14, textAlign: 'center' }}>YOU ADOPTED</PixelText>
              <PixelText size={16} style={{ marginTop: 8, textAlign: 'center' }}>{pet.name.toUpperCase()}!</PixelText>
              <PixelText size={9} color="#e8c890" style={{ marginTop: 12, marginBottom: 14, textAlign: 'center' }}>WANT TO RENAME THEM?</PixelText>
              <View style={styles.btnRow}>
                <PixelButton label="RENAME" onPress={() => { setName(pet.name); setStep('rename'); }} />
                <PixelButton label="KEEP NAME" tone="wood" onPress={() => setStep(null)} />
              </View>
            </>
          ) : showNaming ? (
            <>
              <PixelText size={11} style={{ marginTop: 14, textAlign: 'center' }}>NEW NAME</PixelText>
              <TextInput
                value={name}
                onChangeText={(t) => setName(t.slice(0, 12))}
                maxLength={12}
                autoFocus
                selectTextOnFocus
                placeholder={pet.name}
                placeholderTextColor="#b8793a"
                onSubmitEditing={saveName}
                style={styles.input}
              />
              <View style={styles.btnRow}>
                <PixelButton label="SAVE" onPress={saveName} />
                <PixelButton label="CANCEL" tone="wood" onPress={() => setStep(null)} />
              </View>
            </>
          ) : (
            <>
              <PixelText size={14} style={{ marginTop: 14, textAlign: 'center' }}>{title}</PixelText>
              <PixelText size={8} color="#e8c890" style={{ marginTop: 6, marginBottom: 14, textAlign: 'center' }}>
                {pet.breed.toUpperCase()}{savedName ? `  -  ${pet.name.toUpperCase()}` : ''}
              </PixelText>

              {!owned ? (
                <PixelButton
                  onPress={canAfford ? handleAdopt : undefined}
                  disabled={!canAfford}
                  label={canAfford ? `ADOPT  ${pet.price}` : `NEED ${pet.price - state.player.coins} MORE`}
                />
              ) : (
                <>
                  <PixelText size={8} color="#e8c890" style={{ marginBottom: 8 }}>LIVES IN</PixelText>
                  <View style={styles.btnRow}>
                    {[1, 2, 3].map((r) => (
                      <PixelButton key={r} label={`${r}`} size={10} tone={placedRoom === r ? 'green' : 'wood'} onPress={() => handlePlace(r)} style={styles.chip} />
                    ))}
                    <PixelButton label="TUCK AWAY" size={8} tone={placedRoom == null ? 'green' : 'wood'} onPress={() => handlePlace(null)} />
                  </View>
                  <View style={[styles.btnRow, { marginTop: 12 }]}>
                    <PixelButton label="RENAME" size={9} tone="wood" onPress={() => { setName(savedName ?? pet.name); setStep('rename'); }} />
                    <PixelButton label={`REHOME  +${refund}`} size={9} tone="wood" onPress={handleGiveUp} />
                  </View>
                </>
              )}
            </>
          )}
        </PixelPanel>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PetShopScreen({ navigation }) {
  const { state } = useGame();
  const [selected, setSelected] = useState(null); // petKey of open popup
  const [invOpen, setInvOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sw = box.w, sh = box.h;
  const ownedPets = state.player.ownedPets ?? [];
  const petNames = state.player.petNames ?? {};

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={PETSHOP_BG} style={styles.bg} resizeMode="stretch" />

      {SHOP_PETS.map(({ key, x, y, w, h, flip, z }) => {
        const cx = (x / PLOPPER_W) * sw;
        const cy = (y / PLOPPER_H) * sh;
        const spriteW = (w / PLOPPER_W) * sw;
        const spriteH = (h / PLOPPER_H) * sh;
        const adopted = ownedPets.includes(key);
        return (
          <TouchableOpacity
            key={key}
            style={{ position: 'absolute', left: cx - spriteW / 2, top: cy - spriteH / 2, width: spriteW, height: spriteH, zIndex: z }}
            activeOpacity={0.85}
            onPress={() => setSelected(key)}
          >
            <PetSprite petKey={key} w={spriteW} h={spriteH} flip={flip} />
            <View style={styles.tagWrap} pointerEvents="none">
              <PetTag adopted={adopted} label={adopted ? (petNames[key] ?? PETS[key].name).toUpperCase() : 'ADOPT'} />
            </View>
          </TouchableOpacity>
        );
      })}

      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
      />

      {selected && <AdoptModal petKey={selected} onClose={() => setSelected(null)} />}

      {invOpen && (
        <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1200' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },

  // Sign floating above each pet (centred, overflowing the sprite box upward)
  tagWrap: { position: 'absolute', left: -40, right: -40, top: -26, alignItems: 'center', zIndex: 50 },
  tag: {
    backgroundColor: COLORS.green, borderWidth: 3, borderColor: COLORS.greenEdge, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  tagOwned: { backgroundColor: COLORS.woodDark, borderColor: COLORS.woodEdge },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: { alignItems: 'center', minWidth: 280, maxWidth: 340, paddingTop: 18 },
  modalClose: { position: 'absolute', top: 6, right: 6, width: 34, height: 34, zIndex: 5 },
  portrait: { alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12 },
  input: {
    marginTop: 12, marginBottom: 14, minWidth: 220, textAlign: 'center',
    fontFamily: PIXEL_FONT, fontSize: 13, color: '#5a3410',
    backgroundColor: COLORS.cream, borderWidth: 3, borderColor: COLORS.creamEdge, borderRadius: 4,
    paddingVertical: 10, paddingHorizontal: 12,
    outlineStyle: 'none',
  },
});
