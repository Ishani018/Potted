import React, { useCallback, useEffect } from 'react';
import { Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { SEED_IMAGES, POTTED_PLANT_IMAGES, UI_IMAGES } from '../engine/assets';
import { isInCartZone, getCartZone, getCartBedSlots, getSillPoints, FLOOR_SILL_POINTS } from '../engine/snapPoints';
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
function RoomSeed({ item, snapPoints, sillPoints, onSnap, onStoreSill, startX, startY, size, zIndex = 90 }) {
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
      if (best.isSill) onStoreSill(item, best.pt.id);
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
    zIndex,
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
export function SillSeed({ item, snapPoints, startX, startY, size, restZIndex = 500 }) {
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
    // At rest use the row's z (back row lower). While dragging jump on top.
    zIndex: dragging.value === 1 ? 500 : restZIndex,
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
  const shelfSize = getSeedSize(sw, sh); // shelf bags keep original size
  const bedSlots = getCartBedSlots(sw, sh);
  // Cart-placed bags sized to fit one column of the bed
  const zone = getCartZone(sw, sh);
  const cartSize = Math.round((zone.x2 - zone.x1) / 4 * 1.3);

  // Keys already in cart — hide those shelf bags so they don't reappear
  const inCartKeys = new Set(cart.map((i) => i.flowerKey));

  const handleDropOnCart = useCallback((item, screenX, screenY) => {
    if (!isInCartZone(screenX, screenY, sw, sh)) return false;
    if (cart.length >= 8) return false;
    // Find nearest free grid slot to drop position
    const usedSlots = new Set(cart.map((i) => i.gridSlot));
    let best = -1, bestDist = Infinity;
    bedSlots.forEach((s, idx) => {
      if (usedSlots.has(idx)) return;
      const d = Math.sqrt((screenX - s.x) ** 2 + (screenY - s.y) ** 2);
      if (d < bestDist) { bestDist = d; best = idx; }
    });
    if (best === -1) return false;
    dispatch({ type: 'ADD_TO_CART', flowerKey: item.flowerKey, gridSlot: best });
    return true;
  }, [dispatch, sw, sh, cart, bedSlots]);

  return (
    <>
      {/* Seeds on cart — each rendered at its assigned grid slot */}
      {cart.map((item) => {
        const slot = bedSlots[item.gridSlot ?? 0];
        if (!slot) return null;
        return (
          <TouchableOpacity
            key={item.id}
            style={{ position: 'absolute', left: slot.x - cartSize / 2, top: slot.y - cartSize / 2, zIndex: (item.gridSlot ?? 0) < 4 ? 50 : 55 }}
            onPress={() => dispatch({ type: 'REMOVE_FROM_CART', id: item.id })}
            activeOpacity={0.7}
          >
            <Image source={getSeedImage(item.flowerKey)} style={{ width: cartSize, height: cartSize }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}

      {/* Draggable shelf seeds — hidden once added to cart, restock on next visit */}
      {shelfItems.filter((item) => !inCartKeys.has(item.flowerKey)).map((item) => (
        <DraggableSeed
          key={item.id}
          item={item}
          onDropOnCart={handleDropOnCart}
          startX={item.shelfX}
          startY={item.shelfY}
          size={shelfSize}
        />
      ))}
    </>
  );
}

// ─── Room cart: still cart PNG bottom-right, seeds draggable onto snap points ──
export function RoomCart({ snapPoints, room = 1, onDismiss }) {
  const { state, dispatch } = useGame();
  const { width: sw, height: sh } = useLayout();
  const cart = state.cart;
  const activeSill = room === 2 ? (state.windowSill2 ?? []) : (state.windowSill ?? []);
  const occupiedSillIds = new Set(activeSill.map((i) => i.sillSlotId));
  // Room 1 uses window sill points, room 2 uses floor sill points
  const rawSillPts = room === 2
    ? (FLOOR_SILL_POINTS[2] ?? []).map((p) => ({ id: p.id, ...projectPoint(p.x, p.y, sw, sh) }))
    : getSillPoints(sw, sh);
  const sillPoints = rawSillPts.filter((pt) => !occupiedSillIds.has(pt.id));

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

  // Bag size matches CartTransitionScreen exactly
  const zone = getCartZone(sw, sh);
  const size = Math.round((zone.x2 - zone.x1) / 4 * 1.3);

  // Offset bed slots from nursery zone to still cart position in room
  // The nursery zone left edge projects to zone.x1; still cart left edge is cartLeft
  const offsetX = cartLeft - zone.x1;
  const offsetY = (sh - cartH * 0.55) - zone.y1; // align bag Y to cart surface
  const bedSlots = getCartBedSlots(sw, sh).map((s) => ({
    x: s.x + offsetX,
    y: s.y + offsetY,
  }));

  const handleSnap = useCallback((slotId, item) => {
    dispatch({ type: 'PLANT_FROM_CART', slotId, cartItemId: item.id, flowerKey: item.flowerKey });
  }, [dispatch]);

  const handleStoreSill = useCallback((item, sillSlotId) => {
    dispatch({ type: 'STORE_ON_SILL', cartItemId: item.id, flowerKey: item.flowerKey, sillSlotId });
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
      {cart.map((item) => {
        const slot = bedSlots[item.gridSlot ?? 0];
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
            zIndex={(item.gridSlot ?? 0) < 4 ? 90 : 95}
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
