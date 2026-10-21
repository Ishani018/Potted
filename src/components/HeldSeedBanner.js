import React, { useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { useLayout } from '../context/LayoutContext';
import { PixelText } from './Pixel';

// "You're holding a seed" note: the painted planting banner (vine-wrapped wood
// frame, red X on the right) with the held seed bag on the left and the hint text
// in the middle. Tap the red X to put the seed back.
const ASPECT = 1086 / 362;
const INK = '#5a2a10';

export default function HeldSeedBanner({ flowerKey, hint, onCancel, icon }) {
  const { width: sw } = useLayout();
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const y = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  // Trim the "tap to cancel" tail (the red X does that).
  const text = (hint ?? 'Tap an empty pot to plant').replace(/\s*·\s*tap( here)? to cancel/i, '').toUpperCase();
  const W = Math.min(sw * 0.74, 700);
  const H = W / ASPECT;
  const fs = Math.max(7, Math.round(W * (text.length > 34 ? 0.0148 : 0.0185)));

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={{ width: W, height: H }}>
        <Image source={UI_IMAGES.plantBanner} style={{ width: W, height: H }} resizeMode="stretch" />

        {icon ? (
          // a custom icon (e.g. a remedy) instead of the seed bag
          <Animated.View style={{ position: 'absolute', left: W * 0.105, top: H * 0.3, width: W * 0.1, height: H * 0.44, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: y }] }}>
            {icon(Math.min(W * 0.1, H * 0.44))}
          </Animated.View>
        ) : (
          <Animated.Image
            source={SEED_IMAGES[flowerKey]}
            style={{ position: 'absolute', left: W * 0.105, top: H * 0.3, width: W * 0.1, height: H * 0.44, transform: [{ translateY: y }] }}
            resizeMode="contain"
          />
        )}

        <View style={{ position: 'absolute', left: W * 0.25, width: W * 0.55, top: H * 0.3, height: H * 0.44, justifyContent: 'center' }}>
          <PixelText size={fs} color={INK} style={{ textAlign: 'center', lineHeight: fs * 1.5, textShadowColor: 'transparent' }}>{text}</PixelText>
        </View>

        {/* the baked red X */}
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.7}
          style={{ position: 'absolute', left: W * 0.845, top: H * 0.34, width: W * 0.085, height: H * 0.34 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 6, left: 0, right: 0, alignItems: 'center', zIndex: 120 },
});
