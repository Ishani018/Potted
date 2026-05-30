import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { useLayout } from '../context/LayoutContext';
import { NURSERY_BG, SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { NurseryCartScene } from '../components/CartOverlay';
import { projectPoint } from '../engine/project';
import { RAW_SHELF_SLOTS, ALL_SEEDS } from '../constants/nurseryData';


// Shuffle once per app session at module load time — stable across remounts
const _shuffledSlots = (() => {
  const slots = [...RAW_SHELF_SLOTS];
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots;
})();

export default function NurseryScreen({ navigation }) {
  const { width: sw, height: sh } = useLayout();
  const { state, dispatch } = useGame();
  const cart = state.cart;

  // Build shelf items using the stable session-shuffle — positions never reset on remount
  const shelfItems = useMemo(() => {
    return ALL_SEEDS.map((seed, i) => {
      const raw = _shuffledSlots[i] ?? _shuffledSlots[_shuffledSlots.length - 1];
      const p = projectPoint(raw.x, raw.y, sw, sh);
      return {
        id: `shelf_${i}_${seed.key}`,
        flowerKey: seed.key,
        name: seed.name,
        shelfX: p.x,
        shelfY: p.y,
      };
    });
  }, [sw, sh]);

  const handleGoToGarden = () => {
    navigation.navigate('CartTransition', { destination: 'Garden', exiting: false });
  };

  return (
    <View style={styles.root}>
      {/* Background */}
      <Image
        source={NURSERY_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      {/* Coin HUD top-left */}
      <View style={styles.coinBox}>
        <Image source={UI_IMAGES.goldcoins} style={styles.coinIcon} resizeMode="contain" />
        <Text style={styles.coinText}>{state.player.coins}</Text>
      </View>

      {/* Back button top-left */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Image source={UI_IMAGES.back} style={styles.backImg} resizeMode="contain" />
      </TouchableOpacity>


      {/* Draggable seeds + cart scene */}
      <NurseryCartScene shelfItems={shelfItems} />

      {/* Take to garden — only when cart has items */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.goBtn} onPress={handleGoToGarden}>
          <Text style={styles.goBtnText}>Take to Garden →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0f00', overflow: 'hidden' },

  backBtn: {
    position: 'absolute',
    top: 12,
    left: 14,
    width: 40,
    height: 40,
    zIndex: 50,
  },
  backImg: { width: 40, height: 40 },

  coinBox: {
    position: 'absolute',
    top: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 50,
  },
  coinIcon: { width: 26, height: 26 },
  coinText: {
    color: '#ffe8a0',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  goBtn: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(30,60,10,0.92)',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#70a840',
    zIndex: 50,
  },
  goBtnText: { color: '#d8ffa0', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
});
