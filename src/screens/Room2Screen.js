import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, PAINTING_IMAGES, PET_IMAGES, HANGING_PLANT_IMAGES, POTTED_PLANT_IMAGES, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, DECOR_POSITIONS, POT_SOURCE_POSITIONS, scalePoint } from '../engine/snapPoints';
import { getCurrentSeason } from '../constants/gameData';
import { projectSize, projectPoint } from '../engine/project';

import CoinHUD from '../components/CoinHUD';
import PlantSlot from '../components/PlantSlot';
import RoomPets from '../components/RoomPets';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import InventoryOverlay from '../components/InventoryOverlay';

function DraggableHangingPot({ startX, startY, potW, potH, dragW, dragH, ghostW, ghostH, targets, onPlace, dragSource, ghostSource }) {
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

export default function Room2Screen({ navigation }) {
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

  const bgSource = BACKGROUNDS.room2?.white?.[season] ?? BACKGROUNDS.room1.white.spring;

  const hangingPoints = getSnapPoints(2, 'hanging', sw, sh);
  const allSnapPoints = hangingPoints;

  const plantedSlots = Object.values(slots).filter((s) => s.room === 2 && s.flowerKey);

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

  // Tap an empty hanging pot: plant the held seed, or open the popup.
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

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        <Image
          source={bgSource}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Placed pets */}
        <RoomPets room={2} sw={sw} sh={sh} />

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
              onPress={() => handleEmptyPotPress(pt.id, s, pt)}
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

        {/* Settings — top-left */}
        <TouchableOpacity style={styles.hudTL} onPress={() => navigation.navigate('Room')}>
          <Image source={UI_IMAGES.settingsnobg} style={styles.hudImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Map — top-right */}
        <TouchableOpacity style={styles.hudTR} onPress={() => navigation.navigate('Map')}>
          <Image source={UI_IMAGES.mapicon} style={styles.hudImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Inventory — bottom-left */}
        <TouchableOpacity style={styles.hudBL} onPress={() => setInvOpen(true)}>
          <Image source={UI_IMAGES.inventorybtn} style={styles.hudImg} resizeMode="contain" />
        </TouchableOpacity>



        {popup && (
          <PlantPopup
            slot={popup.slot}
            position={popup.position}
            onHarvest={handlePopupHarvest}
            onRemove={handlePopupRemove}
            onClose={() => setPopup(null)}
          />
        )}

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
});
