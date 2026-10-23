import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet, Platform } from 'react-native';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });

// Purchase / sale notice: a cream card with an item icon, a bold title
// ("Bought Peony!"), a soft subtitle, and little blossoms + leaves on the edges.
//   const [notice, notify] = useNotice();
//   ... {notice} ...
//   notify({ icon: SEED_IMAGES.peony, title: 'Bought Peony!', subtitle: 'Grows in a shelf pot.' });
const INK = '#5a3410';
const INK_SOFT = '#8a6a40';

export function NoticeCard({ icon, title, subtitle }) {
  return (
    <View style={s.card}>
      {icon ? (
        <View style={s.iconPlate}>
          <Image source={icon} style={s.icon} resizeMode="contain" />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.sub} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

// Slides up from the bottom, holds, fades out.
export function useNotice(duration = 2600, bottom = 34) {
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
      style={[s.wrap, { bottom, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}
    >
      <NoticeCard {...data} />
    </Animated.View>
  ) : null;
  return [el, notify];
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 34, alignItems: 'center', zIndex: 400 },
  card: {
    width: 380, maxWidth: '88%', flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 16,
    paddingVertical: 10, paddingLeft: 12, paddingRight: 18,
  },
  iconPlate: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: '#e8cf9a', borderWidth: 2, borderColor: '#b98a4e',
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { width: 48, height: 48 },
  title: { color: INK, fontSize: 20, fontWeight: '700', fontFamily: SERIF },
  sub: { color: INK_SOFT, fontSize: 14, marginTop: 2, fontFamily: SERIF },
});
