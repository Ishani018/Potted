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

// Pet lounge — every pet you've adopted curled up in its own bed, so you can check
// in on them one by one. Tap a pet to see its perk, rename it, move it between
// rooms or rehome it. Beds are painted into petroom.png (1376×768 base);
// BEDS are the bed centres in the same coordinates.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const BEDS = [
  { x: 192,  y: 488 }, { x: 464,  y: 488 }, { x: 736,  y: 488 }, { x: 1008, y: 488 }, { x: 1280, y: 488 },
  { x: 120,  y: 664 }, { x: 352,  y: 664 }, { x: 584,  y: 664 }, { x: 816,  y: 664 }, { x: 1048, y: 664 }, { x: 1272, y: 664 },
];
const ORDER = Object.keys(PETS); // bed i belongs to pet i

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
          <PixelText size={Math.max(12, fx(24))} style={[styles.title, { top: fy(36) }]}>PET LOUNGE</PixelText>
          <PixelText size={Math.max(8, fx(11))} color="#f6e2b8" style={[styles.title, { top: fy(36) + fx(34) }]}>
            {owned.length}/{ORDER.length} PETS HOME
          </PixelText>

          {ORDER.map((key, i) => {
            const bed = BEDS[i];
            if (!bed || !owned.includes(key)) return null;
            const shop = SHOP_PETS.find((s) => s.key === key) ?? { w: 120, h: 120, flip: false };
            const k = Math.min(1, 170 / shop.w, 130 / shop.h);
            const w = fx(shop.w * k), h = fx(shop.h * k);
            const row = bed.y < 600 ? 1 : 2;
            return (
              <React.Fragment key={key}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelected(key)}
                  style={{ position: 'absolute', left: fx(bed.x) - w / 2, top: fy(bed.y + 8) - h, width: w, height: h, zIndex: row * 10 }}
                >
                  <PetSprite petKey={key} w={w} h={h} flip={shop.flip} />
                </TouchableOpacity>
                <View pointerEvents="none" style={[styles.nameWrap, { left: fx(bed.x) - fx(110), width: fx(220), top: fy(bed.y + 38), zIndex: row * 10 + 1 }]}>
                  <PixelText size={Math.max(8, fx(12))}>{(names[key] ?? PETS[key].name).toUpperCase()}</PixelText>
                </View>
              </React.Fragment>
            );
          })}

          {owned.length === 0 && (
            <PixelText size={Math.max(9, fx(14))} color="#f6e2b8" style={[styles.title, { top: fy(300) }]}>
              NO PETS YET - ADOPT ONE AT THE PET SHOP!
            </PixelText>
          )}
        </>
      )}

      <ScreenHud
        sw={sw} sh={sh}
        onSettings={() => navigation.navigate('Room')}
        onMap={() => navigation.navigate('Map')}
      />

      {selected && <AdoptModal petKey={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2a1608' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  title: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  nameWrap: { position: 'absolute', alignItems: 'center' },
});
