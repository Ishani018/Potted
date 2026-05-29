import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Text,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGame } from '../context/GameContext';
import { BACKGROUNDS, UI_IMAGES, PAINTING_IMAGES, PET_IMAGES } from '../engine/assets';
import {
  getSnapPoints,
  WATERING_CAN_POSITIONS,
  DECOR_POSITIONS,
  scalePoint,
} from '../engine/snapPoints';
import { getCurrentSeason } from '../constants/gameData';

import CoinHUD from '../components/CoinHUD';
import PlantSlot from '../components/PlantSlot';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import NurseryMenu from '../components/NurseryMenu';
import DraggablePlant from '../components/DraggablePlant';

const BASE_W = 1376;
const BASE_H = 768;

export default function GardenScreen({ navigation }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const { state, dispatch } = useGame();
  const { player, slots } = state;

  const [activeTab, setActiveTab] = useState('potted'); // 'potted' | 'hanging'
  const [waterMode, setWaterMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [popup, setPopup] = useState(null); // { slot, position }
  const [dragging, setDragging] = useState(null); // { flowerKey, plantType }

  const room = player.currentRoom;
  const wallColor = player.wallColor[`room${room}`] ?? 'white';
  const season = getCurrentSeason();

  // Initialize slots with screen dimensions once
  useEffect(() => {
    if (state.initialized) {
      dispatch({ type: 'INIT_SLOTS', screenWidth: sw, screenHeight: sh });
    }
  }, [state.initialized, sw, sh]);

  // Background image
  const bgSource = BACKGROUNDS[`room${room}`]?.[wallColor]?.[season]
    ?? BACKGROUNDS.room1.green.spring;

  // Snap points for current room + tab
  const snapPoints = getSnapPoints(room, activeTab, sw, sh);

  // For room 2 only: show all snap points (both potted + hanging are hanging rods)
  // For room 3: show both potted floor slots + hanging rod slots
  const allSlotsForRoom = Object.values(slots).filter(
    (s) => s.room === room && s.type === activeTab,
  );

  // Watering can position
  const rawCan = WATERING_CAN_POSITIONS[room] ?? WATERING_CAN_POSITIONS[1];
  const canPos = scalePoint(rawCan.x, rawCan.y, sw, sh);

  // Room 2 decor
  const photoFrameKey = player.placedDecor?.room2?.photoFrame ?? null;
  const petKey = player.placedDecor?.room2?.pet ?? null;

  // Inventory items for drag panel
  const inventoryItems = Object.entries(player.inventory)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count }));

  const handleSlotPress = useCallback(
    (slot, position) => {
      if (waterMode && slot.flowerKey && !slot.isDead) {
        dispatch({ type: 'WATER_PLANT', slotId: slot.slotId });
        setWaterMode(false);
        return;
      }
      if (slot.flowerKey) {
        setPopup({ slot, position });
      }
    },
    [waterMode, dispatch],
  );

  const handlePopupWater = () => {
    if (popup) dispatch({ type: 'WATER_PLANT', slotId: popup.slot.slotId });
    setPopup(null);
  };

  const handlePopupHarvest = () => {
    if (popup) dispatch({ type: 'HARVEST_PLANT', slotId: popup.slot.slotId });
    setPopup(null);
  };

  const handlePopupRemove = () => {
    if (popup) dispatch({ type: 'REMOVE_PLANT', slotId: popup.slot.slotId });
    setPopup(null);
  };

  const handleSnap = useCallback(
    (slotId, flowerKey) => {
      const slot = slots[slotId];
      if (!slot || slot.flowerKey) return;
      dispatch({ type: 'PLANT_SEED', slotId, flowerKey });
    },
    [slots, dispatch],
  );

  const handleNavigate = (screen) => {
    if (screen === 'shop') navigation.navigate('Shop');
    else if (screen === 'achievements') navigation.navigate('Achievements');
    else if (screen === 'room') navigation.navigate('Room');
  };

  // Determine valid snap targets for drag (empty slots of correct type)
  const dragSnapPoints = snapPoints.filter((pt) => {
    const s = slots[pt.id];
    return s && !s.flowerKey;
  });

  // Inventory tray bottom-center
  const trayY = sh - 60;

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        {/* Background */}
        <Image source={bgSource} style={styles.bg} resizeMode="cover" />

        {/* Room 2 decor: painting */}
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

        {/* Room 2 decor: pet */}
        {room === 2 && petKey && (
          <Image
            source={PET_IMAGES[petKey]}
            style={{ position: 'absolute', left: sw * 0.07, top: sh * 0.55, width: 70, height: 70 }}
            resizeMode="contain"
          />
        )}

        {/* Placed plant slots */}
        {allSlotsForRoom.map((slot) => {
          const pt = snapPoints.find((p) => p.id === slot.slotId);
          if (!pt) return null;
          return (
            <PlantSlot
              key={slot.slotId}
              slot={slot}
              position={pt}
              onPress={handleSlotPress}
            />
          );
        })}

        {/* Watering can */}
        <WateringCan position={canPos} isWatering={waterMode} onPress={() => setWaterMode((v) => !v)} />

        {/* Coin HUD */}
        <CoinHUD />

        {/* Nursery button top-right */}
        <TouchableOpacity style={styles.nurseryBtn} onPress={() => setMenuVisible(true)}>
          <Image source={UI_IMAGES.nurseryshop} style={styles.nurseryImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Tab switcher bottom-center */}
        <View style={styles.tabBar}>
          <TouchableOpacity onPress={() => setActiveTab('potted')} style={[styles.tabBtn, activeTab === 'potted' && styles.tabActive]}>
            <Image source={UI_IMAGES.pottedplants} style={styles.tabImg} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('hanging')} style={[styles.tabBtn, activeTab === 'hanging' && styles.tabActive]}>
            <Image source={UI_IMAGES.hangingplants} style={styles.tabImg} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Room switcher bottom-right */}
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

        {/* Inventory tray */}
        {inventoryItems.length > 0 && (
          <View style={[styles.inventoryTray, { bottom: 64, left: sw * 0.3, right: sw * 0.3 }]}>
            {inventoryItems.map(({ key, count }) => (
              <DraggablePlant
                key={key}
                flowerKey={key}
                plantType={activeTab}
                startX={0}
                startY={0}
                snapPoints={dragSnapPoints}
                onSnap={handleSnap}
              />
            ))}
          </View>
        )}

        {/* Draggable seeds panel */}
        <InventoryPanel
          items={inventoryItems}
          activeTab={activeTab}
          dragSnapPoints={dragSnapPoints}
          onSnap={handleSnap}
          sw={sw}
          sh={sh}
        />

        {/* Popup */}
        {popup && (
          <PlantPopup
            slot={popup.slot}
            position={popup.position}
            onWater={handlePopupWater}
            onHarvest={handlePopupHarvest}
            onRemove={handlePopupRemove}
            onClose={() => setPopup(null)}
          />
        )}

        {/* Nursery menu */}
        <NurseryMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onNavigate={handleNavigate}
        />

        {/* Water mode indicator */}
        {waterMode && (
          <View style={styles.waterModeBar}>
            <Text style={styles.waterModeText}>Water Mode — tap a plant</Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

// Separate inventory panel so draggable seeds are positioned correctly
function InventoryPanel({ items, activeTab, dragSnapPoints, onSnap, sw, sh }) {
  if (items.length === 0) return null;

  const startY = sh - 40;
  const spacing = 60;
  const totalW = items.length * spacing;
  const startX = (sw - totalW) / 2 + 25;

  return (
    <>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 58, backgroundColor: 'rgba(20,10,2,0.78)', borderTopWidth: 1.5, borderTopColor: '#7a4a18' }} />
      {items.map(({ key, count }, i) => (
        <View key={key} style={{ position: 'absolute', bottom: 4, left: startX + i * spacing - 25, alignItems: 'center' }}>
          <DraggablePlant
            flowerKey={key}
            plantType={activeTab}
            startX={startX + i * spacing}
            startY={startY}
            snapPoints={dragSnapPoints}
            onSnap={onSnap}
          />
          <Text style={{ position: 'absolute', bottom: -2, right: 0, color: '#ffe8a0', fontSize: 10, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, paddingHorizontal: 3 }}>
            x{count}
          </Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  nurseryBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 52,
    height: 52,
    zIndex: 20,
  },
  nurseryImg: {
    width: 52,
    height: 52,
  },
  tabBar: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(20,10,2,0.72)',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1.5,
    borderColor: '#7a4a18',
    zIndex: 20,
  },
  tabBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    padding: 3,
  },
  tabActive: {
    backgroundColor: '#3d2009',
    borderWidth: 1,
    borderColor: '#c8873a',
  },
  tabImg: {
    width: 34,
    height: 34,
  },
  roomBar: {
    position: 'absolute',
    bottom: 62,
    right: 14,
    flexDirection: 'row',
    gap: 6,
    zIndex: 20,
  },
  roomBtn: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(30,15,0,0.72)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7a4a18',
  },
  roomBtnActive: {
    backgroundColor: '#3d2009',
    borderColor: '#c8873a',
  },
  roomBtnText: {
    color: '#ffe8a0',
    fontSize: 13,
    fontWeight: 'bold',
  },
  inventoryTray: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
  },
  waterModeBar: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,80,140,0.82)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#60b0ff',
    zIndex: 99,
  },
  waterModeText: {
    color: '#ddf0ff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
