import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';
import { PET_IMAGES } from '../engine/assets';
import { PET_POSITIONS, PET_BASE } from '../constants/gameData';

// Renders every owned pet the player has PLACED in this room, at its Plopper
// position (PET_POSITIONS[room][petKey] in 1376×768 base px, center anchor).
// sw/sh = the room's measured container size; positions map by fraction so they
// match the layout authored in Plopper.
// TEMP: set true to show ALL owned pets in every room (ignore placement) for
// verifying Plopper layouts. Revert to false before release.
const DEBUG_SHOW_ALL = false;

// onPetPress(petKey) (optional): tapping a pet, e.g. to show what it does.
export default function RoomPets({ room, sw, sh, onPetPress }) {
  const { state } = useGame();
  const { ownedPets = [], petPlacements = {} } = state.player;
  const spots = PET_POSITIONS[room] ?? {};

  return (
    <>
      {ownedPets.map((petKey) => {
        if (!DEBUG_SHOW_ALL && petPlacements[petKey] !== room) return null;
        const p = spots[petKey];
        const img = PET_IMAGES[petKey];
        if (!p || !img) return null;
        const cx = (p.x / PET_BASE.w) * sw;
        const cy = (p.y / PET_BASE.h) * sh;
        const w = (p.w / PET_BASE.w) * sw;
        const h = (p.h / PET_BASE.h) * sh;
        const style = {
          position: 'absolute',
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          zIndex: 6 + (p.z ?? 0),  // above bg/plants; relative order from Plopper
        };
        const flip = p.flip ? [{ scaleX: -1 }] : undefined;
        if (!onPetPress) {
          return <Image key={petKey} source={img} style={{ ...style, transform: flip }} resizeMode="contain" />;
        }
        return (
          <TouchableOpacity key={petKey} style={style} activeOpacity={0.85} onPress={() => onPetPress(petKey)}>
            <Image source={img} style={{ width: w, height: h, transform: flip }} resizeMode="contain" />
          </TouchableOpacity>
        );
      })}
    </>
  );
}
