import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { UI_IMAGES } from '../engine/assets';

export default function CoinHUD() {
  const { state } = useGame();
  return (
    <View style={styles.container}>
      <Image source={UI_IMAGES.goldcoins} style={styles.icon} resizeMode="contain" />
      <Text style={styles.text}>{state.player.coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 20,
  },
  icon: {
    width: 28,
    height: 28,
  },
  text: {
    color: '#ffe8a0',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
