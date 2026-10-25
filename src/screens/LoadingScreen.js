import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LOADING_BG, TRADE_IMAGES } from '../engine/assets';

// Shown after PLAY: the florist-stall scene (loadingshop.png, 1480×798) with its
// painted progress bar. The green fill, the % and the logo
// are drawn live. The game logo sits above the bar. Then on to the town map.
const DURATION = 3000;
const IMG_W = 1480;
const IMG_H = 798;
// painted bar track, in image px
const TRACK = { x0: 706, x1: 1328, y0: 540, y1: 570 };
const PCT_Y = 614, PCT_X = 1007;
const INK = '#4a2a10';
const TIPS = ['Tap a thirsty plant with the watering can.', 'Hearts keep your favourites at the top of the journal.', 'Pets bring home surprises from their adventures.', 'Customers love a bouquet tied with their favourite ribbon.', 'Shelf pots and hanging pots are sold at the nursery.'];
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

export default function LoadingScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pct, setPct] = useState(0);
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.timing(progress, {
      toValue: 1, duration: DURATION, easing: Easing.inOut(Easing.quad), useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setTimeout(() => navigation.replace('Map'), 300);
    });
    return () => progress.removeListener(id);
  }, []);

  // "cover" mapping of the image into the screen box
  const sc = box.w ? Math.max(box.w / IMG_W, box.h / IMG_H) : 1;
  const ox = (box.w - IMG_W * sc) / 2, oy = (box.h - IMG_H * sc) / 2;
  const X = (x) => ox + x * sc, Y = (y) => oy + y * sc;

  const trackW = (TRACK.x1 - TRACK.x0) * sc;
  const trackH = (TRACK.y1 - TRACK.y0) * sc;
  const fillW = progress.interpolate({ inputRange: [0, 1], outputRange: [0, trackW] });

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={LOADING_BG} style={styles.bg} resizeMode="cover" />

      {box.w > 0 && (
        <>
          {/* live green fill inside the painted track */}
          <Animated.View style={{
            position: 'absolute', left: X(TRACK.x0), top: Y(TRACK.y0), width: fillW, height: trackH,
            backgroundColor: '#7aa83a', borderRadius: 3 * sc, borderTopWidth: 3 * sc, borderTopColor: '#a6cd5e', borderBottomWidth: 3 * sc, borderBottomColor: '#5d8a28',
          }} />

          {/* a title plaque above the bar */}
          <View style={{ position: 'absolute', left: X(TRACK.x0), width: (TRACK.x1 - TRACK.x0) * sc, top: Y(TRACK.y0) - 112 * sc, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 * sc, backgroundColor: '#f3e0b6', borderWidth: Math.max(3, 5 * sc), borderColor: '#8a5a2a', borderRadius: 26 * sc, paddingHorizontal: 30 * sc, paddingVertical: 12 * sc }}>
              <Image source={TRADE_IMAGES.daisytrade} style={{ width: 54 * sc, height: 54 * sc }} resizeMode="contain" />
              <Text style={{ fontFamily: SERIF, fontWeight: 'bold', fontSize: Math.max(16, 52 * sc), color: INK }}>Opening the shop</Text>
              <Image source={TRADE_IMAGES.rosetrade} style={{ width: 54 * sc, height: 54 * sc }} resizeMode="contain" />
            </View>
          </View>

          {/* a tip under the bar */}
          <View style={{ position: 'absolute', left: X(TRACK.x0), width: (TRACK.x1 - TRACK.x0) * sc, top: Y(PCT_Y) + 38 * sc, alignItems: 'center' }}>
            <Text style={{ fontFamily: SERIF, fontSize: Math.max(11, 28 * sc), color: '#6a4524', textAlign: 'center' }}>{tip}</Text>
          </View>

          {/* the percentage, on a small cream plaque under the bar */}
          <View style={{ position: 'absolute', left: X(PCT_X) - 52 * sc, width: 104 * sc, top: Y(PCT_Y) - 20 * sc, alignItems: 'center', backgroundColor: '#f3e0b6', borderWidth: Math.max(2, 3 * sc), borderColor: '#8a5a2a', borderRadius: 16 * sc, paddingVertical: 3 * sc }}>
            <Text style={{ fontFamily: SERIF, fontWeight: 'bold', fontSize: Math.max(12, 24 * sc), color: INK }}>{pct}%</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1dcb0' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
});
