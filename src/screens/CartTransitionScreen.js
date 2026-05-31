import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useGame } from '../context/GameContext';
import { useLayout } from '../context/LayoutContext';
import { UI_IMAGES, NURSERY_EMPTY_BG, SEED_IMAGES, POTTED_PLANT_IMAGES } from '../engine/assets';
import { projectPoint, projectSize } from '../engine/project';
import { ALL_SEEDS, BASE_SEED_SIZE, BASE_CART_W, BASE_CART_H } from '../constants/nurseryData';
import { getCartZone } from '../engine/snapPoints';
import { _shuffledSlots } from './NurseryScreen';
import { getCartBedSlots } from '../engine/snapPoints';

// Cart in nursery art: x:180–520, y:280–430 → ~340px wide, right edge at ~520, bottom at ~430.
// BASE_CART_W and BASE_CART_H imported from nurseryData.js
const CART_RIGHT_RAW = { x: 1300, y: 1120 }; // bottom-right of painted cart


function getSeedImage(flowerKey) {
  return SEED_IMAGES[flowerKey] ?? POTTED_PLANT_IMAGES._seed;
}

export default function CartTransitionScreen({ navigation, route }) {
  const { destination = 'Garden', exiting = false } = route?.params ?? {};
  const { state, dispatch } = useGame();
  const { width: sw, height: sh } = useLayout();
  const cart = state.cart;

  const cartW = Math.round(projectSize(BASE_CART_W, sw, sh));
  const cartH = Math.round(projectSize(BASE_CART_H, sw, sh));
  // Shelf bags match NurseryScreen size exactly
  const shelfBagSize = Math.round(projectSize(BASE_SEED_SIZE, sw, sh));
  // Cart bags sized to cart bed slot width
  const _zone = getCartZone(sw, sh);
  const seedSize = Math.round((_zone.x2 - _zone.x1) / 4 * 1.3);

  const cornerPt = projectPoint(CART_RIGHT_RAW.x, CART_RIGHT_RAW.y, sw, sh);
  const cartTop = cornerPt.y - cartH;
  const parkedX = cornerPt.x - cartW;
  const exitX = -cartW - 20;

  // Cart starts at parkedX, moves to exitX
  const cartX = useRef(new Animated.Value(parkedX)).current;
  // Seeds start at 0 offset, move by the same delta (exitX - parkedX)
  const seedDelta = exitX - parkedX;
  const seedX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration_out = exiting ? 1900 : 2000;
    Animated.parallel([
      Animated.timing(cartX, {
        toValue: exitX,
        duration: duration_out,
        useNativeDriver: true,
      }),
      Animated.timing(seedX, {
        toValue: seedDelta,
        duration: duration_out,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (exiting) {
        dispatch({ type: 'SET_CART_IN_ROOM', value: false });
        dispatch({ type: 'CLEAR_CART' });
        navigation.goBack();
      } else {
        dispatch({ type: 'SET_CART_IN_ROOM', value: true });
        navigation.navigate(destination);
        // Small delay so destination renders before this screen is popped
        setTimeout(() => navigation.goBack(), 50);
      }
    });
  }, []);

  // Shelf bag positions — hide seeds already in cart, matching NurseryScreen exactly
  const inCartKeys = new Set(cart.map((i) => i.flowerKey));
  const shelfBags = ALL_SEEDS
    .filter((seed) => !inCartKeys.has(seed.key))
    .map((seed) => {
      const originalIndex = ALL_SEEDS.indexOf(seed);
      const raw = _shuffledSlots[originalIndex] ?? _shuffledSlots[_shuffledSlots.length - 1];
      const p = projectPoint(raw.x, raw.y, sw, sh);
      return { key: `${originalIndex}_${seed.key}`, flowerKey: seed.key, x: p.x, y: p.y };
    });

  return (
    <View style={styles.root}>
      {/* Empty nursery bg */}
      <Image
        source={NURSERY_EMPTY_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      {/* Frozen shelf bags — same positions as NurseryScreen */}
      {shelfBags.map((bag) => (
        <Image
          key={bag.key}
          source={getSeedImage(bag.flowerKey)}
          style={{
            position: 'absolute',
            width: shelfBagSize,
            height: shelfBagSize,
            left: bag.x - shelfBagSize / 2,
            top: bag.y - shelfBagSize / 2,
          }}
          resizeMode="contain"
        />
      ))}

      {/* Rolling cart GIF */}
      <Animated.View
        style={[
          styles.cartWrapper,
          { width: cartW, height: cartH, top: cartTop },
          { transform: [{ translateX: cartX }] },
        ]}
      >
        <Image
          source={UI_IMAGES.cartgif}
          style={{ width: cartW, height: cartH }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Seeds travel with cart — use same bed grid slots as nursery display */}
      {(() => {
        const bedSlots = getCartBedSlots(sw, sh);
        return cart.map((item) => {
          const slot = bedSlots[item.gridSlot ?? 0];
          if (!slot) return null;
          return (
            <Animated.Image
              key={item.id}
              source={getSeedImage(item.flowerKey)}
              style={{
                position: 'absolute',
                width: seedSize,
                height: seedSize,
                left: slot.x - seedSize / 2,
                top: slot.y - seedSize / 2,
                transform: [{ translateX: seedX }],
                zIndex: (item.gridSlot ?? 0) < 4 ? 10 : 15,
              }}
              resizeMode="contain"
            />
          );
        });
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#c4a97a', overflow: 'hidden' },
  cartWrapper: { position: 'absolute', left: 0 },
});
