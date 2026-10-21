import React from 'react';
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { BOOK_CARD, SHOP_IMAGES, UI_IMAGES, TRADE_IMAGES } from '../engine/assets';
import { PETS, POTTED_FLOWERS, HANGING_PLANTS, TRADE_FLOWERS } from '../constants/gameData';
import { PixelButton } from './Pixel';

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
        <Image source={BOOK_CARD} style={styles.art} resizeMode="stretch" />
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
          <PixelButton label="NICE!" size={11} onPress={() => dispatch({ type: 'CLOSE_ADVENTURE' })} style={{ marginTop: 10 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 9500 },
  // the painted card is 573×760; the writing sits on its inner paper, clear of the corner flowers and ribbon
  card: { width: 366, height: 486 },
  art: { position: 'absolute', width: 366, height: 486 },
  paper: { position: 'absolute', left: 62, right: 62, top: 78, height: 262, alignItems: 'center' },
  title: { fontFamily: HEAD, fontSize: 26, color: '#4a2a10', lineHeight: 30 },
  box: { width: 84, height: 74, marginTop: 4 },
  sub: { fontFamily: BODY, color: '#8a6a40', fontSize: 16, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  icon: { width: 30, height: 30 },
  line: { fontFamily: HEAD, fontSize: 21, color: '#4a2a10' },
  note: { fontFamily: BODY, color: '#7a4a18', fontSize: 14, marginTop: 4, textAlign: 'center' },
});
