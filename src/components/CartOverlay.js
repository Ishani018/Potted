import React, { useCallback, useEffect } from 'react';
import { Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { SEED_IMAGES, POTTED_PLANT_IMAGES, UI_IMAGES } from '../engine/assets';
import { isInCartZone, getCartBedSlots, getSillPoints } from '../engine/snapPoints';
import { projectSize, projectPoint } from '../engine/project';
import { BASE_SEED_SIZE, BASE_CART_W, BASE_CART_H, BASE_STILL_CART_W, BASE_STILL_CART_H } from '../constants/nurseryData';
const SNAP_RADIUS = 60;

// Size the bag using the same cover-scale the background uses, so bags match
// the painted shelves at any container size.
function getSeedSize(sw, sh) { return Math.round(projectSize(BASE_SEED_SIZE, sw, sh)); }
function getSeedImage(flowerKey) { return SEED_IMAGES[flowerKey] ?? POTTED_PLANT_IMAGES._seed; }

// ─── Draggable seed in nursery — drag from shelf, drop anywhere on the cart ──
function DraggableSeed({ item, onDropOnCart, startX, startY, size }) {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const ox = useSharedValue(startX);
  const oy = useSharedValue(startY);

  const handleDrop = useCallback((x, y) => {
    onDropOnCart(item, x, y);
    // Always spring the shelf bag back to its shelf (the shelf bag is the
    // permanent "stock" copy; dropping just adds a separate item to the cart).
    tx.value = withSpring(startX);
    ty.value = withSpring(startY);
  }, [onDropOnCart, item, startX, startY, tx, ty]);

  const drag = Gesture.Pan()
    .onStart(() => { ox.value = tx.value; oy.value = ty.value; })
    .onUpdate((e) => { tx.value = ox.value + e.translationX; ty.value = oy.value + e.translationY; })
    .onEnd(() => { runOnJS(handleDrop)(tx.value, ty.value); });

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: tx.value - size / 2,
    top: ty.value - size / 2,
    width: size,
    height: size,
    zIndex: 400,
  }));

  return (
    <GestureDetector gesture={drag}>
      <Animated.View style={animStyle}>
        <Image source={getSeedImage(item.flowerKey)} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Draggable seed in room — drags from cart onto plant snap points or sill ───
function RoomSeed({ item, snapPoints, sillPoints, onSnap, onStoreSill, startX, startY, size }) {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const ox = useSharedValue(startX);
  const oy = useSharedValue(startY);

  const trySnap = useCallback((x, y) => {
    let best = null, bestDist = SNAP_RADIUS + 1;
    // Check sill first (priority — it's higher on screen)
    for (const pt of sillPoints) {
      const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
      if (dist < bestDist) { bestDist = dist; best = { pt, isSill: true }; }
    }
    for (const pt of snapPoints) {
      const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
      if (dist < bestDist) { bestDist = dist; best = { pt, isSill: false }; }
    }
    if (best) {
      if (best.isSill) onStoreSill(item);
      else onSnap(best.pt.id, item);
    }
    tx.value = withSpring(startX);
    ty.value = withSpring(startY);
  }, [snapPoints, sillPoints, onSnap, onStoreSill, item, startX, startY, tx, ty]);

  const drag = Gesture.Pan()
    .onStart(() => { ox.value = tx.value; oy.value = ty.value; })
    .onUpdate((e) => { tx.value = ox.value + e.translationX; ty.value = oy.value + e.translationY; })
    .onEnd(() => { runOnJS(trySnap)(tx.value, ty.value); });

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: tx.value - size / 2,
    top: ty.value - size / 2,
    width: size,
    height: size,
    zIndex: 500,
  }));

  return (
    <GestureDetector gesture={drag}>
      <Animated.View style={animStyle}>
        <Image source={getSeedImage(item.flowerKey)} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Draggable seed on window sill — shows bag at rest, seed.png while dragging ─
export function SillSeed({ item, snapPoints, startX, startY, size }) {
  const { dispatch } = useGame();
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const ox = useSharedValue(startX);
  const oy = useSharedValue(startY);
  const dragging = useSharedValue(0); // 0 = at rest (bag), 1 = dragging (seed)

  const trySnap = useCallback((x, y) => {
    let best = null, bestDist = SNAP_RADIUS + 1;
    for (const pt of snapPoints) {
      const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
      if (dist < bestDist) { bestDist = dist; best = pt; }
    }
    if (best) {
      dispatch({ type: 'PLANT_FROM_SILL', slotId: best.id, sillItemId: item.id, flowerKey: item.flowerKey });
    }
    tx.value = withSpring(startX);
    ty.value = withSpring(startY);
  }, [snapPoints, dispatch, item, startX, startY, tx, ty]);

  const drag = Gesture.Pan()
    .onStart(() => {
      ox.value = tx.value; oy.value = ty.value;
      dragging.value = 1;
    })
    .onUpdate((e) => { tx.value = ox.value + e.translationX; ty.value = oy.value + e.translationY; })
    .onEnd(() => { dragging.value = 0; runOnJS(trySnap)(tx.value, ty.value); });

  const containerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: tx.value - size / 2,
    top: ty.value - size / 2,
    width: size,
    height: size,
    zIndex: 500,
  }));

  // Bag image fades out while dragging
  const bagStyle = useAnimatedStyle(() => ({ opacity: dragging.value === 0 ? 1 : 0 }));
  const seedStyle = useAnimatedStyle(() => ({ opacity: dragging.value === 1 ? 1 : 0 }));

  // Seed sprite is much smaller than the bag — centered within the same container
  const seedSize = Math.round(size * 0.28);
  const seedOffset = Math.round((size - seedSize) / 2);

  return (
    <GestureDetector gesture={drag}>
      <Animated.View style={containerStyle}>
        <Animated.Image
          source={getSeedImage(item.flowerKey)}
          style={[{ position: 'absolute', width: size, height: size }, bagStyle]}
          resizeMode="contain"
        />
        <Animated.Image
          source={UI_IMAGES.seed}
          style={[{ position: 'absolute', left: seedOffset, top: seedOffset, width: seedSize, height: seedSize }, seedStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Nursery scene: draggable shelf seeds + placed cart seeds ─────────────────
export function NurseryCartScene({ shelfItems }) {
  const { state, dispatch } = useGame();
  const { width: sw, height: sh } = useLayout();
  const cart = state.cart;
  const size = getSeedSize(sw, sh);
  const bedSlots = getCartBedSlots(sw, sh);

  // Drop anywhere on the cart zone — bag snaps to next free grid slot
  const handleDropOnCart = useCallback((item, screenX, screenY) => {
    if (!isInCartZone(screenX, screenY, sw, sh)) return false;
    if (cart.length >= 8) return false;
    dispatch({ type: 'ADD_TO_CART', flowerKey: item.flowerKey });
    return true;
  }, [dispatch, sw, sh, cart.length]);

  return (
    <>
      {/* Seeds on cart — snapped to grid slots within the bed */}
      {cart.map((item, i) => {
        const slot = bedSlots[i];
        if (!slot) return null;
        return (
          <TouchableOpacity
            key={item.id}
            style={{ position: 'absolute', left: slot.x - size / 2, top: slot.y - size / 2, zIndex: 50 }}
            onPress={() => dispatch({ type: 'REMOVE_FROM_CART', id: item.id })}
            activeOpacity={0.7}
          >
            <Image source={getSeedImage(item.flowerKey)} style={{ width: size, height: size }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}

      {/* Draggable shelf seeds (permanent stock) */}
      {shelfItems.map((item) => (
        <DraggableSeed
          key={item.id}
          item={item}
          onDropOnCart={handleDropOnCart}
          startX={item.shelfX}
          startY={item.shelfY}
          size={size}
        />
      ))}
    </>
  );
}

// ─── Room cart: still cart PNG bottom-right, seeds draggable onto snap points ──
export function RoomCart({ snapPoints, onDismiss }) {
  const { state, dispatch } = useGame();
  const { width: sw, height: sh } = useLayout();
  const cart = state.cart;
  const size = getSeedSize(sw, sh);
  const sillPoints = getSillPoints(sw, sh);

  const cartW = Math.round(projectSize(BASE_STILL_CART_W, sw, sh));
  const cartH = Math.round(projectSize(BASE_STILL_CART_H, sw, sh));

  const cartLeft = sw - cartW;
  const cartTop  = sh - cartH;

  // Slide-out offset — animates to cartW+20 (off right edge) when cart empties
  const slideX = useSharedValue(0);
  const cartStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: cartLeft,
    top: cartTop,
    width: cartW,
    height: cartH,
    zIndex: 80,
    transform: [{ translateX: slideX.value }],
  }));

  const bedSlots = getCartBedSlots(sw, sh);

  const handleSnap = useCallback((slotId, item) => {
    dispatch({ type: 'PLANT_FROM_CART', slotId, cartItemId: item.id, flowerKey: item.flowerKey });
  }, [dispatch]);

  const handleStoreSill = useCallback((item) => {
    dispatch({ type: 'STORE_ON_SILL', cartItemId: item.id, flowerKey: item.flowerKey });
  }, [dispatch]);

  // Slide cart off to the right then hide when all bags are gone
  useEffect(() => {
    if (cart.length === 0) {
      slideX.value = withTiming(cartW + 20, { duration: 600 }, () => {
        runOnJS(dispatch)({ type: 'SET_CART_IN_ROOM', value: false });
      });
    }
  }, [cart.length]);

  return (
    <>
      {/* Still cart image — animated slide out */}
      <Animated.Image
        source={UI_IMAGES.stillcart}
        style={cartStyle}
        resizeMode="contain"
      />

      {/* Seeds on the cart bed — draggable to plant snap points or window sill */}
      {cart.map((item, i) => {
        const slot = bedSlots[i];
        if (!slot) return null;
        return (
          <RoomSeed
            key={item.id}
            item={item}
            snapPoints={snapPoints}
            sillPoints={sillPoints}
            onSnap={handleSnap}
            onStoreSill={handleStoreSill}
            startX={slot.x}
            startY={slot.y}
            size={size}
          />
        );
      })}

      {/* Dismiss button */}
      <TouchableOpacity
        style={[styles.dismissBtn, { position: 'absolute', right: 14, bottom: 14, zIndex: 90 }]}
        onPress={onDismiss}
      >
        <Text style={styles.dismissBtnText}>
          {cart.length > 0 ? `Cart (${cart.length})` : 'Send back'}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  dismissBtn: {
    backgroundColor: 'rgba(18,8,0,0.88)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#7a4a18',
    zIndex: 100,
  },
  dismissBtnText: { color: '#ffe8a0', fontSize: 12, fontWeight: 'bold' },
});
