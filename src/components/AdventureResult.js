import React from 'react';
import PlateImage from './PlateImage';
import { View, Text, Image, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';
import { SET_UI, SHOP_IMAGES, UI_IMAGES, TRADE_IMAGES } from '../engine/assets';
import { PETS, POTTED_FLOWERS, HANGING_PLANTS, TRADE_FLOWERS } from '../constants/gameData';

const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });
const seedName = (k) => POTTED_FLOWERS[k]?.name ?? HANGING_PLANTS[k]?.name ?? k;

// The box a pet brings home: what was inside, on the painted torn-paper card.
export default function AdventureResult() {
  const { state, dispatch } = useGame();
  const res = state.lastAdventure;
  if (!res) return null;
  const name = state.player.petNames?.[res.petKey] ?? PETS[res.petKey]?.name ?? 'Your pet';
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.paper}>
          <Text style={styles.title}>{name} is back!</Text>
          <Image source={SHOP_IMAGES.box} style={styles.box} resizeMode="contain" />
          <Text style={styles.sub}>In the box:</Text>
          {res.rewards.map((r, i) => (
            <View key={i} style={styles.row}>
              {r.type === 'coins' && <Image source={UI_IMAGES.goldcoins} style={styles.icon} resizeMode="contain" />}
              {r.type === 'seed' && <Image source={UI_IMAGES.seed} style={styles.icon} resizeMode="contain" />}
              {r.type === 'flower' && <Image source={TRADE_IMAGES[TRADE_FLOWERS[r.flowerKey]?.img]} style={styles.icon} resizeMode="contain" />}
              <Text style={styles.line}>
                {r.type === 'coins' ? `${r.amount} coins` : r.type === 'seed' ? `${seedName(r.flowerKey)} seeds` : `${r.amount} ${TRADE_FLOWERS[r.flowerKey]?.name ?? r.flowerKey}`}
              </Text>
            </View>
          ))}
          {res.full && <Text style={styles.note}>Your bag was full, so a seed stayed behind.</Text>}
          <TouchableOpacity activeOpacity={0.8} onPress={() => dispatch({ type: 'CLOSE_ADVENTURE' })} style={styles.btn}>
            <PlateImage w={150} h={44} />
            <Text style={styles.btnTxt}>Nice!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 9500 },
  card: { width: 380, maxWidth: '86%', backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18, padding: 16 },
  paper: { alignItems: 'center' },
  btn: { width: 150, height: 44, marginTop: 16, marginBottom: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  btnTxt: { fontFamily: HEAD, fontSize: 17, fontWeight: 'bold', color: '#4a2a10' },
  title: { fontFamily: HEAD, fontSize: 26, fontWeight: 'bold', color: '#4a2a10', lineHeight: 30 },
  box: { width: 84, height: 74, marginTop: 4 },
  sub: { fontFamily: BODY, color: '#8a6a40', fontSize: 16, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  icon: { width: 30, height: 30 },
  line: { fontFamily: HEAD, fontSize: 21, color: '#4a2a10' },
  note: { fontFamily: BODY, color: '#7a4a18', fontSize: 14, marginTop: 4, textAlign: 'center' },
});
