import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { PixelText } from './Pixel';

// Label over a pet — plain white outlined pixel text (like the map signs), shown
// only while hovering that pet. It fades in and bobs gently.
export default function PetTag({ label, show }) {
  const fade = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: show ? 1 : 0, duration: 160, useNativeDriver: true }).start();
  }, [show]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const y = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  return (
    <Animated.View pointerEvents="none" style={{ opacity: fade, transform: [{ translateY: y }] }}>
      <PixelText size={10}>{label}</PixelText>
    </Animated.View>
  );
}
