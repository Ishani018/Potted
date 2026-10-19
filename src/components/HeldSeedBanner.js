import React, { useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { PixelText, COLORS } from './Pixel';

// "You're holding a seed" sign: wooden pixel plaque with the seed bag (bobbing),
// a short instruction, and the red X to put the seed back.
export default function HeldSeedBanner({ flowerKey, onCancel }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const y = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.sign}>
        <Animated.Image
          source={SEED_IMAGES[flowerKey]}
          style={[styles.seed, { transform: [{ translateY: y }] }]}
          resizeMode="contain"
        />
        <View>
          <PixelText size={10}>TAP AN EMPTY POT</PixelText>
          <PixelText size={8} color="#e8c890" style={{ marginTop: 6 }}>TO PLANT YOUR SEED</PixelText>
        </View>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.8}>
          <Image source={UI_IMAGES.cancelbutton} style={styles.x} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center', zIndex: 120 },
  sign: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.wood, borderWidth: 4, borderColor: COLORS.woodEdge, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  seed: { width: 40, height: 40 },
  x: { width: 30, height: 30 },
});
