import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, POTTED_PLANT_IMAGES, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, POT_SOURCE_POSITIONS, scalePoint } from '../engine/snapPoints';
import { getCurrentSeason } from '../constants/gameData';
import { projectSize, projectPoint } from '../engine/project';

import PlantSlot from '../components/PlantSlot';
import RoomPets from '../components/RoomPets';
import ScreenHud from '../components/ScreenHud';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import InventoryOverlay from '../components/InventoryOverlay';

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
  const { player, slots, heldSeed } = state;

  const [popup, setPopup] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const canDragging = useRef(false);
  const season = getCurrentSeason();

  useEffect(() => {
    if (state.initialized) {
      dispatch({ type: 'INIT_SLOTS', screenWidth: sw, screenHeight: sh });
    }
  }, [state.initialized, sw, sh]);

  const wallColor = player.wallColor?.room1 ?? 'white';
  const bgSource = BACKGROUNDS.room1?.[wallColor]?.[season] ?? BACKGROUNDS.room1.white.spring;

  const pottedPoints = getSnapPoints(1, 'potted', sw, sh);
  const allSnapPoints = pottedPoints;

  const plantedSlots = Object.values(slots).filter((s) => s.room === 1 && s.flowerKey);

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

  // Tap an empty pot: if holding a seed, plant it; otherwise open the empty-pot popup.
  const handleEmptyPotPress = useCallback((slotId, slotObj, position) => {
    if (heldSeed) {
      dispatch({ type: 'PLANT_HELD', slotId });
    } else {
      setPopup({ slot: slotObj, position });
    }
  }, [heldSeed, dispatch]);

  const handlePickSeed = useCallback((item) => {
    dispatch({ type: 'HOLD_SEED', invItemId: item.id, flowerKey: item.flowerKey });
    setInvOpen(false);
  }, [dispatch]);

  const handlePlacePot = useCallback((pt) => {
    dispatch({ type: 'PLACE_POT', slotId: pt.id, room: 1 });
  }, [dispatch]);

  const handleWater = useCallback((slotId) => {
    dispatch({ type: 'WATER_PLANT', slotId });
  }, [dispatch]);

  const handlePopupHarvest = () => { if (popup) dispatch({ type: 'HARVEST_PLANT', slotId: popup.slot.slotId }); setPopup(null); };
  const handlePopupRemove = () => { if (popup) dispatch({ type: 'REMOVE_PLANT', slotId: popup.slot.slotId }); setPopup(null); };

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

        {/* Placed pets */}
        <RoomPets room={1} sw={sw} sh={sh} />

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
              onPress={() => handleEmptyPotPress(pt.id, s, pt)}
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

        {/* Standard HUD — settings (TL) + map (TR) + inventory (BL) */}
        <ScreenHud
          sw={sw} sh={sh}
          onSettings={() => navigation.navigate('Room')}
          onMap={() => navigation.navigate('Map')}
          onInventory={() => setInvOpen(true)}
        />



        {popup && (
          <PlantPopup
            slot={popup.slot}
            position={popup.position}
            onHarvest={handlePopupHarvest}
            onRemove={handlePopupRemove}
            onClose={() => setPopup(null)}
          />
        )}

        {/* Held-seed banner — tap a pot to plant, or tap to cancel */}
        {heldSeed && !invOpen && (
          <TouchableOpacity
            style={styles.heldBanner}
            onPress={() => dispatch({ type: 'CLEAR_HELD' })}
            activeOpacity={0.85}
          >
            <Image source={SEED_IMAGES[heldSeed.flowerKey]} style={styles.heldImg} resizeMode="contain" />
            <Text style={styles.heldText}>Tap an empty pot to plant · tap here to cancel</Text>
          </TouchableOpacity>
        )}

        {invOpen && (
          <InventoryOverlay onClose={() => setInvOpen(false)} onPick={handlePickSeed} />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  // Standard HUD
  hudTL: { position: 'absolute', top: 10, left: 14,   width: 48, height: 48, zIndex: 20 },
  hudTR: { position: 'absolute', top: 10, right: 14,  width: 48, height: 48, zIndex: 20 },
  hudBL: { position: 'absolute', bottom: 14, left: 14, width: 48, height: 48, zIndex: 20 },
  hudImg: { width: '100%', height: '100%' },
  heldBanner: {
    position: 'absolute', top: 10, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(20,40,8,0.92)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: '#70a840', zIndex: 120,
  },
  heldImg: { width: 28, height: 28 },
  heldText: { color: '#d8ffa0', fontSize: 12, fontWeight: 'bold' },
});
