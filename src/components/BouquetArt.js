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
  { i: 0, x: 0.30, y: 0.30, rot: '-16deg' }, // left
  { i: 2, x: 0.70, y: 0.30, rot: '16deg' },  // right
  { i: 1, x: 0.50, y: 0.22, rot: '0deg' },   // middle
];


const WRAP_ASPECT = 1199 / 1312; // w/h of the wrapper PNGs
const WRAPS = { plain: 'bouquetempty', layered: 'bouquetmixed', fancy: 'bouquetfancy' };

// tier: 'plain' (mixed) | 'layered' (3 of a kind) | 'fancy' (secret recipe).
// Each tier is a fancier paper. The flowers sit IN FRONT, blooming out of the
// opening, with the wrapper below them.
export default function BouquetArt({ flowers = [], size = 120, tier = 'plain', fancy }) {
  const t = fancy ? 'fancy' : tier;
  const flowerSize = size * 0.40;
  const wrapW = size * WRAP_ASPECT;
  const left0 = (size - wrapW) / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Image source={UI_IMAGES[WRAPS[t] ?? WRAPS.plain]} style={{ position: 'absolute', left: left0, top: size * 0.08, width: wrapW, height: size * 0.92 }} resizeMode="contain" />
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
                borderColor: 'rgba(90,52,16,0.45)',
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
    </View>
  );
}
