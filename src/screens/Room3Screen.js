import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, scalePoint } from '../engine/snapPoints';
import { getCurrentSeason, seedType, heldSeedHint, PETS } from '../constants/gameData';
import { pestRewardFor } from '../engine/petEffects';
import { useToast } from '../components/Toast';
import { projectSize } from '../engine/project';

import CoinHUD from '../components/CoinHUD';
import PlantSlot from '../components/PlantSlot';
import RoomPets from '../components/RoomPets';
import ScreenHud from '../components/ScreenHud';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import InventoryOverlay from '../components/InventoryOverlay';

// Pot types in this room — seeds of any other type can't be planted here.
const ROOM_TYPES = ['potted', 'hanging'];

export default function Room3Screen({ navigation }) {
  const { width: sw, height: sh } = useLayout();
  const { state, dispatch } = useGame();
  const { player, slots, heldSeed } = state;

  const [popup, setPopup] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const canDragging = useRef(false);
  const [toast, showToast] = useToast();
  const season = getCurrentSeason();

  useEffect(() => {
    if (state.initialized) {
      dispatch({ type: 'INIT_SLOTS', screenWidth: sw, screenHeight: sh });
    }
  }, [state.initialized, sw, sh]);

  const wallColor = player.wallColor?.room3 ?? 'white';
  const bgSource = BACKGROUNDS.room3?.[wallColor]?.[season] ?? BACKGROUNDS.room1.white.spring;

  const pottedPoints = getSnapPoints(3, 'potted', sw, sh);
  const hangingPoints = getSnapPoints(3, 'hanging', sw, sh);
  const allSnapPoints = [...pottedPoints, ...hangingPoints];

  const plantedSlots = Object.values(slots).filter((s) => s.room === 3 && s.flowerKey);

  // Spots the held seed can go: empty, and the right pot type (shelf vs hook).
  // Shelf spots have no draggable pot here, so their slot may not exist yet.
  const heldType = heldSeed ? seedType(heldSeed.flowerKey) : null;
  const emptySnapPoints = allSnapPoints.filter((pt) => {
    const s = slots[pt.id];
    const ptType = pt.id.includes('_h') ? 'hanging' : 'potted';
    return (!s || !s.flowerKey) && ptType === heldType;
  });

  const rawCan = WATERING_CAN_POSITIONS[3] ?? WATERING_CAN_POSITIONS[1];
  const canPos = scalePoint(rawCan.x, rawCan.y, sw, sh);

  const potH = Math.round(projectSize(90, sw, sh) * (344 / 347));
  const plantedPottedPoints = allSnapPoints
    .filter((pt) => { const s = slots[pt.id]; return s && s.flowerKey; })
    .map((pt) => ({ ...pt, y: pt.y - potH * 0.5 }));

  const handleSlotPress = useCallback((slot, position) => {
    if (canDragging.current) return;
    if (slot.flowerKey) setPopup({ slot, position });
  }, []);

  // Tap an empty snap point while holding a seed → plant it there.
  const handleEmptyPress = useCallback((slotId) => {
    if (heldSeed) dispatch({ type: 'PLANT_HELD', slotId });
  }, [heldSeed, dispatch]);

  const handlePickSeed = useCallback((item) => {
    dispatch({ type: 'HOLD_SEED', invItemId: item.id, flowerKey: item.flowerKey });
    setInvOpen(false);
  }, [dispatch]);

  const handleWater = useCallback((slotId) => {
    if (slots[slotId]?.pest) { showToast('Shoo the bug away first!'); return; }
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

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        <Image
          source={bgSource}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Placed pets */}
        <RoomPets room={3} sw={sw} sh={sh} onPetPress={handlePetPress} />

        {/* Empty snap points become tappable plant targets while holding a seed */}
        {heldSeed && emptySnapPoints.map((pt) => {
          const size = Math.round(projectSize(80, sw, sh));
          return (
            <TouchableOpacity
              key={`plant_${pt.id}`}
              style={{
                position: 'absolute', left: pt.x - size / 2, width: size, height: size, zIndex: 6,
                // shelf spots anchor at the shelf (ring sits above it); hooks anchor at the rod
                top: heldType === 'potted' ? pt.y - size : pt.y,
                // faint ring so you can see where the held seed fits
                borderRadius: size / 2, borderWidth: 2, borderStyle: 'dashed',
                borderColor: 'rgba(216,255,160,0.85)', backgroundColor: 'rgba(216,255,160,0.18)',
              }}
              activeOpacity={0.6}
              onPress={() => handleEmptyPress(pt.id)}
            />
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

        <CoinHUD />

        {/* Standard HUD — settings (TL) + map (TR) + inventory (BL) */}
        <ScreenHud
          sw={sw} sh={sh}
          onSettings={() => navigation.navigate('Room')}
          onMap={() => navigation.navigate('Map')}
          onInventory={() => setInvOpen(true)}
          onBook={() => navigation.navigate('FlowerBook')}
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

        {heldSeed && !invOpen && (
          <TouchableOpacity
            style={styles.heldBanner}
            onPress={() => dispatch({ type: 'CLEAR_HELD' })}
            activeOpacity={0.85}
          >
            <Image source={SEED_IMAGES[heldSeed.flowerKey]} style={styles.heldImg} resizeMode="contain" />
            <Text style={styles.heldText}>{heldSeedHint(heldSeed.flowerKey, ROOM_TYPES)}</Text>
          </TouchableOpacity>
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
  nurseryBtn: { position: 'absolute', top: 10, right: 14, width: 52, height: 52, zIndex: 20 },
  nurseryImg: { width: 52, height: 52 },
  inventoryBtn: { position: 'absolute', top: 10, left: 14, width: 52, height: 52, zIndex: 20 },
  inventoryImg: { width: 52, height: 52 },
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
