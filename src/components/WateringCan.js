import React, { useRef } from 'react';
import { Image, StyleSheet, View, Animated as RNAnimated, Easing } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { CAN_IMAGES, UI_IMAGES } from '../engine/assets';
import { CAN_INFO } from '../constants/gameData';
import { useGame } from '../context/GameContext';
import { useLayout } from '../context/LayoutContext';
import { projectSize } from '../engine/project';

// ── Watering can size ────────────────────────────────────────────────────────
// BASE_CAN_SIZE: default size in base coords (1376×768). Used for all rooms
// unless overridden by the baseCanSize prop.
// Room 2 can override this by passing baseCanSize={150} (for example).
const BASE_CAN_SIZE = 135;  // ← CHANGE THIS to resize can globally
// ────────────────────────────────────────────────────────────────────────────
const WATER_RADIUS = 100;

// Water falling from the spout while the can is tipped. (x, y) = the spout's centre inside the can's box.
function Droplets({ x, y, fall, size }) {
  const drops = useRef([0, 1, 2, 3, 4, 5].map(() => new RNAnimated.Value(0))).current;
  React.useEffect(() => {
    const loops = drops.map((v, i) => {
      const l = RNAnimated.loop(RNAnimated.sequence([
        RNAnimated.delay(i * 110),
        RNAnimated.timing(v, { toValue: 1, duration: 650, easing: Easing.in(Easing.quad), useNativeDriver: false }),
        RNAnimated.timing(v, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]));
      l.start();
      return l;
    });
    return () => loops.forEach((l) => l.stop());
  }, [drops]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: 1, height: 1 }}>
      {drops.map((v, i) => (
        <RNAnimated.Image key={i} source={UI_IMAGES.waterdrop} resizeMode="contain" style={{
          position: 'absolute', left: -size * 1.5 + (i % 3 - 1) * size * 3.2, top: 0, width: size * 3, height: size * 3.5,
          opacity: v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, fall + (i % 2) * fall * 0.15] }) }],
        }} />
      ))}
    </View>
  );
}

export default function WateringCan({ position, plantedSnapPoints = [], onWater, onDragStart, onDragEnd, baseCanSize }) {
  const { width: sw, height: sh } = useLayout();
  const { state } = useGame();
  const canKey = CAN_IMAGES[state.player.can] ? state.player.can : 'blue';
  const HOLD_MS = CAN_INFO[canKey].holdMs;   // the red can pours twice as fast
  const size = Math.round(projectSize(baseCanSize ?? BASE_CAN_SIZE, sw, sh));
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
  const src = isDragging ? CAN_IMAGES[canKey].tilt.src : CAN_IMAGES[canKey].up.src;

  const gestureWithState = Gesture.Pan()
    .onStart(() => {
      ox.value = tx.value; oy.value = ty.value;
      runOnJS(setIsDragging)(true);
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      tx.value = ox.value + e.translationX;
      ty.value = oy.value + e.translationY;
      // Spout is bottom-left of the can image: x - 35%, y + 30% of half
      const absX = position.x + tx.value - half * 0.7;
      const absY = position.y + ty.value + half * 0.3;
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
        {isDragging && <Droplets x={size * 0.5 - size * 0.463 + size * 0.25} y={size * 0.5} fall={size * 0.85} size={Math.max(6, size * 0.075)} />}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', zIndex: 10 },
});
