import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, scalePoint } from '../engine/snapPoints';
import { getCurrentSeason } from '../constants/gameData';
import { projectSize } from '../engine/project';

import CoinHUD from '../components/CoinHUD';
import PlantSlot from '../components/PlantSlot';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import { RoomCart } from '../components/CartOverlay';

export default function Room3Screen({ navigation }) {
  const { width: sw, height: sh } = useLayout();
  const { state, dispatch } = useGame();
  const { player, slots, cart, cartInRoom } = state;

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
            room={3}
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
