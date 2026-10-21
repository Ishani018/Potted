import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { BOOK_IMG } from '../engine/assets';
import { useLayout } from '../context/LayoutContext';

// The painted open book (assets/book/flowerbook.png) with two page areas to put
// content in. The image fills the game frame (slightly stretched, like the town
// screens) with a small margin, and each page area is a rectangle given as a
// fraction of the book image — measured so text stays inside the decorative border
// and clear of the corner flowers and leaves.
//   left / right: the content of each page
//   pager (optional): a small strip at the bottom of the left page, between the corner flowers
const PAGES = {
  left:  { x0: 0.120, y0: 0.143, x1: 0.452, y1: 0.779 },
  right: { x0: 0.551, y0: 0.143, x1: 0.883, y1: 0.779 },
  pager: { x0: 0.192, y0: 0.809, x1: 0.376, y1: 0.859 },
};
const MARGIN = 0.02;

export default function BookFrame({ left, right, pager }) {
  const { width: sw, height: sh } = useLayout();
  const mx = sw * MARGIN, my = sh * MARGIN;
  const W = sw - 2 * mx, H = sh - 2 * my;
  const rect = (r) => ({
    position: 'absolute',
    left: mx + r.x0 * W, top: my + r.y0 * H,
    width: (r.x1 - r.x0) * W, height: (r.y1 - r.y0) * H,
  });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Image source={BOOK_IMG} style={{ position: 'absolute', left: mx, top: my, width: W, height: H }} resizeMode="stretch" />
      <View style={rect(PAGES.left)}>{left}</View>
      <View style={rect(PAGES.right)}>{right}</View>
      {pager ? <View style={[rect(PAGES.pager), styles.center]}>{pager}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
