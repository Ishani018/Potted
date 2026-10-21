import React, { useState } from 'react';
import { View, Image, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { PETFOOD_BG, PETFOOD_IMAGES, PET_IMAGES } from '../engine/assets';
import {
  PETS, PET_FOOD, PET_SPECIES, FED_BOOST, FED_MAX_HOURS, formatDuration,
} from '../constants/gameData';
import { isFed } from '../engine/petEffects';
import ScreenHud from '../components/ScreenHud';
import InventoryOverlay from '../components/InventoryOverlay';
import { PixelText, PixelPanel, PixelButton, COLORS } from '../components/Pixel';

// The pet food aisle: the stocked fridge is painted into aisle.png (1676×939,
// stretched to the screen like the pet shop). Invisible hotspots sit over each
// product; hovering one outlines it, tapping opens a small card: pick a pet and it
// eats right away; litter and pads look after every pet of that kind at once.
const BG_W = 1676;
const BG_H = 939;
// [item, x0, y0, x1, y1] in aisle.png pixels. Where the art shows the same product
// in several places, each one opens the same item.
const SPOTS = [
  ['dogfood', 452, 296, 566, 440],
  ['catfood', 580, 296, 690, 440],
  ['puppyfood', 700, 296, 812, 440],
  ['kittenfood', 826, 296, 940, 440],
  ['grainfree', 953, 296, 1068, 440],
  ['seniorcare', 1080, 296, 1198, 440],
  ['wetcat', 1225, 330, 1375, 438],
  ['wetdog', 1378, 330, 1457, 438],
  ['treats', 1470, 314, 1562, 438],
  ['biscuits', 465, 466, 575, 596],
  ['treats', 585, 466, 695, 596],
  ['training', 725, 464, 832, 598],
  ['dental', 845, 464, 952, 598],
  ['catlitter', 975, 462, 1105, 598],
  ['puppypads', 1112, 462, 1245, 598],
  ['deodoriser', 1315, 455, 1387, 598],
  ['shampoo', 1412, 455, 1488, 598],
  ['wetdog', 455, 618, 537, 722],
  ['wetcat', 538, 618, 620, 722],
  ['wetcat', 624, 618, 706, 722],
  ['wipes', 714, 626, 946, 722],
  ['catfood', 965, 618, 1065, 725],
  ['kittenfood', 1070, 615, 1165, 725],
  ['grainfree', 1168, 618, 1265, 725],
  ['biscuits', 1272, 622, 1370, 724],
  ['biscuits', 1372, 622, 1468, 724],
  ['biscuits', 1470, 622, 1562, 724],
];

const KIND_LABEL = { dog: 'dogs', cat: 'cats', any: 'any pet' };
const SINGULAR = { dog: 'dog', cat: 'cat', any: 'pet' };

const eligible = (item, ownedPets) => ownedPets.filter(
  (k) => PETS[k] && (item.for === 'any' || PET_SPECIES[k] === item.for),
);

function FoodCard({ item, onClose }) {
  const { state, dispatch } = useGame();
  const coins = state.player.coins;
  const owned = state.player.ownedPets ?? [];
  const names = state.player.petNames ?? {};
  const pets = eligible(item, owned);
  const canAfford = coins >= item.price;
  const now = Date.now();
  const [done, setDone] = useState(null);

  const feed = (petKey) => {
    dispatch({ type: 'FEED_PET', itemKey: item.key, petKey, now: Date.now() });
    setDone(item.scope === 'species' ? `All your ${KIND_LABEL[item.for]} are happy!` : `${names[petKey] ?? PETS[petKey].name} is happy!`);
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable onPress={() => {}}>
        <PixelPanel cream style={styles.card}>
          <View style={styles.head}>
            <Image source={PETFOOD_IMAGES[item.key]} style={styles.big} resizeMode="contain" />
            <View style={{ flex: 1, gap: 6 }}>
              <PixelText size={10} color="#5a3410" style={styles.dark}>{item.name.toUpperCase()}</PixelText>
              <PixelText size={7} color="#8a5a24" style={[styles.dark, { lineHeight: 12 }]}>
                {`For ${KIND_LABEL[item.for]}. ${item.scope === 'species' ? 'Keeps all of them' : 'Keeps one pet'} happy for ${item.hours}h.`}
              </PixelText>
              <PixelText size={7} color="#3f7a2e" style={[styles.dark, { lineHeight: 12 }]}>
                {`A happy pet's perk is ${FED_BOOST}x as strong.`}
              </PixelText>
              <PixelText size={9} color="#a8700a" style={styles.dark}>{`${item.price} coins`}</PixelText>
            </View>
          </View>

          {done ? (
            <PixelText size={8} color="#3f7a2e" style={[styles.dark, styles.msg]}>{done}</PixelText>
          ) : pets.length === 0 ? (
            <PixelText size={8} color="#8a5a24" style={[styles.dark, styles.msg]}>
              {`You need a ${SINGULAR[item.for]} first. Adopt one at the pet shop!`}
            </PixelText>
          ) : item.scope === 'species' ? (
            <View style={styles.msg}>
              <PixelButton
                label={`USE FOR ${pets.length} ${pets.length === 1 ? SINGULAR[item.for].toUpperCase() : KIND_LABEL[item.for].toUpperCase()}`}
                onPress={() => feed(null)}
                disabled={!canAfford}
              />
            </View>
          ) : (
            <View>
              <PixelText size={7} color="#5a3410" style={[styles.dark, { marginBottom: 6 }]}>WHO IS IT FOR?</PixelText>
              <View style={styles.petRow}>
                {pets.map((k) => {
                  const left = (state.player.petCare?.[k] ?? 0) - now;
                  return (
                    <TouchableOpacity key={k} style={styles.petBtn} disabled={!canAfford} onPress={() => feed(k)} activeOpacity={0.8}>
                      <Image source={PET_IMAGES[k]} style={styles.petImg} resizeMode="contain" />
                      <PixelText size={6} color="#5a3410" style={styles.dark}>{(names[k] ?? PETS[k].name).toUpperCase()}</PixelText>
                      <PixelText size={6} color={isFed(state.player, k, now) ? '#3f7a2e' : '#a89060'} style={styles.dark}>
                        {left > 0 ? formatDuration(left) : 'HUNGRY'}
                      </PixelText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {!done && !canAfford && pets.length > 0 && (
            <PixelText size={7} color="#b04a2a" style={[styles.dark, { marginTop: 8 }]}>Not enough coins.</PixelText>
          )}
          <PixelText size={6} color="#a89060" style={[styles.dark, { marginTop: 8 }]}>
            {`Food stacks, up to ${FED_MAX_HOURS}h. Hungry pets still work, just not as well.`}
          </PixelText>
          <PixelButton label={done ? 'DONE' : 'CLOSE'} tone="wood" size={8} onPress={onClose} style={{ marginTop: 10, alignSelf: 'center' }} />
        </PixelPanel>
      </Pressable>
    </Pressable>
  );
}

export default function PetFoodScreen({ navigation }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState(null);
  const [picked, setPicked] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const sw = box.w, sh = box.h;

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={PETFOOD_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && SPOTS.map(([key, x0, y0, x1, y1], i) => {
        const item = PET_FOOD.find((f) => f.key === key);
        const on = hovered === i;
        return (
          <Pressable
            key={i}
            style={[styles.spot, {
              left: (x0 / BG_W) * sw, top: (y0 / BG_H) * sh, width: ((x1 - x0) / BG_W) * sw, height: ((y1 - y0) / BG_H) * sh,
              zIndex: on ? 40 : 5,
            }, on && styles.spotOn]}
            onHoverIn={() => setHovered(i)}
            onHoverOut={() => setHovered((h) => (h === i ? null : h))}
            onPress={() => setPicked(item)}
          >
            {on && (
              <View style={styles.tag} pointerEvents="none">
                <PixelText size={8}>{item.name.toUpperCase()}</PixelText>
                <PixelText size={7} color={COLORS.gold}>{`${item.price} COINS`}</PixelText>
              </View>
            )}
          </Pressable>
        );
      })}

      <View style={styles.back}>
        <PixelButton label="< PET SHOP" tone="wood" size={8} onPress={() => navigation.navigate('PetShop')} />
      </View>

      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Settings')} onMap={() => navigation.navigate('Map')} onInventory={() => setInvOpen(true)} />

      {picked && <FoodCard item={picked} onClose={() => setPicked(null)} />}
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1200' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  spot: { position: 'absolute', borderRadius: 6 },
  spotOn: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.12)' },
  tag: { position: 'absolute', bottom: '100%', left: -50, right: -50, alignItems: 'center', gap: 2, marginBottom: 2 },
  back: { position: 'absolute', right: 16, bottom: 12, zIndex: 30 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  card: { width: 330, maxWidth: '94%' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  big: { width: 84, height: 100 },
  dark: { textShadowRadius: 0 },
  msg: { marginVertical: 4, alignItems: 'center', textAlign: 'center' },
  petRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  petBtn: { width: 64, alignItems: 'center', paddingVertical: 4, borderRadius: 4, borderWidth: 2, borderColor: COLORS.creamEdge, backgroundColor: 'rgba(255,255,255,0.35)' },
  petImg: { width: 44, height: 40 },
});
