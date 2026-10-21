import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { BOOK_TAG } from '../engine/assets';

const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

// A hanging paper tag with a name and a line under it (hover labels on shelves).
export default function TagLabel({ title, sub, style }) {
  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <Image source={BOOK_TAG} style={styles.img} resizeMode="stretch" />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 138, height: 69, alignItems: 'center', justifyContent: 'center' },
  img: { position: 'absolute', width: 138, height: 69 },
  text: { marginLeft: 20, marginTop: 2, alignItems: 'center', maxWidth: 96 },
  title: { fontFamily: HEAD, fontSize: 14, color: '#4a2a10' },
  sub: { fontFamily: BODY, fontSize: 12, color: '#8a5a24' },
});
