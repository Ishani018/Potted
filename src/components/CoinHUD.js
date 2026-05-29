import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';

export default function CoinHUD() {
  const { state } = useGame();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{'$'} {state.player.coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 14,
    backgroundColor: 'rgba(30,15,0,0.72)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#c8873a',
  },
  text: {
    color: '#ffe8a0',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
