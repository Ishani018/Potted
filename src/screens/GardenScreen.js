import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, PAINTING_IMAGES, PET_IMAGES, POTTED_PLANT_IMAGES, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, getSillPoints, WATERING_CAN_POSITIONS, DECOR_POSITIONS, POT_SOURCE_POSITIONS, scalePoint } from '../engine/snapPoints';
import { getCurrentSeason } from '../constants/gameData';
import { projectSize, projectPoint } from '../engine/project';
import { BASE_SEED_SIZE } from '../constants/nurseryData';

import CoinHUD from '../components/CoinHUD';
import PlantSlot from '../components/PlantSlot';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import { RoomCart, SillSeed } from '../components/CartOverlay';

function GhostBag({ x, y, size, source }) {
  const pulse = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.65, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.25, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.Image
      source={source}
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: pulse,
      }}
      resizeMode="contain"
    />
  );
}

function DraggablePot({ startX, startY, potW, potH, targets, onPlace }) {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const ox = useSharedValue(startX);
  const oy = useSharedValue(startY);

  const trySnap = useCallback((x, y) => {
    const SNAP_R = 60;
    let best = null, bestDist = SNAP_R + 1;
    for (const pt of targets) {
      const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
      if (dist < bestDist) { bestDist = dist; best = pt; }
    }
    if (best) onPlace(best);
    tx.value = withSpring(startX);
    ty.value = withSpring(startY);
  }, [targets, onPlace, startX, startY]);

  const drag = Gesture.Pan()
    .onStart(() => { ox.value = tx.value; oy.value = ty.value; })
    .onUpdate((e) => { tx.value = ox.value + e.translationX; ty.value = oy.value + e.translationY; })
    .onEnd(() => { runOnJS(trySnap)(tx.value, ty.value); });

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: tx.value - potW / 2,
    top: ty.value - potH,
    width: potW,
    height: potH,
    zIndex: 15,
  }));

  return (
    <GestureDetector gesture={drag}>
      <ReAnimated.View style={animStyle}>
        <Image source={POTTED_PLANT_IMAGES._seed} style={{ width: potW, height: potH }} resizeMode="contain" />
      </ReAnimated.View>
    </GestureDetector>
  );
}

