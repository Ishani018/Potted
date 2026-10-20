import React from 'react';
import { View, Image } from 'react-native';
import { TRADE_IMAGES, UI_IMAGES } from '../engine/assets';
import { TRADE_FLOWERS } from '../constants/gameData';

// A bouquet built from the flowers' own market art, fanned out inside a painted
// paper wrapper. While you're still picking it's the plain kraft wrap; once all
// 3 flowers are in it gets the bow (coral = regular, red + tag = secret recipe).
// flowers: array of flowerKeys or null.
// flowers[i] → spot in the fan. Listed in draw order: the middle flower is
// drawn last so it sits in front.
const FAN = [
  { i: 0, x: 0.31, y: 0.25, rot: '-18deg' }, // left
  { i: 2, x: 0.69, y: 0.25, rot: '18deg' },  // right
  { i: 1, x: 0.50, y: 0.17, rot: '0deg' },   // middle
];


const WRAP_ASPECT = 1199 / 1312; // w/h of the wrapper PNGs

export default function BouquetArt({ flowers = [], size = 120, fancy = false }) {
  const flowerSize = size * 0.42;
  const wrapW = size * WRAP_ASPECT;
  const left0 = (size - wrapW) / 2;
  const done = [0, 1, 2].every((i) => !!flowers[i]);
  const wrap = !done ? UI_IMAGES.bouquetempty : fancy ? UI_IMAGES.bouquetfancy : UI_IMAGES.bouquetmixed;

  return (
    <View style={{ width: size, height: size }}>
      {/* Flowers go behind the paper so their stems tuck into the wrap */}
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
      <Image source={wrap} style={{ position: 'absolute', left: left0, top: 0, width: wrapW, height: size }} resizeMode="contain" />
    </View>
  );
}
