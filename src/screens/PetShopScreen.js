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
import TagLabel from '../components/TagLabel';
import { AdoptModal } from '../components/PetCard';
import { PixelText, PixelPanel, PixelButton, COLORS, PIXEL_FONT } from '../components/Pixel';

// Pets were laid out in Plopper on a 1376×768 canvas with the bg STRETCHED to
// fill it. To match exactly, we render the bg stretched and position pets as
// fractions of the full screen (x/1376, y/768) — no cover-crop.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;

// ── Pet positions in petshop.png — base 1376×768 coords, sprite CENTER anchor ─
// Laid out visually in Plopper. x/y = center, w = width (base px), flip = mirror,
// z = stack order (low = back). Projected to screen via projectPoint/projectSize.
// The painted shop (1677x938) has two arches on the right; tap one to walk through.
const ART_W = 1677, ART_H = 938;
const ARCHES = [
  { id: 'foster', go: 'Foster', title: 'Foster', sub: 'home', x0: 1272, y0: 70, x1: 1440, y1: 590 },
  { id: 'food', go: 'PetFood', title: 'Food', sub: 'aisle', x0: 1472, y0: 12, x1: 1677, y1: 590 },
];

export const SHOP_PETS = [
  { key: 'tiger',     x: 806, y: 192, w: 87, h: 114, flip: false, z: 1 },
  { key: 'milk',      x: 735, y: 329, w: 82, h: 112, flip: false, z: 2 },
  { key: 'ebonyandivory', x: 566, y: 365, w: 156, h: 97, flip: false, z: 3 },
  { key: 'george',    x: 392, y: 364, w: 93, h: 104, flip: false, z: 4 },
  { key: 'martin',    x: 271, y: 338, w: 127, h: 183, flip: false, z: 5 },
  { key: 'aki',       x: 427, y: 459, w: 123, h: 146, flip: false, z: 6 },
  { key: 'brownie',   x: 919, y: 461, w: 131, h: 142, flip: false, z: 7 },
  { key: 'storm',     x: 1206, y: 449, w: 131, h: 175, flip: false, z: 8 },
  { key: 'cherry',    x: 1247, y: 561, w: 176, h: 97, flip: false, z: 9 },
  { key: 'koazy',     x: 263, y: 588, w: 205, h: 118, flip: false, z: 10 },
  { key: 'oreo',      x: 1141, y: 715, w: 189, h: 84, flip: false, z: 11 },
];


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

      {SHOP_PETS.filter((p) => !ownedPets.includes(p.key)).map(({ key, x, y, w, h, flip, z }) => {
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
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
        onInventory={() => setInvOpen(true)}
      />

      {/* the two arches on the right: the Foster Home and the Pet Food aisle */}
      {sw > 0 && ARCHES.map((a) => {
        const on = hovered === a.id;
        return (
          <Pressable
            key={a.id}
            style={{ position: 'absolute', left: (a.x0 / ART_W) * sw, top: (a.y0 / ART_H) * sh, width: ((a.x1 - a.x0) / ART_W) * sw, height: ((a.y1 - a.y0) / ART_H) * sh, zIndex: 40 }}
            onHoverIn={() => setHovered(a.id)}
            onHoverOut={() => setHovered((h) => (h === a.id ? null : h))}
            onPress={() => navigation.navigate(a.go)}
          >
            <View pointerEvents="none" style={[styles.archGlow, { borderTopLeftRadius: 999, borderTopRightRadius: 999, opacity: on ? 1 : 0 }]} />
            <View pointerEvents="none" style={[styles.archTag, { transform: [{ scale: on ? 0.74 : 0.62 }] }]}><TagLabel title={a.title} sub={a.sub} /></View>
          </Pressable>
        );
      })}

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

  archGlow: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,236,170,0.22)', borderWidth: 3, borderColor: 'rgba(255,240,190,0.55)' },
  archTag: { position: 'absolute', left: 0, right: 0, top: '22%', alignItems: 'center' },

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

export { AdoptModal };
