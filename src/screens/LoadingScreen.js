import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import PottedArt from '../components/PottedArt';

// Shown after PLAY: a calm cream screen where a little daisy grows as the bar fills, then on to the town map.
const DURATION = 3200;
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const INK = '#4a2a10';
const TIPS = [
  'Tap a thirsty plant with the watering can.',
  'Hearts keep your favourites at the top of the journal.',
  'Pets bring home surprises from their adventures.',
  'Customers love a bouquet tied with their favourite ribbon.',
  'Shelf pots and hanging pots are sold at the nursery.',
];

export default function LoadingScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const [pct, setPct] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);
  const stage = pct < 22 ? 0 : pct < 52 ? 1 : pct < 84 ? 2 : 3;
  const lastStage = useRef(0);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start(({ finished }) => {
      if (finished) setTimeout(() => navigation.replace('Map'), 350);
    });
    return () => progress.removeListener(id);
  }, []);

  // a little hop each time the plant grows a stage
  useEffect(() => {
    if (stage === lastStage.current) return;
    lastStage.current = stage;
    pop.setValue(0.86);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: false }).start();
  }, [stage]);

  const k = box.h ? Math.min(box.h / 480, box.w / 854) : 1;
  const barW = 360 * k;
  const fillW = progress.interpolate({ inputRange: [0, 1], outputRange: [0, barW - 8 * k] });

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {box.w > 0 && (
        <View style={styles.center}>
          <Text style={[styles.title, { fontSize: 34 * k }]}>Opening the shop</Text>
          <Animated.View style={{ height: 190 * k, justifyContent: 'flex-end', alignItems: 'center', transform: [{ scale: pop }] }}>
            <PottedArt pot={4} plantKey="daisy" stage={stage} potW={Math.round(130 * k)} />
          </Animated.View>
          <View style={[styles.track, { width: barW, height: 22 * k, borderRadius: 11 * k, borderWidth: Math.max(2, 3 * k) }]}>
            <Animated.View style={{ width: fillW, height: '100%', borderRadius: 8 * k, backgroundColor: '#6a9a3a' }} />
          </View>
          <Text style={[styles.pct, { fontSize: 20 * k }]}>{pct}%</Text>
          <Text style={[styles.tip, { fontSize: 17 * k }]}>{tip}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3e0b6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: SERIF, fontWeight: 'bold', color: INK, marginBottom: 6 },
  track: { backgroundColor: '#e3cf9c', borderColor: '#8a5a2a', padding: 2, marginTop: 14, justifyContent: 'center' },
  pct: { fontFamily: SERIF, fontWeight: 'bold', color: INK, marginTop: 8 },
  tip: { fontFamily: SERIF, color: '#7a5030', marginTop: 10, textAlign: 'center', paddingHorizontal: 24 },
});
