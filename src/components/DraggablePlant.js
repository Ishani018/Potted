import React, { useCallback } from 'react';
import { Image, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SEED_IMAGES, POTTED_PLANT_IMAGES, HANGING_PLANT_IMAGES } from '../engine/assets';
import { SNAP_RADIUS } from '../engine/snapPoints';

function getSeedImage(flowerKey) {
  return SEED_IMAGES[flowerKey] ?? POTTED_PLANT_IMAGES._seed;
}

export default function DraggablePlant({
  flowerKey,
  plantType,
  startX,
  startY,
  snapPoints,
  onSnap,
}) {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const startTx = useSharedValue(startX);
  const startTy = useSharedValue(startY);

  const trySnap = useCallback(
    (x, y) => {
      let best = null;
      let bestDist = SNAP_RADIUS + 1;
      for (const pt of snapPoints) {
        const dx = x - pt.x;
        const dy = y - pt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = pt;
        }
      }
      if (best) {
        onSnap(best.id, flowerKey);
        // spring back to origin after snap (item consumed)
        tx.value = withSpring(startX);
        ty.value = withSpring(startY);
      } else {
        tx.value = withSpring(startX);
        ty.value = withSpring(startY);
      }
    },
    [snapPoints, onSnap, flowerKey, startX, startY, tx, ty],
  );

  const drag = Gesture.Pan()
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = startTx.value + e.translationX;
      ty.value = startTy.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(trySnap)(tx.value, ty.value);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value - startX }, { translateY: ty.value - startY }],
  }));

  const imgSrc = getSeedImage(flowerKey);
  const size = plantType === 'hanging' ? 55 : 50;

  return (
    <GestureDetector gesture={drag}>
      <Animated.View style={[styles.container, animStyle, { left: startX - size / 2, top: startY - size / 2, width: size, height: size }]}>
        <Image source={imgSrc} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 300,
  },
});