export default function GardenScreen({ navigation }) {
  const { width: sw, height: sh } = useLayout();
  const { state, dispatch } = useGame();
  const { player, slots, cart, cartInRoom, windowSill } = state;

  const [popup, setPopup] = useState(null);
  const canDragging = useRef(false);

  const room = player.currentRoom;
  const wallColor = player.wallColor[`room${room}`] ?? 'white';
  const season = getCurrentSeason();

  useEffect(() => {
    if (state.initialized) {
      dispatch({ type: 'INIT_SLOTS', screenWidth: sw, screenHeight: sh });
    }
  }, [state.initialized, sw, sh]);

  useEffect(() => {
    if (cart.length > 0) {
      dispatch({ type: 'SET_CART_IN_ROOM', value: true });
    }
  }, []);

  const bgSource = BACKGROUNDS[`room${room}`]?.[wallColor]?.[season]
    ?? BACKGROUNDS.room1.white.spring;

  // All snap points for the current room (both potted + hanging)
  const pottedPoints = getSnapPoints(room, 'potted', sw, sh);
  const hangingPoints = getSnapPoints(room, 'hanging', sw, sh);
  const allSnapPoints = [...pottedPoints, ...hangingPoints];

  // All planted slots for this room
  const plantedSlots = Object.values(slots).filter(
    (s) => s.room === room && s.flowerKey,
  );

  // Empty snap points — valid targets for cart seeds
  const emptySnapPoints = allSnapPoints.filter((pt) => {
    const s = slots[pt.id];
    return s && !s.flowerKey;
  });

  // Potted snap points with no pot — valid drop targets for pot dragging
  const emptyPotTargets = pottedPoints.filter((pt) => !slots[pt.id]);

  const rawCan = WATERING_CAN_POSITIONS[room] ?? WATERING_CAN_POSITIONS[1];
  const canPos = scalePoint(rawCan.x, rawCan.y, sw, sh);

  const photoFrameKey = player.placedDecor?.room2?.photoFrame ?? null;
  const petKey = player.placedDecor?.room2?.pet ?? null;

  // Snap points for planted pots — passed to WateringCan for hover detection
  const plantedPottedPoints = pottedPoints.filter((pt) => {
    const s = slots[pt.id];
    return s && s.flowerKey;
  });

  const handleSlotPress = useCallback((slot, position) => {
    if (canDragging.current) return;
    if (slot.flowerKey) setPopup({ slot, position });
  }, []);

  const handlePlacePot = useCallback((pt) => {
    dispatch({ type: 'PLACE_POT', slotId: pt.id, room });
  }, [dispatch, room]);

  const handleWater = useCallback((slotId) => {
    dispatch({ type: 'WATER_PLANT', slotId });
  }, [dispatch]);

  const handlePopupHarvest = () => { if (popup) dispatch({ type: 'HARVEST_PLANT', slotId: popup.slot.slotId }); setPopup(null); };
  const handlePopupRemove = () => { if (popup) dispatch({ type: 'REMOVE_PLANT', slotId: popup.slot.slotId }); setPopup(null); };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        <Image
          source={bgSource}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Room 2 painting */}
        {room === 2 && photoFrameKey && (() => {
          const raw = DECOR_POSITIONS.room2.photoFrame;
          const pos = scalePoint(raw.x, raw.y, sw, sh);
          return (
            <Image
              source={PAINTING_IMAGES[photoFrameKey]}
              style={{ position: 'absolute', left: pos.x - 35, top: pos.y - 35, width: 70, height: 70 }}
              resizeMode="contain"
            />
          );
        })()}


        {/* Room 2 pet */}
        {room === 2 && petKey && (
          <Image
            source={PET_IMAGES[petKey]}
            style={{ position: 'absolute', left: sw * 0.07, top: sh * 0.55, width: 70, height: 70 }}
            resizeMode="contain"
          />
        )}

        {/* Ghost hint bag — pulses at far-left of sill when sill is empty */}
        {room === 1 && windowSill.length === 0 && (() => {
          const bagSize = Math.round(projectSize(BASE_SEED_SIZE, sw, sh));
          const pos = projectPoint(190, 275, sw, sh);
          return (
            <GhostBag
              x={pos.x}
              y={pos.y}
              size={bagSize}
              source={SEED_IMAGES.daisy}
            />
          );
        })()}

        {/* Draggable pot source — drag to place empty pots on shelves */}
        {POT_SOURCE_POSITIONS[room] && (() => {
          const potW = Math.round(projectSize(90, sw, sh));
          const potH = Math.round(projectSize(115, sw, sh));
          const rawPos = POT_SOURCE_POSITIONS[room];
          const pos = projectPoint(rawPos.x, rawPos.y, sw, sh);
          return (
            <DraggablePot
              startX={pos.x}
              startY={pos.y}
              potW={potW}
              potH={potH}
              targets={emptyPotTargets}
              onPlace={handlePlacePot}
            />
          );
        })()}

        {/* Window sill stored seeds — draggable to plant slots */}
        {room === 1 && (() => {
          const sillPts = getSillPoints(sw, sh);
          const bagSize = Math.round(projectSize(BASE_SEED_SIZE, sw, sh));
          return windowSill.map((item, i) => {
            const pt = sillPts[i];
            if (!pt) return null;
            return (
              <SillSeed
                key={item.id}
                item={item}
                snapPoints={emptySnapPoints}
                startX={pt.x}
                startY={pt.y}
                size={bagSize}
              />
            );
          });
        })()}

        {/* Empty pots — tappable to remove */}
        {pottedPoints.filter((pt) => {
          const s = slots[pt.id];
          return s && !s.flowerKey;
        }).map((pt) => {
          const s = slots[pt.id];
          const potW = Math.round(projectSize(90, sw, sh));
          const potH = Math.round(projectSize(115, sw, sh));
          return (
            <TouchableOpacity
              key={`emptypot_${pt.id}`}
              style={{ position: 'absolute', left: pt.x - potW / 2, top: pt.y - potH, width: potW, height: potH, zIndex: 5 }}
              activeOpacity={0.85}
              onPress={() => setPopup({ slot: s, position: pt })}
            >
              <Image
                source={POTTED_PLANT_IMAGES._seed}
                style={{ width: potW, height: potH }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}

        {/* Planted slots */}
        {plantedSlots.map((slot) => {
          const pt = allSnapPoints.find((p) => p.id === slot.slotId);
          if (!pt) return null;
          return (
            <PlantSlot key={slot.slotId} slot={slot} position={pt} onPress={handleSlotPress} />
          );
        })}

        <WateringCan
          position={canPos}
          plantedSnapPoints={plantedPottedPoints}
          onWater={handleWater}
          onDragStart={() => { canDragging.current = true; }}
          onDragEnd={() => { canDragging.current = false; }}
        />

        <CoinHUD />

        {/* Nursery button */}
        <TouchableOpacity style={styles.nurseryBtn} onPress={() => navigation.navigate('Nursery')}>
          <Image source={UI_IMAGES.nurseryshop} style={styles.nurseryImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Room settings */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Room')}>
          <Image source={UI_IMAGES.settings} style={styles.settingsBtnImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Room switcher */}
        {player.unlockedRooms.length > 1 && (
          <View style={styles.roomBar}>
            {player.unlockedRooms.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roomBtn, player.currentRoom === r && styles.roomBtnActive]}
                onPress={() => dispatch({ type: 'SET_ROOM', room: r })}
              >
                <Text style={styles.roomBtnText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Cart (travels from nursery) */}
        {cartInRoom && (
          <RoomCart
            snapPoints={emptySnapPoints}
            onDismiss={() => navigation.navigate('CartTransition', { destination: 'Garden', exiting: true })}
          />
        )}

        {popup && (
          <PlantPopup
            slot={popup.slot}
            position={popup.position}
            onHarvest={handlePopupHarvest}
            onRemove={handlePopupRemove}
            onClose={() => setPopup(null)}
          />
        )}

      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  nurseryBtn: { position: 'absolute', top: 10, right: 14, width: 52, height: 52, zIndex: 20 },
  nurseryImg: { width: 52, height: 52 },
  settingsBtn: {
    position: 'absolute', top: 10, right: 72,
    width: 36, height: 36,
    zIndex: 20,
  },
  settingsBtnImg: { width: 36, height: 36 },
  roomBar: {
    position: 'absolute', bottom: 14, right: 14,
    flexDirection: 'row', gap: 6, zIndex: 20,
  },
  roomBtn: {
    width: 30, height: 30,
    backgroundColor: 'rgba(30,15,0,0.72)',
    borderRadius: 6, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#7a4a18',
  },
  roomBtnActive: { backgroundColor: '#3d2009', borderColor: '#c8873a' },
  roomBtnText: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },
  waterModeBar: {
    position: 'absolute', top: 10, alignSelf: 'center',
    backgroundColor: 'rgba(0,80,140,0.82)',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: '#60b0ff', zIndex: 99,
  },
  waterModeText: { color: '#ddf0ff', fontSize: 13, fontWeight: 'bold' },
});
