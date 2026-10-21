import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, POTTED_PLANT_IMAGES, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, POT_SOURCE_POSITIONS, scalePoint } from '../engine/snapPoints';
import { getCurrentSeason, seedType, heldSeedHint, PETS, pestInfo } from '../constants/gameData';
import { pestRewardFor } from '../engine/petEffects';
import { useToast } from '../components/Toast';
import { projectSize, projectPoint } from '../engine/project';

import PlantSlot from '../components/PlantSlot';
import HeldSeedBanner from '../components/HeldSeedBanner';
import RemedyBar, { useRemedyUse } from '../components/RemedyBar';
import DraggablePot from '../components/DraggablePot';
import RoomPets from '../components/RoomPets';
import ScreenHud from '../components/ScreenHud';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import InventoryOverlay from '../components/InventoryOverlay';

// Pot types in this room (Greenhouse: shelf pots only) — seeds of another type can't be planted here.
const ROOM_TYPES = ['potted'];

export default function Room1Screen({ navigation }) {
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
    if (tryRemedy(slot)) return;   // a remedy is picked up: use it on this plant
    if (slot.flowerKey) setPopup({ slot, position });
  }, [tryRemedy]);

  // Tap an empty pot: if holding a seed, plant it; otherwise open the empty-pot popup.
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
    dispatch({ type: 'PLACE_POT', slotId: pt.id, room: 1 });
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
        <RoomPets room={1} sw={sw} sh={sh} onPetPress={handlePetPress} />

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
          return <PlantSlot key={slot.slotId} slot={slot} position={pt} onPress={handleSlotPress} onPestPress={handlePestPress} />;
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

        {/* Held-seed banner — tap a pot to plant, or tap to cancel */}
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
