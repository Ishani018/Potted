import React, { useState, useCallback } from 'react';
import { Image } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

// Drag a hanging pot from its source (stool) onto a free hook. Ghost pots show
// at every free hook while dragging; snaps to the best hook (horizontal match
// matters most) and calls onPlace(point). Used by the Balcony and the Sunroom.
export default function DraggableHangingPot({ startX, startY, potW, potH, dragW, dragH, ghostW, ghostH, targets, onPlace, dragSource, ghostSource }) {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const ox = useSharedValue(startX);
  const oy = useSharedValue(startY);
  const [isDragging, setIsDragging] = useState(false);

  const trySnap = useCallback((x, y) => {
    // Hooks on a rod differ mainly in x (same y per rod), and the pot hangs below
    // the rod, so the drop y is always well under pt.y. Weight x distance heavily
    // and y loosely so we snap to the column you aimed at, not a wrong neighbour.
    const X_RANGE = 70;   // must be within this horizontal band of a hook
    const Y_RANGE = 260;  // generous vertical band (rod → bottom of hanging pot)
    let best = null, bestScore = Infinity;
    for (const pt of targets) {
      const dx = Math.abs(x - pt.x);
      const dy = Math.abs(y - pt.y);
      if (dx > X_RANGE || dy > Y_RANGE) continue;
      const score = dx * 3 + dy; // x dominates the choice
      if (score < bestScore) { bestScore = score; best = pt; }
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
    top: ty.value,
    width: potW,
    height: potH,
    zIndex: 600,
  }));

  return (
    <>
      {isDragging && targets.map((pt) => (
        <Image
          key={pt.id}
          source={ghostSource}
          style={{ position: 'absolute', left: pt.x - ghostW / 2, top: pt.y, width: ghostW, height: ghostH, opacity: 0.4, zIndex: 4 }}
          resizeMode="contain"
        />
      ))}
      <GestureDetector gesture={drag}>
        <ReAnimated.View style={animStyle}>
          {isDragging && (
            <Image
              source={dragSource}
              style={{ position: 'absolute', left: -(dragW - potW) / 2, top: 0, width: dragW, height: dragH }}
              resizeMode="contain"
            />
          )}
        </ReAnimated.View>
      </GestureDetector>
    </>
  );
}

// Pot types in this room — seeds of any other type can't be planted here.
const ROOM_TYPES = ['hanging'];
