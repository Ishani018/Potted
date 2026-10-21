import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { BOOK_TILES } from '../engine/assets';

// The painted page card behind a book tile: 'empty', 'found', 'selected' or
// 'locked' (wax-sealed). Put it first inside the tile; it stretches to fill it.
export default function TileFrame({ state = 'empty' }) {
  return <Image source={BOOK_TILES[state]} style={styles.fill} resizeMode="stretch" pointerEvents="none" />;
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});
