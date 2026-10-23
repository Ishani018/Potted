import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGame } from '../context/GameContext';
import { ROOM_BGS, SEED_IMAGES, POTTED_PLANT_IMAGES, PPOT_META, HANGING_PLANT_IMAGES, HPOT_META } from '../engine/assets';
import { getSnapPoints, WATERING_CAN_POSITIONS, POT_SOURCE_POSITIONS, HANGING_POT_SOURCE_POSITIONS, scalePoint } from '../engine/snapPoints';
import { seedType, heldSeedHint, PETS, pestInfo } from '../constants/gameData';
import { pestRewardFor } from '../engine/petEffects';
import { useToast } from '../components/Toast';
import { projectSize, projectPoint } from '../engine/project';

import CoinHUD from '../components/CoinHUD';
import HangingArt, { hangingBox } from '../components/HangingArt';
import PlantSlot from '../components/PlantSlot';
import HeldSeedBanner from '../components/HeldSeedBanner';
import RemedyBar, { useRemedyUse } from '../components/RemedyBar';
import DraggablePot from '../components/DraggablePot';
import DraggableHangingPot from '../components/DraggableHangingPot';
import RoomPets from '../components/RoomPets';
import ScreenHud from '../components/ScreenHud';
import WateringCan from '../components/WateringCan';
import PlantPopup from '../components/PlantPopup';
import InventoryOverlay from '../components/InventoryOverlay';

// Pot types in this room — seeds of any other type can't be planted here.
const ROOM_TYPES = ['potted', 'hanging'];

// Sunroom pots/can are drawn a bit smaller than the Greenhouse's (90 / 200).
const SUN_POT_W = 67;
const SUN_CAN = 120;
const SUN_HANG_W = 260;   // hanging plant/pot canvas width (image has lots of padding)

