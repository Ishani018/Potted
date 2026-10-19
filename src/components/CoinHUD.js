import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { UI_IMAGES } from '../engine/assets';
import { PixelText, COLORS } from './Pixel';

export default function CoinHUD() {
  const { state } = useGame();
  return (
    <View style={styles.container}>
      <Image source={UI_IMAGES.goldcoins} style={styles.icon} resizeMode="contain" />
      <PixelText size={11}>{state.player.coins}</PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 12, left: 84, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 20,
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  icon: { width: 22, height: 22 },
});
