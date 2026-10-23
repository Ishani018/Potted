import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { BUILDING_BG, UI_IMAGES, BUTLER } from '../engine/assets';
import { APARTMENTS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import { pixelText } from '../components/Pixel';
import { Skinned } from '../components/NineSlice';
import InventoryOverlay from '../components/InventoryOverlay';

// The building picture is 1672×941. Each door's tap area, as fractions of it.
const IMG_W = 1672, IMG_H = 941;
const DOORS = {
  3: { x0: 480, y0: 70,  x1: 780, y1: 290 },
  2: { x0: 562, y0: 345, x1: 765, y1: 578 },
  1: { x0: 582, y0: 655, x1: 755, y1: 868 },
};
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

export default function BuildingScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [asking, setAsking] = useState(null);
  const [keys, setKeys] = useState(null);   // the butler hands over the keys after a purchase
  const [invOpen, setInvOpen] = useState(false);
  const sw = box.w, sh = box.h;
  const owned = state.player.ownedApartments ?? [];
  const coins = state.player.coins;

  const tapDoor = (id) => {
    if (owned.includes(id)) navigation.navigate('Apartment', { aptId: id });
    else setAsking(id);
  };

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={BUILDING_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && [1, 2, 3].map((id) => {
        const d = DOORS[id], isOwned = owned.includes(id);
        const l = (d.x0 / IMG_W) * sw, t = (d.y0 / IMG_H) * sh, w = ((d.x1 - d.x0) / IMG_W) * sw, h = ((d.y1 - d.y0) / IMG_H) * sh;
        return (
          <TouchableOpacity key={id} activeOpacity={0.85} onPress={() => tapDoor(id)} style={{ position: 'absolute', left: l, top: t, width: w, height: h, alignItems: 'center', justifyContent: 'center', borderRadius: w * 0.25, backgroundColor: isOwned ? 'transparent' : 'rgba(30,16,6,0.38)' }}>
            {!isOwned && (
              <View style={styles.lockChip}>
                <Text style={styles.lockText}>{'\u{1F512}'}</Text>
                <Image source={UI_IMAGES.goldcoins} style={{ width: 16, height: 16 }} resizeMode="contain" />
                <Text style={styles.lockText}>{APARTMENTS[id].price}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Settings')} onMap={() => navigation.navigate('Map')} onInventory={() => setInvOpen(true)} />

      {asking && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setAsking(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            <Text style={styles.title}>{APARTMENTS[asking].name}</Text>
            <Text style={styles.sub}>{APARTMENTS[asking].floor} · {APARTMENTS[asking].size}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 10 }}>
              <Image source={UI_IMAGES.goldcoins} style={{ width: 24, height: 24 }} resizeMode="contain" />
              <Text style={[styles.title, { fontSize: 24 }]}>{APARTMENTS[asking].price}</Text>
            </View>
            <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.5} disabled={coins < APARTMENTS[asking].price}
              onPress={coins >= APARTMENTS[asking].price ? () => { dispatch({ type: 'BUY_APARTMENT', aptId: asking, price: APARTMENTS[asking].price }); setKeys(asking); setAsking(null); } : undefined}
              style={{ paddingVertical: 11, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={pixelText(11, '#fff')}>{coins >= APARTMENTS[asking].price ? 'BUY' : `NEED ${APARTMENTS[asking].price - coins} MORE`}</Text>
            </Skinned>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {keys && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setKeys(null)}>
          <View style={[styles.card, { flexDirection: 'row', gap: 14, alignItems: 'center', maxWidth: 440 }]}>
            <Image source={BUTLER.keys.src} resizeMode="contain" style={{ width: 90, height: 90 * BUTLER.keys.h / BUTLER.keys.w }} />
            <View style={{ flexShrink: 1, alignItems: 'center' }}>
              <Text style={styles.title}>Your new home!</Text>
              <Text style={styles.sub}>Here are the keys to {APARTMENTS[keys].name}. Enjoy it!</Text>
              <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.5} onPress={() => { const id = keys; setKeys(null); navigation.navigate('Apartment', { aptId: id }); }} style={{ marginTop: 10, paddingVertical: 9, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={pixelText(10, '#fff')}>GO IN</Text>
              </Skinned>
            </View>
          </View>
        </TouchableOpacity>
      )}
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1208' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  lockChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(40,22,8,0.78)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  lockText: { fontFamily: SERIF, fontSize: 14, color: '#ffe9b8' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  card: { backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 28, alignItems: 'center', maxWidth: 360 },
  title: { fontFamily: SERIF, fontSize: 22, color: '#4a2a10', textAlign: 'center', fontWeight: 'bold' },
  sub: { fontFamily: SERIF, fontSize: 14, color: '#7a5030', textAlign: 'center', marginTop: 2 },
});
