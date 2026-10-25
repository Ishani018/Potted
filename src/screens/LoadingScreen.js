import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { ROOM_BGS, HOME_BG, MAP_BG, TRADE_IMAGES } from '../engine/assets';

// Shown after PLAY, in the style of a big-game loading screen: a full-bleed painting of the game, a thin bar along the
// very bottom, a tip above it, and a small spinning flower with "Loading" in the corner. Then on to the town map.
const DURATION = 3400;
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const ART = [HOME_BG, ROOM_BGS.room2, ROOM_BGS.room3, ROOM_BGS.room1, MAP_BG];
const TIPS = [
  'Tap a thirsty plant with the watering can.',
  'Hearts keep your favourites at the top of the journal.',
  'Pets bring home surprises from their adventures.',
  'Customers love a bouquet tied with their favourite ribbon.',
  'Shelf pots and hanging pots are sold at the nursery.',
  'A bouquet tied with the right ribbon earns a bigger tip.',
];
const BANDS = 14;   // stacked dark bands that fade the bottom of the picture (no gradient needed)

export default function LoadingScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const art = useMemo(() => ART[Math.floor(Math.random() * ART.length)], []);
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start(({ finished }) => {
      if (finished) setTimeout(() => navigation.replace('Map'), 300);
    });
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, []);

  const k = box.h ? Math.min(box.h / 480, box.w / 854) : 1;
  const fillW = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={art} style={styles.bg} resizeMode="cover" />

      {box.w > 0 && (
        <>
          {/* the bottom of the picture fades to dark so the words read */}
          <View pointerEvents="none" style={[styles.fade, { height: box.h * 0.4 }]}>
            {Array.from({ length: BANDS }, (_, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: `rgba(243,224,182,${(0.95 * Math.pow(i / (BANDS - 1), 1.2)).toFixed(3)})` }} />
            ))}
          </View>

          <Text style={[styles.tip, { fontSize: 19 * k, bottom: 34 * k }]}>Tip: {tip}</Text>

          <View style={[styles.corner, { right: 22 * k, bottom: 44 * k }]}>
            <Text style={[styles.loading, { fontSize: 16 * k }]}>Loading</Text>
            <Animated.Image source={TRADE_IMAGES.daisytrade} style={{ width: 30 * k, height: 30 * k, transform: [{ rotate: rot }] }} resizeMode="contain" />
          </View>

          {/* the thin bar along the very bottom edge */}
          <View style={[styles.track, { height: Math.max(4, 5 * k) }]}>
            <Animated.View style={[styles.fill, { width: fillW }]} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3e0b6' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.42 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tip: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, color: '#4a2a10', fontWeight: 'bold', paddingHorizontal: 90 },
  corner: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8 },
  loading: { fontFamily: SERIF, fontWeight: 'bold', color: '#4a2a10' },
  track: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(138,90,42,0.25)' },
  fill: { height: '100%', backgroundColor: '#6a9a3a' },
});
