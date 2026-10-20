import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
        <Text style={styles.paw}>🐾</Text>
        <Text style={styles.text}>{notice.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center', zIndex: 9400 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f3e3c0', borderRadius: 12, borderWidth: 2, borderColor: '#7a3e1a',
    paddingHorizontal: 16, paddingVertical: 8, maxWidth: '80%',
  },
  paw: { fontSize: 14 },
  text: { color: '#4a2a10', fontSize: 13, fontWeight: 'bold', flexShrink: 1 },
});
