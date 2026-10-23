import React from 'react';
import { View, StyleSheet } from 'react-native';

// The card behind a book tile: 'empty', 'found', 'selected' or 'locked'. A plain cream card with a brown edge;
// the chosen one gets a green edge. Put it first inside the tile; it stretches to fill it.
const LOOK = {
  empty:    { backgroundColor: '#efdcae', borderColor: '#cdae78' },
  found:    { backgroundColor: '#f7e8c2', borderColor: '#b98a4e' },
  selected: { backgroundColor: '#fbf0cf', borderColor: '#5a8a3a' },
  locked:   { backgroundColor: '#e2cfa0', borderColor: '#c4a56e' },
};
export default function TileFrame({ state = 'empty' }) {
  return <View pointerEvents="none" style={[styles.fill, LOOK[state] || LOOK.empty, state === 'selected' && { borderWidth: 3 }]} />;
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, borderRadius: 10, borderWidth: 2 },
});
