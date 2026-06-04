import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LOADING_BG } from '../engine/assets';

// Shown after PLAY — a brief themed transition into the world (fixed 3s),
// then on to the town map.
const COUNT_FROM = 3;

export default function LoadingScreen({ navigation }) {
  const [count, setCount] = useState(COUNT_FROM);
  const pulse = useRef(new Animated.Value(0.4)).current;

  // Pulsing label.
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Tick the counter down each second; navigate at 0.
  useEffect(() => {
    if (count <= 0) {
      navigation.replace('Map');
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <View style={styles.root}>
      <Image source={LOADING_BG} style={styles.bg} resizeMode="cover" />
      <View style={styles.banner}>
        <Animated.Text style={[styles.text, { opacity: pulse }]}>
          Heading to town…
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140c' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  banner: {
    position: 'absolute', bottom: 28, alignSelf: 'center',
    backgroundColor: 'rgba(18,8,0,0.7)',
    borderRadius: 12, paddingHorizontal: 22, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#c8873a',
  },
  text: { color: '#ffe8a0', fontSize: 15, fontWeight: 'bold', letterSpacing: 2 },
});
