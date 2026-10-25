import React from 'react';
import { View, Text, Image, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';
import { UI_IMAGES, SET_UI } from '../engine/assets';
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
      <View style={styles.panel}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.sub}>You were away for {formatAway(summary.awayMs)}</Text>

        {rooms.length === 0 && summary.coins <= 0 && !(summary.newPests > 0) ? (
          <Text style={styles.note}>Everything is just as you left it.</Text>
        ) : null}

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

        <TouchableOpacity activeOpacity={0.8} onPress={() => dispatch({ type: 'DISMISS_SUMMARY' })} style={styles.btn}>
          <Image source={SET_UI.btnGreen.src} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, width: 150, height: 44 }} />
          <Text style={styles.btnTxt}>Let's go!</Text>
        </TouchableOpacity>
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
  panel: { width: 380, maxWidth: '86%', backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18, alignItems: 'center' },
  title: { fontFamily: HEAD, fontSize: 26, fontWeight: 'bold', color: '#4a2a10' },
  sub: { fontFamily: HEAD, color: '#7a5030', fontSize: 15, marginBottom: 10 },
  row: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#d9bd86' },
  room: { fontFamily: HEAD, color: '#4a2a10', fontSize: 16, fontWeight: 'bold', width: 100 },
  line: { flex: 1, fontFamily: HEAD, color: '#6a4524', fontSize: 15 },
  note: { fontFamily: HEAD, color: '#6a4524', fontSize: 14.5, marginTop: 6, textAlign: 'center' },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  coin: { width: 22, height: 22 },
  coinTxt: { fontFamily: HEAD, color: '#4a2a10', fontSize: 14.5 },
  btn: { width: 150, height: 44, marginTop: 16, marginBottom: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  btnTxt: { fontFamily: HEAD, fontSize: 17, fontWeight: 'bold', color: '#fff3d0' },
});
