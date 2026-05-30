import React, { useRef } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { UI_IMAGES } from '../engine/assets';
import { useLayout } from '../context/LayoutContext';
import { projectSize } from '../engine/project';

const BASE_CAN_SIZE = 200;
const WATER_RADIUS = 60;  // px — how close to pot center to trigger watering
const HOLD_MS = 2000;     // hold duration before watering fires

export default function WateringCan({ position, plantedSnapPoints = [], onWater, onDragStart, onDragEnd }) {
  const { width: sw, height: sh } = useLayout();
  const size = Math.round(projectSize(BASE_CAN_SIZE, sw, sh));
  const half = size / 2;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const ox = useSharedValue(0);
  const oy = useSharedValue(0);
  const isOver = useSharedValue(0); // 1 when hovering over a planted pot

  const holdTimer = useRef(null);
  const currentSlotId = useRef(null);

  const clearHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  };

  const checkHover = (screenX, screenY) => {
    // screenX/Y are the left edge (spout) of the tilted can
    let found = null;
    for (const pt of plantedSnapPoints) {
      const dist = Math.sqrt((screenX - pt.x) ** 2 + (screenY - pt.y) ** 2);
      if (dist < WATER_RADIUS) { found = pt; break; }
    }

    if (found) {
      if (currentSlotId.current !== found.id) {
        clearHold();
        currentSlotId.current = found.id;
        holdTimer.current = setTimeout(() => {
          onWater(found.id);
          currentSlotId.current = null;
        }, HOLD_MS);
      }
    } else {
      if (currentSlotId.current) { clearHold(); currentSlotId.current = null; }
    }
  };

  const handleEnd = () => {
    clearHold();
    currentSlotId.current = null;
    tx.value = withSpring(0);
    ty.value = withSpring(0);
  };

  const gesture = Gesture.Pan()
    .onStart(() => { ox.value = tx.value; oy.value = ty.value; })
    .onUpdate((e) => {
      tx.value = ox.value + e.translationX;
      ty.value = oy.value + e.translationY;
      // Absolute screen position of can spout (left edge)
      const absX = position.x + tx.value - half;
      const absY = position.y + ty.value;
      runOnJS(checkHover)(absX, absY);
    })
    .onEnd(() => { runOnJS(handleEnd)(); });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  // Show wateringcan2 while dragging (can tilted)
  const [isDragging, setIsDragging] = React.useState(false);
  const src = isDragging ? UI_IMAGES.wateringcan2 : UI_IMAGES.wateringcan1;

  const gestureWithState = Gesture.Pan()
    .onStart(() => {
      ox.value = tx.value; oy.value = ty.value;
      runOnJS(setIsDragging)(true);
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      tx.value = ox.value + e.translationX;
      ty.value = oy.value + e.translationY;
      const absX = position.x + tx.value - half;
      const absY = position.y + ty.value;
      runOnJS(checkHover)(absX, absY);
    })
    .onEnd(() => {
      runOnJS(setIsDragging)(false);
      if (onDragEnd) runOnJS(onDragEnd)();
      runOnJS(handleEnd)();
    });

  return (
    <GestureDetector gesture={gestureWithState}>
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
  container: { position: 'absolute', zIndex: 10 },
});
