import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity } from 'react-native';
import { PIXEL_FONT } from './Pixel';

// Map location sign: chunky pixel lettering (cream fill, dark outline, bottom
// shade) with a white pointer arrow under it that bobs gently. Drawn in code so
// it stays crisp at any size. `u` = one base-pixel in screen px (sw / 1376).
const OUT = '#14100a';
const FILL = '#f4ecd8';
const SHADE = '#a99d82';
const OFFS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

export default function MapTag({ label, u, delay = 0 }) {
  const size = Math.max(9, Math.round(28 * u));
  const o = Math.max(1.5, 3 * u);        // outline thickness
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    const t = setTimeout(() => {
      loop = Animated.loop(Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
      loop.start();
    }, delay);
    return () => { clearTimeout(t); loop && loop.stop(); };
  }, []);
  const y = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4 * u] });

  const text = (color, dx, dy, key) => (
    <Text
      key={key}
      style={{ position: 'absolute', left: dx, top: dy, fontFamily: PIXEL_FONT, fontSize: size, color, letterSpacing: 0 }}
    >
      {label}
    </Text>
  );

  // Arrow: outline triangle, cream triangle inside, lighter highlight on top.
  const aw = 22 * u, ah = 22 * u;
  const tri = (w, h, color, extra) => ({
    width: 0, height: 0, borderLeftWidth: w, borderRightWidth: w, borderTopWidth: h,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color, ...extra,
  });

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Text block: invisible sizer + layers */}
      <View>
        <Text style={{ fontFamily: PIXEL_FONT, fontSize: size, opacity: 0 }}>{label}</Text>
        {OFFS.map(([ox, oy], i) => text(OUT, ox * o, oy * o, `o${i}`))}
        {text(SHADE, 0, Math.max(1, 2 * u), 'sh')}
        {text(FILL, 0, 0, 'fill')}
      </View>
      <Animated.View style={{ marginTop: 4 * u, alignItems: 'center', transform: [{ translateY: y }] }}>
        <View style={tri(aw, ah, OUT)} />
        <View style={{ position: 'absolute', top: o * 0.8 }}>
          <View style={tri(aw - o * 1.1, ah - o * 1.4, SHADE)} />
        </View>
        <View style={{ position: 'absolute', top: o * 0.8 }}>
          <View style={tri(aw - o * 1.1, ah - o * 2.2, FILL)} />
        </View>
      </Animated.View>
    </View>
  );
}

// Tappable MapTag placed by its centre in 1376×768 base coords. `box` is the
// measured screen size { w, h }.
export function MapTagButton({ label, x, y, box, onPress, z = 10, delay = 0 }) {
  if (!box.w || !box.h) return null;
  const u = box.w / 1376;
  const bw = (label.length * 28 + 40) * u, bh = 90 * u;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        position: 'absolute', left: x * u - bw / 2, top: (y / 768) * box.h - bh / 2,
        width: bw, height: bh, alignItems: 'center', justifyContent: 'center', zIndex: z,
      }}
    >
      <MapTag label={label} u={u} delay={delay} />
    </TouchableOpacity>
  );
}
