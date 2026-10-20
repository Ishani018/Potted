import React from 'react';
import { View, Image } from 'react-native';
import { TRADE_IMAGES } from '../engine/assets';
import { TRADE_FLOWERS } from '../constants/gameData';

// A bouquet built from the flowers' own market art: up to 3 flowers fanned out
// above a kraft-paper wrap with a ribbon (wrap/ribbon drawn with Views — swap in
// an image later if you want a painted wrap). flowers: array of flowerKeys or null.
// flowers[i] → spot in the fan. Listed in draw order: the middle flower is
// drawn last so it sits in front.
const FAN = [
  { i: 0, x: 0.29, y: 0.30, rot: '-20deg' }, // left
  { i: 2, x: 0.71, y: 0.30, rot: '20deg' },  // right
  { i: 1, x: 0.50, y: 0.20, rot: '0deg' },   // middle
];

const KRAFT = '#d9b98a';
const KRAFT_DARK = '#b8925a';
const RIBBON = '#e8708a';

export default function BouquetArt({ flowers = [], size = 120 }) {
  const flowerSize = size * 0.44;
  const coneW = size * 0.62;
  const coneH = size * 0.5;
  const coneLeft = (size - coneW) / 2;
  const coneTop = size * 0.44;

  return (
    <View style={{ width: size, height: size }}>
      {FAN.map((slot) => {
        const fi = slot.i;
        const key = flowers[fi];
        const left = size * slot.x - flowerSize / 2;
        const top = size * slot.y - flowerSize / 2;
        if (!key) {
          return (
            <View
              key={fi}
              style={{
                position: 'absolute', left, top, width: flowerSize, height: flowerSize,
                borderRadius: flowerSize / 2, borderWidth: 2, borderStyle: 'dashed',
                borderColor: 'rgba(200,135,58,0.6)',
              }}
            />
          );
        }
        const img = TRADE_IMAGES[TRADE_FLOWERS[key]?.img];
        return (
          <Image
            key={fi}
            source={img}
            style={{ position: 'absolute', left, top, width: flowerSize, height: flowerSize, transform: [{ rotate: slot.rot }] }}
            resizeMode="contain"
          />
        );
      })}

      {/* Paper cone: back fold, then front */}
      <View style={{
        position: 'absolute', left: coneLeft, top: coneTop, width: 0, height: 0,
        borderLeftWidth: coneW / 2, borderRightWidth: coneW / 2, borderTopWidth: coneH,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: KRAFT_DARK,
      }} />
      <View style={{
        position: 'absolute', left: coneLeft + coneW * 0.08, top: coneTop + coneH * 0.06, width: 0, height: 0,
        borderLeftWidth: coneW * 0.42, borderRightWidth: coneW * 0.42, borderTopWidth: coneH * 0.9,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: KRAFT,
      }} />

      {/* Ribbon + bow */}
      <View style={{
        position: 'absolute', left: size * 0.39, top: coneTop + coneH * 0.42,
        width: size * 0.22, height: size * 0.06, borderRadius: size * 0.03, backgroundColor: RIBBON,
      }} />
      <View style={{
        position: 'absolute', left: size * 0.36, top: coneTop + coneH * 0.36,
        width: size * 0.12, height: size * 0.09, borderRadius: size * 0.05,
        borderWidth: 2, borderColor: RIBBON, transform: [{ rotate: '-25deg' }],
      }} />
      <View style={{
        position: 'absolute', left: size * 0.52, top: coneTop + coneH * 0.36,
        width: size * 0.12, height: size * 0.09, borderRadius: size * 0.05,
        borderWidth: 2, borderColor: RIBBON, transform: [{ rotate: '25deg' }],
      }} />
    </View>
  );
}
