import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, PAINTING_IMAGES, PET_IMAGES, HANGING_PLANT_IMAGES, POTTED_PLANT_IMAGES, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, DECOR_POSITIONS, POT_SOURCE_POSITIONS, scalePoint } from '../engine/snapPoints';
import { getCurrentSeason, seedType, heldSeedHint, PETS, pestInfo } from '../constants/gameData';
import { pestRewardFor } from '../engine/petEffects';
import { useToast } from '../components/Toast';
import { projectSize, projectPoint } from '../engine/project';

import CoinHUD from '../components/CoinHUD';
import PlantSlot from '../components/PlantSlot';
import HeldSeedBanner from '../components/HeldSeedBanner';
import RemedyBar, { useRemedyUse } from '../components/RemedyBar';
import DraggableHangingPot from '../components/DraggableHangingPot';
import RoomPets from '../components/RoomPets';
import ScreenHud from '../components/ScreenHud';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import InventoryOverlay from '../components/InventoryOverlay';

// Pot types in this room (Balcony: hanging pots only) — seeds of another type can't be planted here.
const ROOM_TYPES = ['hanging'];

export default function Room2Screen({ navigation }) {
  const { width: sw, height: sh } = useLayout();
  const { state, dispatch } = useGame();
  const { player, slots, heldSeed } = state;

  const [popup, setPopup] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const canDragging = useRef(false);
  const [toast, showToast] = useToast();
  const tryRemedy = useRemedyUse(showToast);
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

  // Hanging plants hang DOWN from the rod snap point; the waterable point must
  // sit at the plant's visual center (~half the displayed plant height below the
  // rod) so the watering-can spout actually hovers over the plant.
  const hangingDisplayH = projectSize(235, sw, sh);
  const plantedHangingPoints = hangingPoints
    .filter((pt) => { const s = slots[pt.id]; return s && s.flowerKey; })
    .map((pt) => ({ ...pt, y: pt.y + hangingDisplayH * 0.45 }));

  const handleSlotPress = useCallback((slot, position) => {
    if (canDragging.current) return;
    if (tryRemedy(slot)) return;   // a remedy is picked up: use it on this plant
    if (slot.flowerKey) setPopup({ slot, position });
  }, [tryRemedy]);

  // Tap an empty hanging pot: plant the held seed, or open the popup.
  const handleEmptyPotPress = useCallback((slotId, slotObj, position) => {
    if (heldSeed) {
      if (seedType(heldSeed.flowerKey) !== slotObj.type) {
        showToast(slotObj.type === 'hanging' ? 'Only hanging plants grow here' : 'Only shelf flowers grow here');
        return;
      }
      dispatch({ type: 'PLANT_HELD', slotId });
    } else {
      setPopup({ slot: slotObj, position });
    }
  }, [heldSeed, dispatch, showToast]);

  const handlePickSeed = useCallback((item) => {
    dispatch({ type: 'HOLD_SEED', invItemId: item.id, flowerKey: item.flowerKey });
    setInvOpen(false);
  }, [dispatch]);

  const handlePlacePot = useCallback((pt) => {
    dispatch({ type: 'PLACE_POT', slotId: pt.id, room: 2 });
  }, [dispatch]);

  const handleWater = useCallback((slotId) => {
    if (slots[slotId]?.pest) { showToast(`${pestInfo(slots[slotId].pest).name} on that plant! Clear it first`); return; }
    dispatch({ type: 'WATER_PLANT', slotId });
  }, [dispatch, slots, showToast]);

  const handlePestPress = useCallback((slot) => {
    const reward = pestRewardFor(player, slot.room);
    dispatch({ type: 'REMOVE_PEST', slotId: slot.slotId });
    showToast(`Bug shooed! +${reward} coins`);
  }, [dispatch, showToast, player]);

  // Tap a pet → what it does for this room.
  const handlePetPress = useCallback((petKey) => {
    const pet = PETS[petKey];
    if (pet?.effect) showToast(`${pet.name} · ${pet.effect.title}: ${pet.effect.desc}`, 3500);
  }, [showToast]);

  const handleBlockedSeed = useCallback((item) => {
    showToast(seedType(item.flowerKey) === 'hanging'
      ? 'Hanging plant · plant it in a hanging pot'
      : 'Shelf flower · plant it in a shelf pot');
  }, [showToast]);

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
        <RoomPets room={2} sw={sw} sh={sh} onPetPress={handlePetPress} />

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
          // Stage 0 (hangingpotwithseedvisible 367×891) = tall narrow frame.
          // Grown stages (1024×1024) have a lot of transparent padding around the
          // plant, so the VISIBLE plant is smaller than the canvas width suggests.
          // ~200 makes the bloom's pot match the empty hanging pot's size.
          const isSeedVisible = slot.stage === 0;
          return (
            <PlantSlot
              key={slot.slotId}
              slot={slot}
              position={pt}
              onPress={handleSlotPress}
              onPestPress={handlePestPress}
              baseWidthOverride={isSeedVisible ? 85 : 200}
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

        {/* Standard HUD — settings (TL) + map (TR) + inventory (BL) */}
        <ScreenHud
          sw={sw} sh={sh}
          onSettings={() => navigation.navigate('Settings')}
          onMap={() => navigation.navigate('Map')}
          onInventory={() => setInvOpen(true)}
          onBook={() => navigation.navigate('FlowerBook')}
        />
        <RemedyBar sw={sw} sh={sh} />



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
          <HeldSeedBanner flowerKey={heldSeed.flowerKey} hint={heldSeedHint(heldSeed.flowerKey, ROOM_TYPES)} onCancel={() => dispatch({ type: 'CLEAR_HELD' })} />
        )}

        {toast}

        {invOpen && (
          <InventoryOverlay onClose={() => setInvOpen(false)} onPick={handlePickSeed} roomTypes={ROOM_TYPES} onBlocked={handleBlockedSeed} />
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
