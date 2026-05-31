import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, POTTED_PLANT_IMAGES, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, getSillPoints, WATERING_CAN_POSITIONS, POT_SOURCE_POSITIONS, scalePoint } from '../engine/snapPoints';
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
      style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: pulse }}
      resizeMode="contain"
    />
  );
}

function DraggablePot({ startX, startY, potW, potH, targets, onPlace, source, dragSource, ghostSource }) {
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

export default function Room1Screen({ navigation }) {
  const { width: sw, height: sh } = useLayout();
  const { state, dispatch } = useGame();
  const { player, slots, cart, cartInRoom, windowSill } = state;

  const [popup, setPopup] = useState(null);
  const canDragging = useRef(false);
  const season = getCurrentSeason();

  useEffect(() => {
    if (state.initialized) {
      dispatch({ type: 'INIT_SLOTS', screenWidth: sw, screenHeight: sh });
    }
  }, [state.initialized, sw, sh]);

  useEffect(() => {
    if (cart.length > 0) dispatch({ type: 'SET_CART_IN_ROOM', value: true });
  }, []);

  const wallColor = player.wallColor?.room1 ?? 'white';
  const bgSource = BACKGROUNDS.room1?.[wallColor]?.[season] ?? BACKGROUNDS.room1.white.spring;

  const pottedPoints = getSnapPoints(1, 'potted', sw, sh);
  const allSnapPoints = pottedPoints;

  const plantedSlots = Object.values(slots).filter((s) => s.room === 1 && s.flowerKey);

  const emptySnapPoints = pottedPoints.filter((pt) => {
    const s = slots[pt.id];
    return s && !s.flowerKey;
  });

  const emptyPotTargets = pottedPoints.filter((pt) => !slots[pt.id]);

  const rawCan = WATERING_CAN_POSITIONS[1];
  const canPos = scalePoint(rawCan.x, rawCan.y, sw, sh);

  const potH = Math.round(projectSize(90, sw, sh) * (344 / 347));
  const plantedPottedPoints = pottedPoints
    .filter((pt) => { const s = slots[pt.id]; return s && s.flowerKey; })
    .map((pt) => ({ ...pt, y: pt.y - potH * 0.5 }));

  const handleSlotPress = useCallback((slot, position) => {
    if (canDragging.current) return;
    if (slot.flowerKey) setPopup({ slot, position });
  }, []);

  const handlePlacePot = useCallback((pt) => {
    dispatch({ type: 'PLACE_POT', slotId: pt.id, room: 1 });
  }, [dispatch]);

  const handleWater = useCallback((slotId) => {
    dispatch({ type: 'WATER_PLANT', slotId });
  }, [dispatch]);

  const handlePopupHarvest = () => { if (popup) dispatch({ type: 'HARVEST_PLANT', slotId: popup.slot.slotId }); setPopup(null); };
  const handlePopupRemove = () => { if (popup) dispatch({ type: 'REMOVE_PLANT', slotId: popup.slot.slotId }); setPopup(null); };

  const sillPts = getSillPoints(sw, sh);
  const bagSize = Math.round(projectSize(BASE_SEED_SIZE * 0.88, sw, sh));

  const potW = Math.round(projectSize(90, sw, sh));
  const potHSrc = Math.round(potW * (344 / 347));
  const rawPos1 = POT_SOURCE_POSITIONS[1];
  const potSrcPos = projectPoint(rawPos1.x, rawPos1.y, sw, sh);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        <Image
          source={bgSource}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Ghost hint bag at sill slot 1 when sill is empty */}
        {windowSill.length === 0 && (
          <GhostBag x={sillPts[0].x} y={sillPts[0].y} size={bagSize} source={SEED_IMAGES.daisy} />
        )}

        {/* Sill seeds — draggable to plant slots */}
        {windowSill.map((item) => {
          const pt = sillPts.find((p) => p.id === item.sillSlotId);
          if (!pt) return null;
          return (
            <SillSeed key={item.id} item={item} snapPoints={emptySnapPoints} startX={pt.x} startY={pt.y} size={bagSize} />
          );
        })}

        {/* Pot source on window sill */}
        <Image
          source={POTTED_PLANT_IMAGES._seed}
          style={{ position: 'absolute', left: potSrcPos.x - potW / 2, top: potSrcPos.y - potHSrc, width: potW, height: potHSrc, zIndex: 598 }}
          resizeMode="contain"
        />
        <DraggablePot
          startX={potSrcPos.x}
          startY={potSrcPos.y}
          potW={potW}
          potH={potHSrc}
          targets={emptyPotTargets}
          onPlace={handlePlacePot}
          source={POTTED_PLANT_IMAGES._seed}
          dragSource={POTTED_PLANT_IMAGES._seed}
          ghostSource={POTTED_PLANT_IMAGES._seed}
        />

        {/* Empty placed pots */}
        {pottedPoints.filter((pt) => {
          const s = slots[pt.id];
          return s && s.hasPot === true && !s.flowerKey;
        }).map((pt) => {
          const s = slots[pt.id];
          const pw = Math.round(projectSize(90, sw, sh));
          const ph = Math.round(pw * (344 / 347));
          return (
            <TouchableOpacity
              key={`emptypot_${pt.id}`}
              style={{ position: 'absolute', left: pt.x - pw / 2, top: pt.y - ph, width: pw, height: ph, zIndex: 5 }}
              activeOpacity={0.85}
              onPress={() => setPopup({ slot: s, position: pt })}
            >
              <Image source={POTTED_PLANT_IMAGES._seed} style={{ width: pw, height: ph }} resizeMode="contain" />
            </TouchableOpacity>
          );
        })}

        {/* Planted slots */}
        {plantedSlots.map((slot) => {
          const pt = allSnapPoints.find((p) => p.id === slot.slotId);
          if (!pt) return null;
          return <PlantSlot key={slot.slotId} slot={slot} position={pt} onPress={handleSlotPress} />;
        })}

        <WateringCan
          position={canPos}
          plantedSnapPoints={plantedPottedPoints}
          onWater={handleWater}
          onDragStart={() => { canDragging.current = true; }}
          onDragEnd={() => { canDragging.current = false; }}
          baseCanSize={200}
        />

        <CoinHUD />

        <TouchableOpacity style={styles.nurseryBtn} onPress={() => navigation.navigate('Nursery')}>
          <Image source={UI_IMAGES.nurseryshop} style={styles.nurseryImg} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Room')}>
          <Image source={UI_IMAGES.settings} style={styles.settingsBtnImg} resizeMode="contain" />
        </TouchableOpacity>

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

        {cartInRoom && (
          <RoomCart
            snapPoints={emptySnapPoints}
            room={1}
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
  settingsBtn: { position: 'absolute', top: 10, right: 72, width: 36, height: 36, zIndex: 20 },
  settingsBtnImg: { width: 36, height: 36 },
  roomBar: { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', gap: 6, zIndex: 20 },
  roomBtn: {
    width: 30, height: 30,
    backgroundColor: 'rgba(30,15,0,0.72)',
    borderRadius: 6, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#7a4a18',
  },
  roomBtnActive: { backgroundColor: '#3d2009', borderColor: '#c8873a' },
  roomBtnText: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },
});
