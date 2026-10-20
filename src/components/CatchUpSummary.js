import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { UI_IMAGES } from '../engine/assets';
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

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
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

        <TouchableOpacity style={styles.btn} onPress={() => dispatch({ type: 'DISMISS_SUMMARY' })} activeOpacity={0.85}>
          <Text style={styles.btnTxt}>Let's go!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', zIndex: 9500,
  },
  card: {
    backgroundColor: '#f3e3c0', borderRadius: 14, borderWidth: 3, borderColor: '#7a3e1a',
    paddingHorizontal: 22, paddingVertical: 16, minWidth: 300, maxWidth: 440, alignItems: 'center',
  },
  title: { fontFamily: 'PressStart2P', fontSize: 14, color: '#4a2a10', marginBottom: 6 },
  sub: { color: '#8a6a40', fontSize: 12, marginBottom: 10 },
  row: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#d9c39a', paddingVertical: 5,
  },
  room: { color: '#4a2a10', fontSize: 12, fontWeight: 'bold', width: 84 },
  line: { flex: 1, color: '#5a3a1a', fontSize: 12 },
  note: { color: '#7a4a18', fontSize: 11, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  coin: { width: 18, height: 18 },
  coinTxt: { color: '#7a5a10', fontSize: 12, fontWeight: 'bold' },
  btn: {
    marginTop: 14, backgroundColor: '#3d6020', borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 9, borderWidth: 1.5, borderColor: '#70a840',
  },
  btnTxt: { color: '#e0ffc0', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
});
