import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import { LOADING_BG } from '../engine/assets';
import { PixelText, COLORS } from '../components/Pixel';

// Shown after PLAY. The scene starts washed-out and fills with colour from left
// to right as it "loads", with a pixel progress bar; then on to the town map.
const DURATION = 3000;
const BAR_W = 300;

export default function LoadingScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.timing(progress, {
      toValue: 1, duration: DURATION, easing: Easing.inOut(Easing.quad), useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setTimeout(() => navigation.replace('Map'), 250);
    });
    return () => progress.removeListener(id);
  }, []);

  // Veil covers the not-yet-coloured part (right side), shrinking as we load.
  const veilLeft = progress.interpolate({ inputRange: [0, 1], outputRange: [0, box.w] });
  const barFill = progress.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_W - 8] });

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Image source={LOADING_BG} style={styles.bg} resizeMode="cover" />

      {/* Greyed-out veil over the part that hasn't filled in yet */}
      <Animated.View style={[styles.veil, { left: veilLeft }]} />
      {/* Bright leading edge of the colour wipe */}
      <Animated.View style={[styles.edge, { left: veilLeft }]} />

      <View style={styles.barWrap}>
        <View style={styles.bar}>
          <Animated.View style={[styles.fill, { width: barFill }]} />
        </View>
        <PixelText size={10} style={{ marginTop: 10 }}>{pct}%</PixelText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140c' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  veil: {
    position: 'absolute', top: 0, bottom: 0, right: 0,
    backgroundColor: 'rgba(58,52,44,0.82)',
    // On web, also strip the colour out so it reads as "not painted yet".
    backdropFilter: 'grayscale(1)',
  },
  edge: { position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: 'rgba(255,232,160,0.55)' },
  barWrap: { position: 'absolute', bottom: 26, alignSelf: 'center', alignItems: 'center' },
  bar: {
    width: BAR_W, height: 22, padding: 4,
    backgroundColor: COLORS.woodDark, borderWidth: 4, borderColor: COLORS.woodEdge, borderRadius: 4,
  },
  fill: { flex: 1, backgroundColor: COLORS.green, borderRadius: 1 },
});
