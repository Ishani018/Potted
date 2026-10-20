import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { PET_IMAGES } from '../engine/assets';
import { PixelText } from './Pixel';

// Pets that are drawn asleep: slow breathing + floating "Z", no hopping.
const SLEEPERS = { koazy: true, ebonyandivory: true };

// An animated pet. Breathes (squash/stretch anchored at its feet), and sleepers drift a little "Z". Each pet gets its own random phase so a
// room full of pets never moves in lockstep. Layout (position/size) is the
// caller's job — this fills a w×h box.
export default function PetSprite({ petKey, w, h, flip, children }) {
  const breath = useRef(new Animated.Value(0)).current;
  const zz = useRef(new Animated.Value(0)).current;
  const asleep = !!SLEEPERS[petKey];

  useEffect(() => {
    const phase = Math.random() * 1200;
    const dur = asleep ? 2600 : 1500;
    const breathLoop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const start = setTimeout(() => breathLoop.start(), phase);

    let zzLoop;
    if (asleep) {
      zzLoop = Animated.loop(Animated.timing(zz, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true }));
      setTimeout(() => zzLoop.start(), phase);
    }
    return () => {
      clearTimeout(start);
      breathLoop.stop(); zzLoop && zzLoop.stop();
    };
  }, [petKey]);

  const amp = asleep ? 0.03 : 0.035;
  const scaleY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + amp] });
  const scaleX = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1 - amp / 2] });
  // scaleY grows about the centre; shift so the feet stay planted.
  const plant = breath.interpolate({ inputRange: [0, 1], outputRange: [0, -(h * amp) / 2] });

  const zOpacity = zz.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const zRise = zz.interpolate({ inputRange: [0, 1], outputRange: [0, -h * 0.35] });

  return (
    <View style={{ width: w, height: h }}>
      <Animated.View style={{ width: w, height: h, transform: [{ translateY: plant }, { scaleY }, { scaleX }] }}>
        <Image
          source={PET_IMAGES[petKey]}
          style={{ width: w, height: h, transform: flip ? [{ scaleX: -1 }] : undefined }}
          resizeMode="contain"
        />
      </Animated.View>
      {asleep && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', right: w * 0.12, top: h * 0.1, opacity: zOpacity, transform: [{ translateY: zRise }] }}>
          <PixelText size={Math.max(8, w * 0.1)}>Z</PixelText>
        </Animated.View>
      )}
      {children}
    </View>
  );
}
