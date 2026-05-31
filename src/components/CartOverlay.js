import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, runOnJS,
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

// ─── Auto-delivered bag: flies from the cart bed to its assigned spot and STAYS ──
// there (at the stored-bag size) until the whole RoomCart unmounts. We dispatch the
// STORE_ON_SILL only after the cart leaves, so the flyer is the only bag on screen
// the entire time — no big/small double-image during the handoff.
function FlyingBag({ item, fromX, fromY, toX, toY, size, delay = 0, onArrive }) {
  // Fly at the RESTING size the whole way (no size tween) so it always matches the
  // final stored bag exactly — eliminates the big/small double-image on handoff.
  const tx = useSharedValue(fromX);
  const ty = useSharedValue(fromY);

  useEffect(() => {
    const FLIGHT_MS = 550;
    tx.value = withDelay(delay, withTiming(toX, { duration: FLIGHT_MS }));
    ty.value = withDelay(delay, withTiming(toY, { duration: FLIGHT_MS }, (finished) => {
      if (finished && onArrive) runOnJS(onArrive)(item);
    }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: tx.value - size / 2,
    top: ty.value - size / 2,
    width: size,
    height: size,
    zIndex: 96,
  }));

  return (
    <Animated.Image source={getSeedImage(item.flowerKey)} style={style} resizeMode="contain" />
  );
}

// ─── Room cart: rolls in, auto-delivers seed bags to their spots, rolls out ──
export function RoomCart({ room = 1 }) {
  const { state, dispatch } = useGame();
  const { width: sw, height: sh } = useLayout();
  const cart = state.cart;

  const cartW = Math.round(projectSize(BASE_STILL_CART_W, sw, sh));
  const cartH = Math.round(projectSize(BASE_STILL_CART_H, sw, sh));
  const cartLeft = sw - cartW;
  const cartTop  = sh - cartH;

  // Cart slides in from the right, then out again after delivery.
  const slideX = useSharedValue(cartW + 20);
  const cartStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: cartLeft,
    top: cartTop,
    width: cartW,
    height: cartH,
    zIndex: 80,
    transform: [{ translateX: slideX.value }],
  }));

  const zone = getCartZone(sw, sh);
  const size = Math.round((zone.x2 - zone.x1) / 4 * 1.3);
  // Resting size of a stored bag (must match SillSeed's bagSize in the room screens).
  const restSize = Math.round(projectSize(BASE_SEED_SIZE * 0.88, sw, sh));

  // Cart bed positions (where bags start) offset to the still cart in the room.
  const offsetX = cartLeft - zone.x1;
  const offsetY = (sh - cartH * 0.55) - zone.y1;
  const bedSlots = getCartBedSlots(sw, sh).map((s) => ({ x: s.x + offsetX, y: s.y + offsetY }));

  // Sill/floor target positions for this room. Room 1 = window sill, room 2 =
  // floor bags. Other rooms have no bag spots yet → empty (cart just passes through).
  const rawSillPts = room === 1
    ? getSillPoints(sw, sh)
    : room === 2
    ? (FLOOR_SILL_POINTS[2] ?? []).map((p) => ({ id: p.id, ...projectPoint(p.x, p.y, sw, sh) }))
    : [];

  // ── Build the delivery plan ONCE on mount ───────────────────────────────────
  // Snapshot cart + currently-free slots, pair bags with slots up to capacity.
  // Bags beyond capacity ride in/out ON the cart (persist for the next visit).
  const planRef = useRef(null);
  if (planRef.current === null) {
    const activeSill = room === 2 ? (state.windowSill2 ?? []) : (state.windowSill ?? []);
    const occupied = new Set(activeSill.map((i) => i.sillSlotId));
    const freeSlots = rawSillPts.filter((pt) => !occupied.has(pt.id));
    const deliver = cart.slice(0, freeSlots.length).map((item, idx) => ({
      item,
      from: bedSlots[item.gridSlot ?? 0] ?? bedSlots[0],
      to: freeSlots[idx],
    }));
    // Leftover bags stay on the cart bed at their own grid slot positions.
    const leftover = cart.slice(freeSlots.length).map((item) => ({
      item,
      at: bedSlots[item.gridSlot ?? 0] ?? bedSlots[0],
    }));
    planRef.current = { deliver, leftover };
  }
  const plan = planRef.current.deliver;
  const leftover = planRef.current.leftover;

  // Leftover bags translate with the cart as it slides in/out.
  const leftoverStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const [arrived, setArrived] = useState(0);
  const rolledOut = useRef(false);

  const handleArrive = useCallback(() => {
    setArrived((n) => n + 1);
  }, []);

  // Commit all deliveries to state, then drop the cart. Doing this together (and
  // only after the cart has rolled out) means the stored SillSeeds appear as this
  // RoomCart unmounts — the flyers never overlap them.
  const finish = useCallback(() => {
    plan.forEach(({ item, to }) => {
      dispatch({ type: 'STORE_ON_SILL', cartItemId: item.id, flowerKey: item.flowerKey, sillSlotId: to.id });
    });
    dispatch({ type: 'SET_CART_IN_ROOM', value: false });
  }, [dispatch, plan]);

  // Roll the cart IN on mount, then OUT once all planned bags have landed.
  useEffect(() => {
    slideX.value = withTiming(0, { duration: 600 });
  }, []);

  useEffect(() => {
    if (rolledOut.current) return;
    if (arrived < plan.length) return; // wait for all flyers to land
    rolledOut.current = true;
    const pause = plan.length === 0 ? 900 : 450; // let bags settle on their spots
    const t = setTimeout(() => {
      slideX.value = withTiming(cartW + 20, { duration: 600 }, () => {
        runOnJS(finish)();
      });
    }, pause);
    return () => clearTimeout(t);
  }, [arrived, plan.length, finish]);

  return (
    <>
      {/* Still cart image — slides in then out */}
      <Animated.Image source={UI_IMAGES.stillcart} style={cartStyle} resizeMode="contain" />

      {/* Leftover bags (no free spot) ride on the cart bed in and back out */}
      {leftover.map(({ item, at }) => (
        <Animated.Image
          key={item.id}
          source={getSeedImage(item.flowerKey)}
          style={[
            {
              position: 'absolute',
              left: at.x - size / 2,
              top: at.y - size / 2,
              width: size,
              height: size,
              zIndex: 82,
            },
            leftoverStyle,
          ]}
          resizeMode="contain"
        />
      ))}

      {/* Auto-delivered bags fly from the cart bed to their assigned spots */}
      {plan.map(({ item, from, to }, idx) => (
        <FlyingBag
          key={item.id}
          item={item}
          fromX={from.x}
          fromY={from.y}
          toX={to.x}
          toY={to.y}
          size={restSize}
          delay={600 + idx * 180}  // wait for roll-in, then stagger each bag
          onArrive={handleArrive}
        />
      ))}
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
