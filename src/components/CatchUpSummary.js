import React from 'react';
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { UI_IMAGES, BOOK_CARD } from '../engine/assets';
import { PixelButton } from './Pixel';
import { ROOM_NAMES } from '../constants/gameData';

// "While you were away" card. Shown once after coming back to the game (the
// summary is built by TICK in GameContext); dismissed with the button.

function formatAway(ms) {
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function roomLine(r) {
  const parts = [];
  if (r.ready) parts.push(plural(r.ready, 'ready to harvest', 'ready to harvest'));
  if (r.thirsty) parts.push(plural(r.thirsty, 'thirsty', 'thirsty'));
  if (r.pests) parts.push(plural(r.pests, 'bug', 'bugs'));
  if (r.wilting) parts.push(plural(r.wilting, 'wilting', 'wilting'));
  return parts.join(' · ');
}

export default function CatchUpSummary({ hidden }) {
  const { state, dispatch } = useGame();
  const summary = state.awaySummary;
  if (!summary || hidden) return null;

  const rooms = Object.entries(summary.rooms)
    .map(([room, r]) => ({ room, line: roomLine(r) }))
    .filter((r) => r.line);

  // The painted card is 330×430; the writing sits on the paper above the ribbon.
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Image source={BOOK_CARD} style={styles.cardArt} resizeMode="stretch" />
        <View style={styles.paper}>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.sub}>You were away for {formatAway(summary.awayMs)}</Text>

          {rooms.map(({ room, line }) => (
            <View key={room} style={styles.row}>
              <Text style={styles.room}>{ROOM_NAMES[room] ?? `Room ${room}`}</Text>
              <Text style={styles.line}>{line}</Text>
            </View>
          ))}

          {summary.newPests > 0 && (
            <Text style={styles.note}>
              {plural(summary.newPests, 'bug', 'bugs')} moved in while you were gone. Tap them to shoo them away!
            </Text>
          )}

          {summary.coins > 0 && (
            <View style={styles.coinRow}>
              <Image source={UI_IMAGES.goldcoins} style={styles.coin} resizeMode="contain" />
              <Text style={styles.coinTxt}>Your hanging plants earned {summary.coins} coins</Text>
            </View>
          )}

          <PixelButton label="LET'S GO!" size={11} onPress={() => dispatch({ type: 'DISMISS_SUMMARY' })} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
}

const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const BODY = Platform.select({ web: "'PatrickHand', Georgia, serif", default: 'PatrickHand' });

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', zIndex: 9500,
  },
  card: { width: 366, height: 486 },
  cardArt: { position: 'absolute', width: 366, height: 486 },
  paper: { position: 'absolute', left: 62, right: 62, top: 78, height: 262, alignItems: 'center' },
  title: { fontFamily: HEAD, fontSize: 28, color: '#4a2a10', lineHeight: 28 },
  sub: { fontFamily: BODY, color: '#8a6a40', fontSize: 15, marginBottom: 6 },
  row: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(160,120,60,0.4)', paddingVertical: 3,
  },
  room: { fontFamily: HEAD, color: '#4a2a10', fontSize: 15, width: 76 },
  line: { flex: 1, fontFamily: BODY, color: '#5a3a1a', fontSize: 13.5, lineHeight: 15 },
  note: { fontFamily: BODY, color: '#7a4a18', fontSize: 13.5, lineHeight: 15, marginTop: 4, textAlign: 'center' },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  coin: { width: 18, height: 18 },
  coinTxt: { fontFamily: BODY, color: '#7a5a10', fontSize: 13.5 },
});
