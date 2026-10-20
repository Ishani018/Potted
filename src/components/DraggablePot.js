import React, { useState, useCallback } from 'react';
import { Image } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { POTTED_PLANT_IMAGES } from '../engine/assets';

// Drag an empty shelf pot from its source spot onto a free snap point. Shows
// ghost pots at every free spot while dragging; snaps to the nearest within
// SNAP_R and calls onPlace(point). Used by the Greenhouse and the Sunroom.
export default function DraggablePot({ startX, startY, potW, potH, targets, onPlace, source, dragSource, ghostSource }) {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const ox = useSharedValue(startX);
  const oy = useSharedValue(startY);
  const [isDragging, setIsDragging] = useState(false);

  const trySnap = useCallback((x, y) => {
    const SNAP_R = 60;
    let best = null, bestDist = SNAP_R + 1;
    for (const pt of targets) {
      const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
      if (dist < bestDist) { bestDist = dist; best = pt; }
    }
    if (best) onPlace(best);
    tx.value = startX;
    ty.value = startY;
    setIsDragging(false);
  }, [targets, onPlace, startX, startY]);

  const drag = Gesture.Pan()
    .onStart(() => { ox.value = tx.value; oy.value = ty.value; runOnJS(setIsDragging)(true); })
    .onUpdate((e) => { tx.value = ox.value + e.translationX; ty.value = oy.value + e.translationY; })
    .onEnd(() => { runOnJS(trySnap)(tx.value, ty.value); });

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: tx.value - potW / 2,
    top: ty.value - potH,
    width: potW,
    height: potH,
    zIndex: 600,
  }));

  return (
    <>
      {isDragging && targets.map((pt) => {
        const gSrc = ghostSource ?? POTTED_PLANT_IMAGES._seed;
        const gH = Math.round(potW * (344 / 347));
        return (
          <Image
            key={pt.id}
            source={gSrc}
            style={{ position: 'absolute', left: pt.x - potW / 2, top: pt.y - gH, width: potW, height: gH, opacity: 0.4, zIndex: 4 }}
            resizeMode="contain"
          />
        );
      })}
      <GestureDetector gesture={drag}>
        <ReAnimated.View style={animStyle}>
          {isDragging && (
            <Image
              source={dragSource ?? source ?? POTTED_PLANT_IMAGES._seed}
              style={{ width: potW, height: potH }}
              resizeMode="contain"
            />
          )}
        </ReAnimated.View>
      </GestureDetector>
    </>
  );
}

// Pot types in this room — seeds of any other type can't be planted here.
const ROOM_TYPES = ['potted'];
