import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet } from 'react-native';

// Purchase / sale notice: a cream card with an item icon, a bold title
// ("Bought Peony!"), a soft subtitle, and little blossoms + leaves on the edges.
//   const [notice, notify] = useNotice();
//   ... {notice} ...
//   notify({ icon: SEED_IMAGES.peony, title: 'Bought Peony!', subtitle: 'Grows in a shelf pot.' });
const INK = '#5a3410';
const INK_SOFT = '#8a6a40';

function Blossom({ size = 18, style }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#fffdf4', borderWidth: 1.5, borderColor: '#e3dcc4', alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ width: size * 0.38, height: size * 0.38, borderRadius: size, backgroundColor: '#f2b73c' }} />
    </View>
  );
}
function Leaf({ rot = '0deg', size = 16, color = '#6aa04a', style }) {
  return <View style={[{ width: size, height: size * 0.5, borderRadius: size, backgroundColor: color, transform: [{ rotate: rot }] }, style]} />;
}

export function NoticeCard({ icon, title, subtitle }) {
  return (
    <View style={s.card}>
      {/* edge decorations */}
      <Blossom size={22} style={{ position: 'absolute', left: -12, top: 18 }} />
      <Blossom size={16} style={{ position: 'absolute', left: -4, bottom: -6 }} />
      <Leaf rot="-35deg" style={{ position: 'absolute', left: 4, top: -4 }} />
      <Blossom size={20} style={{ position: 'absolute', right: -10, bottom: 6 }} />
      <Blossom size={15} style={{ position: 'absolute', right: -4, top: -4 }} />
      <Leaf rot="35deg" size={18} style={{ position: 'absolute', right: 6, bottom: -5 }} />
      <Leaf rot="-20deg" size={14} color="#86b862" style={{ position: 'absolute', right: 24, top: -4 }} />

      <View style={s.iconPlate}>
        {icon ? <Image source={icon} style={s.icon} resizeMode="contain" /> : null}
        <Text style={[s.spark, { left: 4, top: 2 }]}>✦</Text>
        <Text style={[s.spark, { right: 6, top: -2, fontSize: 11 }]}>✦</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.sub} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

// Slides up from the bottom, holds, fades out.
export function useNotice(duration = 2600) {
  const [data, setData] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const notify = useCallback((n) => {
    if (timer.current) clearTimeout(timer.current);
    setData(n);
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => setData(null));
    }, duration);
  }, [duration]);
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const el = data ? (
    <Animated.View
      pointerEvents="none"
      style={[s.wrap, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}
    >
      <NoticeCard {...data} />
    </Animated.View>
  ) : null;
  return [el, notify];
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 34, alignItems: 'center', zIndex: 400 },
  card: {
    width: 380, maxWidth: '88%', flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fbefd2', borderWidth: 3, borderColor: '#d3b27a', borderRadius: 16,
    paddingVertical: 12, paddingLeft: 14, paddingRight: 22,
  },
  iconPlate: {
    width: 70, height: 70, borderRadius: 14, backgroundColor: '#f7e0b0', borderWidth: 2, borderColor: '#e3c488',
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { width: 56, height: 56 },
  spark: { position: 'absolute', color: '#f2b73c', fontSize: 13 },
  title: { color: INK, fontSize: 20, fontWeight: '700', fontFamily: 'Georgia, "Times New Roman", serif' },
  sub: { color: INK_SOFT, fontSize: 14, marginTop: 4, fontFamily: 'Georgia, "Times New Roman", serif' },
});
