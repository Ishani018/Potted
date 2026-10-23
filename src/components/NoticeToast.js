import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
import { useGame } from '../context/GameContext';

// Shows queued game notices (pet gifts, bugs caught, lucky harvests) one at a
// time at the top of the screen, on whichever screen you're on.
const SHOW_MS = 2800;

export default function NoticeToast({ hidden }) {
  const { state, dispatch } = useGame();
  const notice = state.notices?.[0];
  hidden = hidden || !!state.awaySummary; // wait for the welcome-back card

  useEffect(() => {
    if (!notice || hidden) return;
    const t = setTimeout(() => dispatch({ type: 'SHIFT_NOTICE' }), SHOW_MS);
    return () => clearTimeout(t);
  }, [notice?.id, hidden]);

  if (!notice || hidden) return null;
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
  paw: { fontSize: 16 },
  text: { color: '#4a2a10', fontSize: 17, fontFamily: SERIF, fontWeight: 'bold', flexShrink: 1, textAlign: 'center' },
});
