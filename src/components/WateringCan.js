import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { UI_IMAGES } from '../engine/assets';
import { useLayout } from '../context/LayoutContext';
import { projectSize } from '../engine/project';

// Can size authored against the 1376×768 base image — matches the reference art.
const BASE_CAN_SIZE = 200;

export default function WateringCan({ position, isWatering, onDragStart, onDragEnd }) {
  const { width: sw, height: sh } = useLayout();
  const size = Math.round(projectSize(BASE_CAN_SIZE, sw, sh));
  const half = size / 2;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const ox = useSharedValue(0);
  const oy = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onStart(() => {
      ox.value = tx.value;
      oy.value = ty.value;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      tx.value = ox.value + e.translationX;
      ty.value = oy.value + e.translationY;
    })
    .onEnd(() => {
      tx.value = withSpring(0);
      ty.value = withSpring(0);
      runOnJS(onDragEnd)();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const src = isWatering ? UI_IMAGES.wateringcan2 : UI_IMAGES.wateringcan1;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.container,
          { left: position.x - half, top: position.y - half, width: size, height: size },
          animStyle,
        ]}
      >
        <Image source={src} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
});
