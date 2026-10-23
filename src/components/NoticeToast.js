import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SET_UI } from '../engine/assets';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
import { useGame } from '../context/GameContext';

// Shows queued game notices (pet gifts, bugs caught, lucky harvests) one at a
// time at the top of the screen, on whichever screen you're on.
const SHOW_MS = 2800;

export default function NoticeToast({ hidden, onVisit }) {
  const { state, dispatch } = useGame();
  const notice = state.notices?.[0];
  hidden = hidden || !!state.awaySummary; // wait for the welcome-back card

  useEffect(() => {
    if (!notice || hidden || notice.kind === 'stray') return;   // a stray waits for your answer
    const t = setTimeout(() => dispatch({ type: 'SHIFT_NOTICE' }), SHOW_MS);
    return () => clearTimeout(t);
  }, [notice?.id, hidden]);

  if (!notice || hidden) return null;
  if (notice.kind === 'stray') {
    const bh = 34, btn = (label, onPress, tone) => (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ height: bh, minWidth: bh * SET_UI[tone].w / SET_UI[tone].h, paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={SET_UI[tone].src} resizeMode="stretch" style={StyleSheet.absoluteFill} />
        <Text style={styles.btnText}>{label}</Text>
      </TouchableOpacity>
    );
    return (
      <View style={styles.wrap} pointerEvents="box-none">
        <View style={styles.strayCard}>
          <Text style={styles.strayTitle}>{notice.icon}  {notice.title}</Text>
          <Text style={styles.strayText}>{notice.text}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            {btn('Dismiss', () => dispatch({ type: 'SHIFT_NOTICE' }), 'btnCream')}
            {btn('Visit the pet store', () => { dispatch({ type: 'SHIFT_NOTICE' }); onVisit && onVisit(); }, 'btnCream')}
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.pill}>
        <Text style={styles.paw}>{notice.icon ?? '🐾'}</Text>
        <Text style={styles.text}>{notice.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center', zIndex: 9400 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f3e0b6', borderRadius: 16, borderWidth: 4, borderColor: '#8a5a2a',
    paddingHorizontal: 18, paddingVertical: 8, maxWidth: '78%',
  },
  strayCard: { alignItems: 'center', backgroundColor: '#f3e0b6', borderRadius: 18, borderWidth: 4, borderColor: '#8a5a2a', paddingHorizontal: 22, paddingVertical: 12, maxWidth: '86%' },
  strayTitle: { color: '#4a2a10', fontSize: 20, fontFamily: SERIF, fontWeight: 'bold' },
  strayText: { color: '#6a4524', fontSize: 15, fontFamily: SERIF, textAlign: 'center', marginTop: 2 },
  btnText: { color: '#4a2a10', fontSize: 15, fontFamily: SERIF, fontWeight: 'bold' },
  paw: { fontSize: 16 },
  text: { color: '#4a2a10', fontSize: 17, fontFamily: SERIF, fontWeight: 'bold', flexShrink: 1, textAlign: 'center' },
});
