import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Short message pill at the bottom of the screen.
// const [toast, showToast] = useToast(); ... {toast} ... showToast('Hi');
export function useToast(duration = 1600) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), duration);
  }, [duration]);
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);
  const el = msg ? (
    <View style={styles.toast} pointerEvents="none">
      <Text style={styles.text}>{msg}</Text>
    </View>
  ) : null;
  return [el, show];
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 22, alignSelf: 'center',
    backgroundColor: 'rgba(18,8,0,0.94)',
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9,
    borderWidth: 1.5, borderColor: '#c8873a', zIndex: 8000,
  },
  text: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },
});
