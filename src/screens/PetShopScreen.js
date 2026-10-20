import React, { useState, useRef, useEffect } from 'react';
import {
  View, Image, TouchableOpacity, Pressable, StyleSheet, TextInput, Animated, Easing,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { PETSHOP_BG, PET_IMAGES, UI_IMAGES, BACKGROUNDS } from '../engine/assets';
import { PETS, ROOM_NAMES } from '../constants/gameData';
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

// Label over a pet — plain white outlined pixel text (like the map signs), shown
// only while hovering that pet. It fades in and bobs gently.
function PetTag({ label, show }) {
  const fade = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: show ? 1 : 0, duration: 160, useNativeDriver: true }).start();
  }, [show]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const y = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  return (
    <Animated.View pointerEvents="none" style={{ opacity: fade, transform: [{ translateY: y }] }}>
      <PixelText size={10}>{label}</PixelText>
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
          {/* Header: pet name + breed on the left, red X on the right (clear of the portrait) */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <PixelText size={13}>{title}</PixelText>
              <PixelText size={7} color="#e8c890" style={{ marginTop: 6 }}>
                {pet.breed.toUpperCase()}{savedName ? `  -  ${pet.name.toUpperCase()}` : ''}
              </PixelText>
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.8}>
              <Image source={UI_IMAGES.cancelbutton} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          <PixelPanel cream style={styles.portrait}>
            <View style={{ width: 150, height: 130, justifyContent: 'flex-end', alignItems: 'center' }}>
              <View style={styles.floorShadow} />
              <PetSprite petKey={petKey} w={130} h={120} />
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
              {/* Perk: plain text with a gold bar — not another box */}
              {pet.effect && (
                <View style={styles.perk}>
                  <PixelText size={7} color={COLORS.gold}>PERK</PixelText>
                  <PixelText size={10} style={{ marginTop: 5 }}>{pet.effect.title.toUpperCase()}</PixelText>
                  <PixelText size={7} color="#f6e2b8" style={{ marginTop: 6, lineHeight: 12 }}>{pet.effect.desc.toUpperCase()}</PixelText>
                </View>
              )}

              {!owned ? (
                /* Adopt: price on the left, one big green button on the right */
                <View style={styles.buyRow}>
                  <View style={styles.priceRow}>
                    <Image source={UI_IMAGES.goldcoins} style={{ width: 26, height: 26 }} resizeMode="contain" />
                    <PixelText size={14} color={COLORS.gold}>{pet.price}</PixelText>
                  </View>
                  <PixelButton
                    onPress={canAfford ? handleAdopt : undefined}
                    disabled={!canAfford}
                    label={canAfford ? 'ADOPT' : `NEED ${pet.price - state.player.coins} MORE`}
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <>
                  <PixelText size={8} color="#f6e2b8" style={styles.sectionLabel}>
                    {placedRoom == null ? 'RESTING - NOT IN A ROOM' : `LIVES IN THE ${(ROOM_NAMES[placedRoom] ?? '').toUpperCase()}`}
                  </PixelText>
                  <View style={styles.roomRow}>
                    {[1, 2, 3].map((r) => (
                      <TouchableOpacity key={r} activeOpacity={0.85} onPress={() => handlePlace(r)} style={styles.roomCard}>
                        <View style={[styles.roomThumbWrap, placedRoom === r && styles.roomOn]}>
                          <Image source={BACKGROUNDS[`room${r}`].white.summer} style={styles.roomThumb} resizeMode="cover" />
                        </View>
                        <PixelText size={6} style={{ marginTop: 4 }}>{(ROOM_NAMES[r] ?? '').toUpperCase()}</PixelText>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity activeOpacity={0.85} onPress={() => handlePlace(null)} style={styles.roomCard}>
                      <View style={[styles.roomThumbWrap, styles.tuck, placedRoom == null && styles.roomOn]}>
                        <PixelText size={9}>ZZZ</PixelText>
                      </View>
                      <PixelText size={6} style={{ marginTop: 4 }}>TUCK AWAY</PixelText>
                    </TouchableOpacity>
                  </View>

                  {/* Quiet secondary actions */}
                  <View style={styles.linkRow}>
                    <TouchableOpacity onPress={() => { setName(savedName ?? pet.name); setStep('rename'); }}>
                      <PixelText size={8} color="#f6e2b8">RENAME</PixelText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleGiveUp}>
                      <PixelText size={8} color="#ffb0a0">REHOME  +{refund}</PixelText>
                    </TouchableOpacity>
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
  const [hovered, setHovered] = useState(null);
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
          <Pressable
            key={key}
            style={{ position: 'absolute', left: cx - spriteW / 2, top: cy - spriteH / 2, width: spriteW, height: spriteH, zIndex: hovered === key ? 99 : z }}
            onHoverIn={() => setHovered(key)}
            onHoverOut={() => setHovered((h) => (h === key ? null : h))}
            onPress={() => setSelected(key)}
          >
            <PetSprite petKey={key} w={spriteW} h={spriteH} flip={flip} />
            <View style={styles.tagWrap} pointerEvents="none">
              <PetTag show={hovered === key} label={adopted ? (petNames[key] ?? PETS[key].name).toUpperCase() : 'ADOPT'} />
            </View>
          </Pressable>
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
  tagWrap: { position: 'absolute', left: -40, right: -40, top: -22, alignItems: 'center', zIndex: 50 },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: { alignItems: 'center', width: 320 },
  header: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: 12, gap: 10 },
  modalClose: { width: 34, height: 34 },
  floorShadow: { position: 'absolute', bottom: 2, width: 100, height: 12, borderRadius: 50, backgroundColor: 'rgba(90,52,16,0.28)' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  portrait: { alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10 },
  perk: { alignSelf: 'stretch', marginTop: 12, paddingLeft: 10, paddingVertical: 4, borderLeftWidth: 4, borderLeftColor: COLORS.gold },
  buyRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  sectionLabel: { alignSelf: 'stretch', marginTop: 14, marginBottom: 8 },
  roomRow: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' },
  roomCard: { alignItems: 'center', width: 66 },
  roomThumbWrap: { width: 62, height: 44, borderRadius: 4, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  roomThumb: { width: '100%', height: '100%' },
  tuck: { backgroundColor: 'rgba(90,52,16,0.55)' },
  roomOn: { borderColor: COLORS.green, backgroundColor: COLORS.green },
  linkRow: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 4 },
  input: {
    marginTop: 12, marginBottom: 14, minWidth: 220, textAlign: 'center',
    fontFamily: PIXEL_FONT, fontSize: 13, color: '#5a3410',
    backgroundColor: COLORS.cream, borderWidth: 3, borderColor: COLORS.creamEdge, borderRadius: 4,
    paddingVertical: 10, paddingHorizontal: 12,
    outlineStyle: 'none',
  },
});
