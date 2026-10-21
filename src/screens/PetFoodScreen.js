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

// The pet food aisle: a chilled cabinet with three shelves (aisle.png, 1677×938,
// stretched to the screen like the pet shop). Every product sits on its shelf and
// opens a small card: pick a pet and it eats right away; litter and pads look
// after every pet of that kind at once.
const BG_W = 1677;
const BG_H = 938;
const SHELF_BASE = [402, 522, 650];         // y of each shelf surface, bg px
const COL_X = [540, 720, 900, 1080, 1260, 1440];
const BOX = { w: 150, h: 104 };             // largest a product can be on the shelf, bg px

// width / height of each cut-out
const ASPECT = {
  dogfood: 127 / 200, catfood: 126 / 200, puppyfood: 126 / 200, kittenfood: 125 / 200, grainfree: 126 / 200, seniorcare: 132 / 200,
  wetcat: 1, wetdog: 200 / 194, biscuits: 156 / 200, treats: 160 / 200, dental: 148 / 200, training: 146 / 200,
  catlitter: 131 / 200, clumping: 142 / 200, puppypads: 154 / 200, wipes: 200 / 131, deodoriser: 80 / 200, shampoo: 86 / 200,
};

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

      {sw > 0 && PET_FOOD.map((item) => {
        const ar = ASPECT[item.key];
        // fit inside BOX, standing on the shelf
        const h = Math.min(BOX.h, BOX.w / ar);
        const w = h * ar;
        const pw = (w / BG_W) * sw, ph = (h / BG_H) * sh;
        const left = (COL_X[item.col] / BG_W) * sw - pw / 2;
        const top = (SHELF_BASE[item.row] / BG_H) * sh - ph;
        const on = hovered === item.key;
        return (
          <Pressable
            key={item.key}
            style={{ position: 'absolute', left, top, width: pw, height: ph, zIndex: on ? 40 : 5, transform: [{ translateY: on ? -3 : 0 }] }}
            onHoverIn={() => setHovered(item.key)}
            onHoverOut={() => setHovered((k) => (k === item.key ? null : k))}
            onPress={() => setPicked(item)}
          >
            <Image source={PETFOOD_IMAGES[item.key]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
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
