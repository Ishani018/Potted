import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_IMAGES } from '../engine/assets';
import { CUSTOMERS, TRADE_FLOWERS } from '../constants/gameData';
import Portrait from './Portrait';
import BookFrame from './BookFrame';
import TileFrame from './TileFrame';
import { BookTabs, bookStyles as b, INK, BODY } from './BookParts';

// Garden journal → Customers. A portrait card for everyone who visits the florist.
// A card fills in the first time you serve that customer; until then it's a
// silhouette. Shows what they like, how often you've served them, and today's visit.
const KEYS = Object.keys(CUSTOMERS);

export default function BookCustomers({ tab, setTab }) {
  const { state } = useGame();
  const book = state.player.customerBook ?? {};
  const today = state.player.customers?.list ?? [];
  const [selected, setSelected] = useState(KEYS[0]);

  const met = KEYS.filter((k) => book[k]).length;
  const c = CUSTOMERS[selected];
  const rec = book[selected];
  const order = today.find((o) => o.customer === selected);
  const visit = !order ? 'Not visiting today' : order.done ? 'Served today' : 'Waiting at the florist';
  const visitColor = !order ? '#a08860' : order.done ? '#3f7a2e' : '#a8700a';

  return (
    <BookFrame
      left={(
        <View style={b.pageInner}>
          <BookTabs tab={tab} setTab={setTab} />
          <Text style={b.progress}>{met} / {KEYS.length} met</Text>
          <View style={b.grid}>
            {KEYS.map((k) => {
              const isMet = !!book[k];
              return (
                <TouchableOpacity
                  key={k}
                  activeOpacity={0.8}
                  onPress={() => setSelected(k)}
                  style={[b.tile, isMet && b.tileFound, k === selected && b.tileSel, s.card]}
                >
                  <TileFrame state={k === selected ? 'selected' : isMet ? 'found' : 'empty'} />
                  <Portrait customerKey={k} size={44} silhouette={!isMet} />
                  <Text numberOfLines={1} style={[b.tileName, !isMet && b.tileNameLocked]}>{isMet ? CUSTOMERS[k].name : '???'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
      right={(
        <ScrollView style={b.pageInner} contentContainerStyle={b.detail} showsVerticalScrollIndicator={false}>
          <Portrait customerKey={selected} size={84} silhouette={!rec} />
          <Text style={[b.name, { marginTop: 5 }]}>{rec ? c.name : '???'}</Text>
          {rec ? (
            <>
              <Text style={b.blurb}>{c.bio}</Text>
              <Text style={b.label}>LIKES</Text>
              <View style={s.likes}>
                {c.likes.map((f) => (
                  <View key={f} style={s.like}>
                    {TRADE_IMAGES[TRADE_FLOWERS[f]?.img] && <Image source={TRADE_IMAGES[TRADE_FLOWERS[f].img]} style={s.likeImg} resizeMode="contain" />}
                    <Text style={s.likeTxt} numberOfLines={1}>{TRADE_FLOWERS[f]?.name ?? f}</Text>
                  </View>
                ))}
              </View>
              <Text style={b.sub}>Served {rec.served}× · first visit {new Date(rec.firstAt).toLocaleDateString()}</Text>
              <Text style={[b.tagline, { color: visitColor }]}>✦ {visit}</Text>
            </>
          ) : (
            <>
              <Text style={b.note}>You haven't met this customer yet.</Text>
              <Text style={b.sub}>Keep serving the florist's visitors each day and they will drop by.</Text>
              <Text style={[b.tagline, { color: visitColor }]}>✦ {visit}</Text>
            </>
          )}
        </ScrollView>
      )}
    />
  );
}

const s = StyleSheet.create({
  card: { width: '31%', paddingHorizontal: 2 },
  likes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 4 },
  like: { alignItems: 'center', width: 58 },
  likeImg: { width: 30, height: 30 },
  likeTxt: { fontFamily: BODY, color: INK, fontSize: 12, marginTop: 1 },
});
