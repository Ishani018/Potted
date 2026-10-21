import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { PAINTING_IMAGES } from '../engine/assets';
import { PAINTINGS } from '../constants/gameData';
import BookFrame from './BookFrame';
import TileFrame from './TileFrame';
import { BookTabs, BookButton, bookStyles as b } from './BookParts';

// Garden journal → Paintings. Every painting at the gallery; the ones you own are in
// colour. Pick one to hang it in the Balcony's photo frame (or take it down).
// Buying still happens at the gallery.
const KEYS = Object.keys(PAINTINGS);

export default function BookPaintings({ tab, setTab }) {
  const { state, dispatch } = useGame();
  const owned = state.player.ownedPaintings ?? [];
  const hung = state.player.placedDecor?.room2?.photoFrame ?? null;
  const [selected, setSelected] = useState(KEYS[0]);

  const p = PAINTINGS[selected];
  const has = owned.includes(selected);
  const isHung = hung === selected;
  const frame = (value) => dispatch({ type: 'PLACE_DECOR', room: 2, slot: 'photoFrame', value });

  return (
    <BookFrame
      left={(
        <View style={b.pageInner}>
          <BookTabs tab={tab} setTab={setTab} />
          <Text style={b.progress}>{owned.length} / {KEYS.length} collected</Text>
          <View style={b.grid}>
            {KEYS.map((k) => {
              const mine = owned.includes(k);
              return (
                <TouchableOpacity
                  key={k}
                  activeOpacity={0.8}
                  onPress={() => setSelected(k)}
                  style={[b.tile, mine && b.tileFound, k === selected && b.tileSel, s.card]}
                >
                  <TileFrame state={k === selected ? 'selected' : mine ? 'found' : 'empty'} />
                  <View style={b.tileArt}>
                    <Image source={PAINTING_IMAGES[k]} style={[s.tileImg, !mine && b.silhouette]} resizeMode="contain" />
                    {!mine && <Text style={b.tileQ}>?</Text>}
                    {hung === k && <Text style={s.hungStar}>✦</Text>}
                  </View>
                  <Text numberOfLines={1} style={[b.tileName, !mine && b.tileNameLocked]}>{mine ? PAINTINGS[k].name : '???'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
      right={(
        <ScrollView style={b.pageInner} contentContainerStyle={b.detail} showsVerticalScrollIndicator={false}>
          <View style={[s.frameBox, !has && s.frameBoxLocked]}>
            <Image source={PAINTING_IMAGES[selected]} style={[s.big, !has && b.silhouette]} resizeMode="contain" />
            {!has && <Text style={[b.tileQ, { fontSize: 22 }]}>?</Text>}
          </View>
          <Text style={[b.name, { marginTop: 6 }]}>{has ? p.name : '???'}</Text>

          {has ? (
            <>
              <Text style={[b.tagline, { color: isHung ? '#3f7a2e' : '#8a6a40' }]}>{isHung ? '✦ Hanging on the Balcony' : 'In your collection'}</Text>
              {isHung ? (
                <BookButton label="Take it down" onPress={() => frame(null)} />
              ) : (
                <BookButton label="Hang it on the Balcony" on onPress={() => frame(selected)} />
              )}
              <Text style={[b.note, { marginTop: 6 }]}>The Balcony has one photo frame. Hanging a painting replaces the one that's there.</Text>
            </>
          ) : (
            <Text style={b.note}>Not in your collection yet. Buy it at the gallery for {p.price} coins.</Text>
          )}
        </ScrollView>
      )}
    />
  );
}

const s = StyleSheet.create({
  card: { width: '23%', aspectRatio: 0.95 },
  tileImg: { width: '92%', height: '92%' },
  hungStar: { position: 'absolute', right: 2, top: -1, fontSize: 11, color: '#e0a830' },
  frameBox: {
    width: 136, height: 118, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fbf0cf', borderWidth: 3, borderColor: '#a8703a', borderRadius: 6,
  },
  frameBoxLocked: { backgroundColor: '#e6d6b0', borderColor: '#c9a86a' },
  big: { width: 120, height: 102 },
});
