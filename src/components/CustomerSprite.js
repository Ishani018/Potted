import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';
import { CUSTOMER_IMAGES } from '../engine/assets';
import { CUSTOMERS } from '../constants/gameData';

// A florist customer. Uses the real sprite from CUSTOMER_IMAGES when one is
// registered, otherwise a simple stand-in person drawn from the customer's
// palette (so the shop works before the art exists). `height` is the full height;
// the sprite is 2:3 (w:h). Bobs gently like it's waiting at the counter.
export const SPRITE_ASPECT = 2 / 3;

export default function CustomerSprite({ customerKey, height = 200, bob = true, happy = false }) {
  const c = CUSTOMERS[customerKey];
  const w = height * SPRITE_ASPECT;
  const y = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;   // happy bounce

  useEffect(() => {
    if (!bob) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -height * 0.012, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, height]);

  // Happy: two quick hops with a little squash on landing.
  useEffect(() => {
    if (!happy) { hop.setValue(0); return undefined; }
    const up = (to) => Animated.timing(hop, { toValue: to, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true });
    const anim = Animated.sequence([
      up(-height * 0.07), up(0), Animated.delay(40), up(-height * 0.07), up(0),
    ]);
    anim.start();
    return () => anim.stop();
  }, [happy, height]);

  const img = CUSTOMER_IMAGES[customerKey];
  const look = c?.look ?? { skin: '#f1c9a0', hair: '#4a3020', outfit: '#6a8aa8' };
  const head = height * 0.26;

  return (
    <Animated.View style={{ width: w, height, transform: [{ translateY: Animated.add(y, hop) }] }}>
      {img ? (
        <Image source={img} style={{ width: w, height }} resizeMode="contain" />
      ) : (
        <View style={{ width: w, height, alignItems: 'center' }}>
          {/* soft ground shadow */}
          <View style={{ position: 'absolute', bottom: 0, width: w * 0.8, height: height * 0.05, borderRadius: height, backgroundColor: 'rgba(0,0,0,0.22)' }} />
          {/* legs */}
          <View style={{ position: 'absolute', top: height * 0.7, width: height * 0.26, height: height * 0.28, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: height * 0.11, height: '100%', backgroundColor: '#3a2a20', borderRadius: 3 }} />
            <View style={{ width: height * 0.11, height: '100%', backgroundColor: '#3a2a20', borderRadius: 3 }} />
          </View>
          {/* arms */}
          <View style={{ position: 'absolute', top: height * 0.34, left: w * 0.5 - height * 0.26, width: height * 0.07, height: height * 0.27, backgroundColor: look.outfit, borderRadius: 4 }} />
          <View style={{ position: 'absolute', top: height * 0.34, left: w * 0.5 + height * 0.19, width: height * 0.07, height: height * 0.27, backgroundColor: look.outfit, borderRadius: 4 }} />
          {/* body */}
          <View style={{ position: 'absolute', top: height * 0.31, width: height * 0.36, height: height * 0.4, backgroundColor: look.outfit, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(0,0,0,0.25)' }} />
          {/* head */}
          <View style={{ position: 'absolute', top: height * 0.06, width: head, height: head, borderRadius: head / 2, backgroundColor: look.skin, borderWidth: 2, borderColor: 'rgba(0,0,0,0.25)' }} />
          {/* hair */}
          <View style={{ position: 'absolute', top: height * 0.045, width: head * 1.08, height: head * 0.55, backgroundColor: look.hair, borderTopLeftRadius: head, borderTopRightRadius: head }} />
          {/* eyes + smile */}
          <View style={{ position: 'absolute', top: height * 0.16, width: head * 0.5, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: head * 0.1, height: head * 0.14, backgroundColor: '#2a1608', borderRadius: 2 }} />
            <View style={{ width: head * 0.1, height: head * 0.14, backgroundColor: '#2a1608', borderRadius: 2 }} />
          </View>
          <View style={{ position: 'absolute', top: height * 0.225, width: head * 0.3, height: head * 0.1, borderBottomLeftRadius: head, borderBottomRightRadius: head, borderBottomWidth: 2, borderColor: '#7a3a2a' }} />
        </View>
      )}
    </Animated.View>
  );
}
