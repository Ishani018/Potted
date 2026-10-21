import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';
import { HERBALIST_IMAGES } from '../engine/assets';
import { HERBALIST } from '../constants/gameData';

// Doc Bristle. Uses assets/herbalist/docbristle.png (2:3, transparent) once it's
// registered in HERBALIST_IMAGES; until then a simple stand-in hedgehog is drawn
// so the shop works. `height` is the full height. Bobs gently while she waits.
export const HERBALIST_ASPECT = 2 / 3;

export default function HerbalistSprite({ height = 220, bob = true }) {
  const w = height * HERBALIST_ASPECT;
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!bob) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -height * 0.012, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob, height]);

  const img = HERBALIST_IMAGES.docbristle;
  const { body, face, accent } = HERBALIST.look;
  const H = height;

  return (
    <Animated.View style={{ width: w, height: H, transform: [{ translateY: y }] }}>
      {img ? (
        <Image source={img} style={{ width: w, height: H }} resizeMode="contain" />
      ) : (
        <View style={{ width: w, height: H, alignItems: 'center' }}>
          <View style={{ position: 'absolute', bottom: 0, width: w * 0.8, height: H * 0.05, borderRadius: H, backgroundColor: 'rgba(0,0,0,0.22)' }} />
          {/* quills: a fan of diamonds behind the body */}
          {[-60, -36, -12, 12, 36, 60].map((deg) => (
            <View key={deg} style={{ position: 'absolute', top: H * 0.2, width: H * 0.13, height: H * 0.13, backgroundColor: '#5a3f26', transform: [{ translateY: -H * 0.02 }, { rotate: `${deg + 45}deg` }, { translateX: 0 }, { translateY: -H * 0.17 }] }} />
          ))}
          {/* feet */}
          <View style={{ position: 'absolute', top: H * 0.86, width: H * 0.3, height: H * 0.1, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: H * 0.13, height: '100%', borderRadius: H, backgroundColor: '#5a3f26' }} />
            <View style={{ width: H * 0.13, height: '100%', borderRadius: H, backgroundColor: '#5a3f26' }} />
          </View>
          {/* body */}
          <View style={{ position: 'absolute', top: H * 0.3, width: H * 0.46, height: H * 0.58, borderRadius: H * 0.24, backgroundColor: body, borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)' }} />
          {/* belly */}
          <View style={{ position: 'absolute', top: H * 0.5, width: H * 0.26, height: H * 0.3, borderRadius: H * 0.13, backgroundColor: face }} />
          {/* satchel + strap */}
          <View style={{ position: 'absolute', top: H * 0.42, left: w * 0.5 - H * 0.02, width: H * 0.035, height: H * 0.34, backgroundColor: '#5a3f26', transform: [{ rotate: '-20deg' }] }} />
          <View style={{ position: 'absolute', top: H * 0.64, left: w * 0.5 + H * 0.1, width: H * 0.17, height: H * 0.15, borderRadius: 4, backgroundColor: accent, borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)' }} />
          {/* head */}
          <View style={{ position: 'absolute', top: H * 0.1, width: H * 0.34, height: H * 0.3, borderRadius: H * 0.17, backgroundColor: body, borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)' }} />
          <View style={{ position: 'absolute', top: H * 0.19, width: H * 0.24, height: H * 0.2, borderRadius: H * 0.12, backgroundColor: face }} />
          {/* spectacles, eyes, nose */}
          <View style={{ position: 'absolute', top: H * 0.22, width: H * 0.22, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: H * 0.085, height: H * 0.085, borderRadius: H, borderWidth: 2, borderColor: '#5a3410', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: H * 0.025, height: H * 0.025, borderRadius: H, backgroundColor: '#2a1608' }} />
            </View>
            <View style={{ width: H * 0.085, height: H * 0.085, borderRadius: H, borderWidth: 2, borderColor: '#5a3410', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: H * 0.025, height: H * 0.025, borderRadius: H, backgroundColor: '#2a1608' }} />
            </View>
          </View>
          <View style={{ position: 'absolute', top: H * 0.31, width: H * 0.045, height: H * 0.035, borderRadius: H, backgroundColor: '#2a1608' }} />
        </View>
      )}
    </Animated.View>
  );
}
