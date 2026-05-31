import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, PAINTING_IMAGES, PET_IMAGES, HANGING_PLANT_IMAGES, POTTED_PLANT_IMAGES, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, DECOR_POSITIONS, POT_SOURCE_POSITIONS, FLOOR_SILL_POINTS, scalePoint } from '../engine/snapPoints';
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

function DraggableHangingPot({ startX, startY, potW, potH, dragW, dragH, ghostW, ghostH, targets, onPlace, dragSource, ghostSource }) {
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

export default function Room2Screen({ navigation }) {
  const { width: sw, height: sh } = useLayout();
  const { state, dispatch } = useGame();
  const { player, slots, cart, cartInRoom, windowSill2 } = state;

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

  const bgSource = BACKGROUNDS.room2?.white?.[season] ?? BACKGROUNDS.room1.white.spring;

  const hangingPoints = getSnapPoints(2, 'hanging', sw, sh);
  const allSnapPoints = hangingPoints;

  const plantedSlots = Object.values(slots).filter((s) => s.room === 2 && s.flowerKey);

  const emptySnapPoints = hangingPoints.filter((pt) => {
    const s = slots[pt.id];
    return s && s.hasPot === true && !s.flowerKey;
  });

  const dragTargets = hangingPoints.filter((pt) => !slots[pt.id]?.hasPot);

  const rawCan = WATERING_CAN_POSITIONS[2];
  const canPos = scalePoint(rawCan.x, rawCan.y, sw, sh);

  const hangingPotH = Math.round(projectSize(100, sw, sh) * 0.93);
  const plantedHangingPoints = hangingPoints
    .filter((pt) => { const s = slots[pt.id]; return s && s.flowerKey; })
    .map((pt) => ({ ...pt, y: pt.y + hangingPotH * 0.5 }));

  const handleSlotPress = useCallback((slot, position) => {
    if (canDragging.current) return;
    if (slot.flowerKey) setPopup({ slot, position });
  }, []);

  const handlePlacePot = useCallback((pt) => {
    dispatch({ type: 'PLACE_POT', slotId: pt.id, room: 2 });
  }, [dispatch]);

  const handleWater = useCallback((slotId) => {
    dispatch({ type: 'WATER_PLANT', slotId });
  }, [dispatch]);

  const handlePopupHarvest = () => { if (popup) dispatch({ type: 'HARVEST_PLANT', slotId: popup.slot.slotId }); setPopup(null); };
  const handlePopupRemove = () => { if (popup) dispatch({ type: 'REMOVE_PLANT', slotId: popup.slot.slotId, deletePot: true }); setPopup(null); };

  const photoFrameKey = player.placedDecor?.room2?.photoFrame ?? null;
  const petKey = player.placedDecor?.room2?.pet ?? null;

  // stool image size (potonstool) — sets the hitbox and rest display
  const potW = Math.round(projectSize(100, sw, sh));
  const potH = Math.round(potW * 0.93);
  // drag + ghost + placed empty pot share the same image (emptyhangingpotwithseed)
  // and size so they all match. Bump this number to resize all three together.
  const dragW = Math.round(projectSize(235, sw, sh));
  const dragH = dragW; // square (1024×1024)
  const ghostW = dragW;
  const ghostH = dragH;
  const rawPos2 = POT_SOURCE_POSITIONS[2];
  const potSrcPos = projectPoint(rawPos2.x, rawPos2.y, sw, sh);

  const floorPts = FLOOR_SILL_POINTS[2].map((p) => ({ id: p.id, ...projectPoint(p.x, p.y, sw, sh) }));
  const bagSize = Math.round(projectSize(BASE_SEED_SIZE * 0.88, sw, sh));

  // Seeds snap onto the POT, which hangs below the rod snap point. Shift the
  // target y down to the pot's visual center so dropping a seed on the pot works.
  const seedTargets = emptySnapPoints.map((pt) => ({ ...pt, y: pt.y + dragH * 0.45 }));

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        <Image
          source={bgSource}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Photo frame */}
        {photoFrameKey && (() => {
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

        {/* Pet */}
        {petKey && (
          <Image
            source={PET_IMAGES[petKey]}
            style={{ position: 'absolute', left: sw * 0.07, top: sh * 0.55, width: 70, height: 70 }}
            resizeMode="contain"
          />
        )}

        {/* Floor seed bags */}
        {windowSill2.length === 0 && (
          <GhostBag x={floorPts[0].x} y={floorPts[0].y} size={bagSize} source={SEED_IMAGES.daisy} />
        )}
        {windowSill2.map((item) => {
          const rawPt = FLOOR_SILL_POINTS[2].find((p) => p.id === item.sillSlotId);
          if (!rawPt) return null;
          const pos = projectPoint(rawPt.x, rawPt.y, sw, sh);
          // Back row (sill_1..3) sits behind the front row (sill_4..6).
          const isBackRow = ['r2_sill_1', 'r2_sill_2', 'r2_sill_3'].includes(item.sillSlotId);
          return (
            <SillSeed
              key={item.id}
              item={item}
              snapPoints={seedTargets}
              startX={pos.x}
              startY={pos.y}
              size={bagSize}
              restZIndex={isBackRow ? 100 : 110}
            />
          );
        })}

        {/* Pot source on stool — static image at rest, gesture layer on top */}
        <Image
          source={HANGING_PLANT_IMAGES._stool}
          style={{ position: 'absolute', left: potSrcPos.x - potW / 2, top: potSrcPos.y - potH, width: potW, height: potH, zIndex: 2 }}
          resizeMode="contain"
        />
        <DraggableHangingPot
          startX={potSrcPos.x}
          startY={potSrcPos.y - potH}
          potW={potW}
          potH={potH}
          dragW={dragW}
          dragH={dragH}
          ghostW={ghostW}
          ghostH={ghostH}
          targets={dragTargets}
          onPlace={handlePlacePot}
          dragSource={HANGING_PLANT_IMAGES._seed}
          ghostSource={HANGING_PLANT_IMAGES._seed}
        />

        {/* Empty placed hanging pots — pot dragged onto a rod, no seed yet */}
        {hangingPoints.filter((pt) => {
          const s = slots[pt.id];
          return s && s.hasPot === true && !s.flowerKey;
        }).map((pt) => {
          const s = slots[pt.id];
          return (
            <TouchableOpacity
              key={`emptypot_${pt.id}`}
              style={{ position: 'absolute', left: pt.x - dragW / 2, top: pt.y, width: dragW, height: dragH, zIndex: 5 }}
              activeOpacity={0.85}
              onPress={() => setPopup({ slot: s, position: pt })}
            >
              <Image source={HANGING_PLANT_IMAGES._seed} style={{ width: dragW, height: dragH }} resizeMode="contain" />
            </TouchableOpacity>
          );
        })}

        {/* Planted slots — room 2 hanging pots sized to match the empty pot (170) */}
        {plantedSlots.map((slot) => {
          const pt = allSnapPoints.find((p) => p.id === slot.slotId);
          if (!pt) return null;
          // Stage 0 image (hangingpotwithseedvisible, 367×891) is tall & narrow,
          // unlike the square empty pot (1024×1024). Give stage 0 its own width so
          // the visible POT matches the empty pot's pot, not the frame.
          const isSeedVisible = slot.stage === 0;
          return (
            <PlantSlot
              key={slot.slotId}
              slot={slot}
              position={pt}
              onPress={handleSlotPress}
              baseWidthOverride={isSeedVisible ? 85 : 235}
            />
          );
        })}

        <WateringCan
          position={canPos}
          plantedSnapPoints={plantedHangingPoints}
          onWater={handleWater}
          onDragStart={() => { canDragging.current = true; }}
          onDragEnd={() => { canDragging.current = false; }}
          baseCanSize={180}
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
            snapPoints={seedTargets}
            room={2}
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
