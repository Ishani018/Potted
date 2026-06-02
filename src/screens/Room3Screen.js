import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, SEED_IMAGES } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, scalePoint } from '../engine/snapPoints';
import { getCurrentSeason } from '../constants/gameData';
import { projectSize } from '../engine/project';

import CoinHUD from '../components/CoinHUD';
import PlantSlot from '../components/PlantSlot';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import InventoryOverlay from '../components/InventoryOverlay';

export default function Room3Screen({ navigation }) {
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

  const wallColor = player.wallColor?.room3 ?? 'white';
  const bgSource = BACKGROUNDS.room3?.[wallColor]?.[season] ?? BACKGROUNDS.room1.white.spring;

  const pottedPoints = getSnapPoints(3, 'potted', sw, sh);
  const hangingPoints = getSnapPoints(3, 'hanging', sw, sh);
  const allSnapPoints = [...pottedPoints, ...hangingPoints];

  const plantedSlots = Object.values(slots).filter((s) => s.room === 3 && s.flowerKey);

  const emptySnapPoints = allSnapPoints.filter((pt) => {
    const s = slots[pt.id];
    return s && !s.flowerKey;
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

        {/* Empty snap points become tappable plant targets while holding a seed */}
        {heldSeed && emptySnapPoints.map((pt) => {
          const size = Math.round(projectSize(80, sw, sh));
          return (
            <TouchableOpacity
              key={`plant_${pt.id}`}
              style={{ position: 'absolute', left: pt.x - size / 2, top: pt.y - size / 2, width: size, height: size, zIndex: 6 }}
              activeOpacity={0.6}
              onPress={() => handleEmptyPress(pt.id)}
            />
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

        {/* Top-right: nursery shop */}
        <TouchableOpacity style={styles.nurseryBtn} onPress={() => navigation.navigate('Nursery')}>
          <Image source={UI_IMAGES.nurseryshop} style={styles.nurseryImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Top-left: inventory (no settings on this screen) */}
        <TouchableOpacity style={styles.inventoryBtn} onPress={() => setInvOpen(true)}>
          <Image source={UI_IMAGES.inventorybtn} style={styles.inventoryImg} resizeMode="contain" />
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
  nurseryBtn: { position: 'absolute', top: 10, right: 14, width: 52, height: 52, zIndex: 20 },
  nurseryImg: { width: 52, height: 52 },
  inventoryBtn: { position: 'absolute', top: 10, left: 14, width: 52, height: 52, zIndex: 20 },
  inventoryImg: { width: 52, height: 52 },
  roomBar: { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', gap: 6, zIndex: 20 },
  roomBtn: {
    width: 30, height: 30,
    backgroundColor: 'rgba(30,15,0,0.72)',
    borderRadius: 6, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#7a4a18',
  },
  roomBtnActive: { backgroundColor: '#3d2009', borderColor: '#c8873a' },
  roomBtnText: { color: '#ffe8a0', fontSize: 13, fontWeight: 'bold' },
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
