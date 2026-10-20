import React from 'react';
import { View, Image } from 'react-native';

// Draws a pixel-art box from a small PNG: the four corners stay crisp at their
// native size, the edges and middle stretch. `src` = image, `sw`/`sh` = its pixel
// size, `inset` = corner size in image px. Children render on top, inside.
export default function NineSlice({ src, sw, sh, inset, width, height, scale = 1, style, children, pointerEvents }) {
  const c = inset * scale;                       // corner size on screen
  const W = width, H = height;
  const midW = Math.max(0, W - 2 * c), midH = Math.max(0, H - 2 * c);
  const srcMidW = sw - 2 * inset, srcMidH = sh - 2 * inset;
  const mx = midW / srcMidW, my = midH / srcMidH;   // stretch factors for the middle

  // [target x, y, w, h], [x scale, y scale], source origin (image px)
  const cols = [
    { x: 0, w: c, k: scale, o: 0 },
    { x: c, w: midW, k: mx, o: inset },
    { x: c + midW, w: c, k: scale, o: sw - inset },
  ];
  const rows = [
    { y: 0, h: c, k: scale, o: 0 },
    { y: c, h: midH, k: my, o: inset },
    { y: c + midH, h: c, k: scale, o: sh - inset },
  ];

  return (
    <View style={[{ width: W, height: H }, style]} pointerEvents={pointerEvents}>
      {rows.map((r, ri) => cols.map((cl, ci) => (
        <View key={`${ri}${ci}`} pointerEvents="none" style={{ position: 'absolute', left: cl.x, top: r.y, width: cl.w, height: r.h, overflow: 'hidden' }}>
          <Image
            source={src}
            style={{ position: 'absolute', left: -cl.o * cl.k, top: -r.o * r.k, width: sw * cl.k, height: sh * r.k }}
            resizeMode="stretch"
          />
        </View>
      )))}
      {children}
    </View>
  );
}

// A box whose size comes from its children; the painted frame is drawn behind.
export function Skinned({ src, sw, sh, inset, scale = 0.5, style, children, onPress, disabled }) {
  const [sz, setSz] = React.useState({ w: 0, h: 0 });
  const inner = (
    <View style={style} onLayout={(e) => setSz({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {sz.w > 0 && (
        <NineSlice src={src} sw={sw} sh={sh} inset={inset} scale={scale} width={sz.w} height={sz.h} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none" />
      )}
      {children}
    </View>
  );
  if (!onPress) return inner;
  const { TouchableOpacity } = require('react-native');
  return <TouchableOpacity activeOpacity={0.85} onPress={disabled ? undefined : onPress} style={{ opacity: disabled ? 0.55 : 1 }}>{inner}</TouchableOpacity>;
}
