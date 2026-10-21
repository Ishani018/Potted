import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';
import { PET_IMAGES } from '../engine/assets';
import PetSprite from './PetSprite';
import { PET_POSITIONS, PET_BASE, STRAYS } from '../constants/gameData';

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

  // Strays have no hand-laid spot yet: they take the spot of a shop pet you don't have
  // out in this room, standing on its feet line.
  const shown = (k) => ownedPets.includes(k) && !state.player.adventures?.[k] && (petPlacements[k] === room || petPlacements[k] === 'all');
  const free = Object.keys(spots).filter((k) => !shown(k) && !STRAYS[k]);
  const strayCount = {};
  const spotFor = (petKey) => {
    if (spots[petKey]) return spots[petKey];
    if (!STRAYS[petKey]) return null;
    const idx = (strayCount.n = (strayCount.n ?? -1) + 1);
    const base = spots[free[idx % Math.max(1, free.length)]];
    if (!base) return null;
    const w = base.w * 0.85;
    return { x: base.x, y: base.y + base.h / 2 - (w / STRAYS[petKey].aspect) / 2, w, h: w / STRAYS[petKey].aspect, flip: base.flip, z: base.z };
  };

  return (
    <>
      {ownedPets.map((petKey) => {
        if (!DEBUG_SHOW_ALL && petPlacements[petKey] !== room && petPlacements[petKey] !== 'all') return null;
        if (state.player.adventures?.[petKey]) return null; // out exploring
        const p = spotFor(petKey);
        const img = PET_IMAGES[petKey];
        if (!p || !img) return null;
        const cx = (p.x / PET_BASE.w) * sw;
        const cy = (p.y / PET_BASE.h) * sh;
        const w = (p.w / PET_BASE.w) * sw;
        const h = (p.h / PET_BASE.h) * sh;
        const box = { position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, zIndex: 6 + (p.z ?? 0) };
        if (!onPetPress) {
          return (
            <View key={petKey} pointerEvents="none" style={box}>
              <PetSprite petKey={petKey} w={w} h={h} flip={p.flip} />
            </View>
          );
        }
        return (
          <TouchableOpacity key={petKey} style={box} activeOpacity={0.85} onPress={() => onPetPress(petKey)}>
            <PetSprite petKey={petKey} w={w} h={h} flip={p.flip} />
          </TouchableOpacity>
        );
      })}
    </>
  );
}
