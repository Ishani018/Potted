import React from 'react';
import { Image } from 'react-native';
import { useGame } from '../context/GameContext';
import { PET_IMAGES } from '../engine/assets';
import { PET_POSITIONS, PET_BASE_W } from '../constants/gameData';

// Renders every owned pet that the player has placed in THIS room, at its
// pre-determined spot (PET_POSITIONS[room][petKey]). Position x/y are fractions
// of screen; the sprite is anchored bottom-center so pets "stand" on the spot.
export default function RoomPets({ room, sw, sh }) {
  const { state } = useGame();
  const { ownedPets = [], petPlacements = {} } = state.player;
  const spots = PET_POSITIONS[room] ?? {};

  return (
    <>
      {ownedPets.map((petKey) => {
        if (petPlacements[petKey] !== room) return null;
        const pos = spots[petKey];
        const img = PET_IMAGES[petKey];
        if (!pos || !img) return null;
        const w = Math.round(sw * PET_BASE_W);
        const h = w; // sprites are roughly square
        return (
          <Image
            key={petKey}
            source={img}
            style={{
              position: 'absolute',
              left: sw * pos.x - w / 2,
              top: sh * pos.y - h,        // bottom-center anchor
              width: w,
              height: h,
              zIndex: 7,
            }}
            resizeMode="contain"
          />
        );
      })}
    </>
  );
}
