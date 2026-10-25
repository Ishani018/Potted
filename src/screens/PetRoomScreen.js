import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { PETROOM_BG } from '../engine/assets';
import { PETS } from '../constants/gameData';
import PetSprite from '../components/PetSprite';
import ScreenHud from '../components/ScreenHud';
import { PixelText } from '../components/Pixel';
import { AdoptModal } from '../components/PetCard';
import { SHOP_PETS } from './PetShopScreen';

// Pet lounge — every pet you've adopted, hanging out on the big mat, so you can
// check in on them one by one. Tap a pet to see its perk, rename it, move it between
// rooms or rehome it. Background: petroom.png (1376×768 base).
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
// Where each pet sits on the big mat (feet position, base px). Tall pets go on the
// back row so the smaller ones in front aren't hidden.
const SPOTS = {
  martin:        { x: 330,  y: 596 },
  storm:         { x: 525,  y: 592 },
  tiger:         { x: 720,  y: 596 },
  milk:          { x: 915,  y: 592 },
  aki:           { x: 1105, y: 598 },
  george:        { x: 250,  y: 692 },
  brownie:       { x: 450,  y: 696 },
  cherry:        { x: 650,  y: 700 },
  koazy:         { x: 855,  y: 696 },
  oreo:          { x: 1050, y: 700 },
  ebonyandivory: { x: 1225, y: 686 },
};
const ORDER = Object.keys(PETS);

export default function PetRoomScreen({ navigation }) {
  const { state } = useGame();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState(null);
  const sw = box.w, sh = box.h;
  const owned = state.player.ownedPets ?? [];
  const names = state.player.petNames ?? {};
  const fx = (v) => (v / PLOPPER_W) * sw;
  const fy = (v) => (v / PLOPPER_H) * sh;

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={PETROOM_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && (
        <>
          <View pointerEvents="none" style={[styles.title, { top: fy(30) }]}>
            <View style={styles.pill}>
              <PixelText size={Math.max(12, fx(20))}>Pet lounge</PixelText>
              <PixelText size={Math.max(8, fx(11))} color="#7a5030">{owned.length} of {ORDER.length} pets home</PixelText>
            </View>
          </View>

          {ORDER.map((key) => {
            const spot = SPOTS[key];
            if (!spot || !owned.includes(key)) return null;
            const shop = SHOP_PETS.find((p) => p.key === key) ?? { w: 120, h: 120, flip: false };
            const w = fx(shop.w * 1.1), h = fx(shop.h * 1.1);
            const z = Math.round(spot.y / 10);   // depth by row; stays below the pet card (z 200)
            return (
              <React.Fragment key={key}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelected(key)}
                  style={{ position: 'absolute', left: fx(spot.x) - w / 2, top: fy(spot.y) - h, width: w, height: h, zIndex: z }}
                >
                  <PetSprite petKey={key} w={w} h={h} flip={shop.flip} />
                </TouchableOpacity>
                <View pointerEvents="none" style={[styles.nameWrap, { left: fx(spot.x) - fx(110), width: fx(220), top: fy(spot.y + 6), zIndex: 90 }]}>
                  <View style={styles.tag}><PixelText size={Math.max(8, fx(11))}>{names[key] ?? PETS[key].name}</PixelText></View>
                </View>
              </React.Fragment>
            );
          })}

          {owned.length === 0 && (
            <View pointerEvents="none" style={[styles.title, { top: fy(300) }]}>
              <View style={styles.pill}><PixelText size={Math.max(9, fx(13))}>No pets yet. Adopt one at the pet shop!</PixelText></View>
            </View>
          )}
        </>
      )}

      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Settings')}
        onMap={() => navigation.navigate('Map')}
      />

      {selected && <AdoptModal petKey={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignItems: 'center', backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 6 },
  tag: { backgroundColor: '#f3e0b6', borderWidth: 2, borderColor: '#8a5a2a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 1 },
  root: { flex: 1, backgroundColor: '#2a1608' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  title: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  nameWrap: { position: 'absolute', alignItems: 'center' },
});
