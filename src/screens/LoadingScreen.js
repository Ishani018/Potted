import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import { LOADING_BG, UI_IMAGES } from '../engine/assets';
import { PixelText } from '../components/Pixel';

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
const LOGO_W = 1068, LOGO_H = 350;   // logo.png size

export default function LoadingScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pct, setPct] = useState(0);

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

  // the game logo, centred above the bar
  const lw = 700 * sc, lh = lw * (LOGO_H / LOGO_W);

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

          {/* game logo above the bar */}
          <Image
            source={UI_IMAGES.logo}
            style={{ position: 'absolute', left: X((TRACK.x0 + TRACK.x1) / 2) - lw / 2, top: Y(TRACK.y0) - lh - 36 * sc, width: lw, height: lh }}
            resizeMode="contain"
          />

          <View style={{ position: 'absolute', left: X(PCT_X) - 60 * sc, width: 120 * sc, top: Y(PCT_Y) - 14 * sc, alignItems: 'center' }}>
            <PixelText size={Math.max(10, Math.round(26 * sc))} color={INK} style={{ textShadowColor: 'rgba(255,240,200,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 }}>{pct}%</PixelText>
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
