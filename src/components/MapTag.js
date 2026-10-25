import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity } from 'react-native';
import { Platform } from 'react-native';
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

// Map location sign: chunky pixel lettering (cream fill, dark outline, bottom
// shade) with a white pointer arrow under it that bobs gently. Drawn in code so
// it stays crisp at any size. `u` = one base-pixel in screen px (sw / 1376).
const OUT = '#8a5a2a';
const FILL = '#f3e0b6';
const SHADE = '#c9a468';

export default function MapTag({ label, u, delay = 0 }) {
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

  // Arrow: outline triangle, cream triangle inside, lighter highlight on top.
  const aw = 22 * u, ah = 22 * u;
  const tri = (w, h, color, extra) => ({
    width: 0, height: 0, borderLeftWidth: w, borderRightWidth: w, borderTopWidth: h,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color, ...extra,
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        backgroundColor: '#f3e0b6', borderColor: '#8a5a2a', borderWidth: Math.max(2, 3 * u), borderRadius: 12 * u,
        paddingHorizontal: 14 * u, paddingVertical: 4 * u, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 6 * u, shadowOffset: { width: 0, height: 3 * u },
      }}>
        <Text style={{ fontFamily: SERIF, fontWeight: 'bold', fontSize: Math.max(10, Math.round(26 * u)), color: '#4a2a10', letterSpacing: 0.5 }}>{label}</Text>
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