export default function Room3Screen({ navigation }) {
  const { width: sw, height: sh } = useLayout();
  const { state, dispatch } = useGame();
  const { player, slots, heldSeed } = state;

  const [popup, setPopup] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const canDragging = useRef(false);
  const [toast, showToast] = useToast();
  const tryRemedy = useRemedyUse(showToast);

  useEffect(() => {
    if (state.initialized) {
      dispatch({ type: 'INIT_SLOTS', screenWidth: sw, screenHeight: sh });
    }
  }, [state.initialized, sw, sh]);

  const bgSource = ROOM_BGS.room3;

  const pottedPoints = getSnapPoints(3, 'potted', sw, sh);
  const hangingPoints = getSnapPoints(3, 'hanging', sw, sh);
  const allSnapPoints = [...pottedPoints, ...hangingPoints];

  const plantedSlots = Object.values(slots).filter((s) => s.room === 3 && s.flowerKey);

  // Shelf pots are dragged onto free shelf spots (like the Greenhouse).
  const emptyPotTargets = pottedPoints.filter((pt) => !slots[pt.id]);
  // Hooks take a dragged hanging pot too (a hook's slot always exists; hasPot
  // says whether a pot hangs there).
  const emptyHookTargets = hangingPoints.filter((pt) => !slots[pt.id]?.hasPot);

  const rawCan = WATERING_CAN_POSITIONS[3] ?? WATERING_CAN_POSITIONS[1];
  const canPos = scalePoint(rawCan.x, rawCan.y, sw, sh);

  const potH = Math.round(projectSize(SUN_POT_W, sw, sh) * (344 / 347));
  // Watering targets: shelf pots grow upward from pt.y, hanging pots hang below
  // the hook (same offset the Balcony uses).
  const hangingPotH = Math.round(projectSize(SUN_HANG_W, sw, sh) * 0.9);
  const plantedPottedPoints = allSnapPoints
    .filter((pt) => { const s = slots[pt.id]; return s && s.flowerKey; })
    .map((pt) => (pt.id.includes('_h')
      ? { ...pt, y: pt.y + hangingPotH * 0.5 }
      : { ...pt, y: pt.y - potH * 0.5 }));

  const handleSlotPress = useCallback((slot, position) => {
    if (canDragging.current) return;
    if (tryRemedy(slot)) return;   // a remedy is picked up: use it on this plant
    if (slot.flowerKey) setPopup({ slot, position });
  }, [tryRemedy]);

  // Tap an empty pot: plant the held seed (if it fits), else open the popup.
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

  const handlePlacePot = useCallback((pt) => {
    dispatch({ type: 'PLACE_POT', slotId: pt.id, room: 3 });
  }, [dispatch]);

  // Hanging pot sizes — same as the Balcony. Stool image sets the drag hitbox;
  // drag/ghost/placed pots share the (square) hanging pot image.
  const hookPotW = Math.round(projectSize(120, sw, sh));
  const hookPotH = Math.round(hookPotW * 0.93);
  const hookDragW = Math.round(projectSize(160, sw, sh));
  const rawHookSrc = HANGING_POT_SOURCE_POSITIONS[3];
  const hookSrcPos = projectPoint(rawHookSrc.x, rawHookSrc.y, sw, sh);

  const handlePickSeed = useCallback((item) => {
    dispatch({ type: 'HOLD_SEED', invItemId: item.id, flowerKey: item.flowerKey });
    setInvOpen(false);
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

  const potW = Math.round(projectSize(SUN_POT_W, sw, sh));
  const potHSrc = Math.round(potW * (344 / 347));
  const rawPotSrc = POT_SOURCE_POSITIONS[3];
  const potSrcPos = projectPoint(rawPotSrc.x, rawPotSrc.y, sw, sh);

  const handlePopupHarvest = () => { if (popup) dispatch({ type: 'HARVEST_PLANT', slotId: popup.slot.slotId }); setPopup(null); };
  const handlePopupRemove = () => { if (popup) dispatch({ type: 'REMOVE_PLANT', slotId: popup.slot.slotId, deletePot: true }); setPopup(null); };

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

        {/* Pot source on the floor + drag handle (drag onto a shelf spot) */}
        <Image
          source={PPOT_META[player.pottedPot || 4].src}
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
          source={PPOT_META[player.pottedPot || 4].src}
          dragSource={PPOT_META[player.pottedPot || 4].src}
          ghostSource={PPOT_META[player.pottedPot || 4].src}
        />

        {/* Empty placed shelf pots — tap to plant the held seed */}
        {pottedPoints.filter((pt) => {
          const s = slots[pt.id];
          return s && s.hasPot === true && !s.flowerKey;
        }).map((pt) => {
          const s = slots[pt.id];
          return (
            <TouchableOpacity
              key={`emptypot_${pt.id}`}
              style={{ position: 'absolute', left: pt.x - potW / 2, top: pt.y - potHSrc, width: potW, height: potHSrc, zIndex: 5 }}
              activeOpacity={0.85}
              onPress={() => handleEmptyPotPress(pt.id, s, pt)}
            >
              <Image source={PPOT_META[player.pottedPot || 4].src} style={{ width: potW, height: potHSrc }} resizeMode="contain" />
            </TouchableOpacity>
          );
        })}

        {/* Hook-pot source on a stool + drag handle (drag onto a free hook) */}
        <Image
          source={HPOT_META[player.hangingPot || 'macrame'].src}
          style={{ position: 'absolute', left: hookSrcPos.x - hookPotW / 2, top: hookSrcPos.y - hookPotW * 1.5, width: hookPotW, height: hookPotW * 1.5, zIndex: 2 }}
          resizeMode="contain"
        />
        <DraggableHangingPot
          startX={hookSrcPos.x}
          startY={hookSrcPos.y - hookPotH}
          potW={hookPotW}
          potH={hookPotH}
          dragW={hookDragW}
          dragH={hookDragW}
          ghostW={hookDragW}
          ghostH={hookDragW}
          targets={emptyHookTargets}
          onPlace={handlePlacePot}
          dragSource={HPOT_META[player.hangingPot || 'macrame'].src}
          ghostSource={HPOT_META[player.hangingPot || 'macrame'].src}
        />

        {/* Empty hanging pots — tap to plant the held seed */}
        {hangingPoints.filter((pt) => {
          const s = slots[pt.id];
          return s && s.hasPot === true && !s.flowerKey;
        }).map((pt) => {
          const s = slots[pt.id];
          return (
            <TouchableOpacity
              key={`emptyhook_${pt.id}`}
              style={{ position: 'absolute', left: pt.x - hangingBox(s.pot || 'macrame', hookDragW).hookX, top: pt.y, width: hangingBox(s.pot || 'macrame', hookDragW).w, height: hangingBox(s.pot || 'macrame', hookDragW).h, zIndex: 5 }}
              activeOpacity={0.85}
              onPress={() => handleEmptyPotPress(pt.id, s, pt)}
            >
              <HangingArt pot={s.pot || 'macrame'} h={hookDragW} wire={pt.wire || 0} />
            </TouchableOpacity>
          );
        })}

        {/* Planted slots */}
        {plantedSlots.map((slot) => {
          const pt = allSnapPoints.find((p) => p.id === slot.slotId);
          if (!pt) return null;
          // Hanging pots use the Balcony's sizing (stage 0 image is tall & narrow).
          const hangingSize = slot.type === 'hanging'
            ? { baseWidthOverride: slot.stage === 0 ? 100 : SUN_HANG_W, potHeightOverride: 160 }
            : { baseWidthOverride: SUN_POT_W };
          return <PlantSlot key={slot.slotId} slot={slot} position={pt} onPress={handleSlotPress} onPestPress={handlePestPress} {...hangingSize} />;
        })}

        <WateringCan
          position={canPos}
          plantedSnapPoints={plantedPottedPoints}
          onWater={handleWater}
          onDragStart={() => { canDragging.current = true; }}
          onDragEnd={() => { canDragging.current = false; }}
          baseCanSize={SUN_CAN}
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
  nurseryBtn: { position: 'absolute', top: 10, right: 14, width: 52, height: 52, zIndex: 20 },
  nurseryImg: { width: 52, height: 52 },
  inventoryBtn: { position: 'absolute', top: 10, left: 14, width: 52, height: 52, zIndex: 20 },
  inventoryImg: { width: 52, height: 52 },
});
