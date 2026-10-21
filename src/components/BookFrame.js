import React from 'react';
import { View, Image, Text, TouchableOpacity, Animated, Platform, StyleSheet } from 'react-native';
import { BOOK_IMG } from '../engine/assets';
import { useLayout } from '../context/LayoutContext';
import { useBook } from './BookNav';

const PIXEL_FONT = 'PressStart2P';
// A swipe across the page would otherwise start selecting text on web (and cancel the turn).
const NO_SELECT = Platform.OS === 'web' ? { userSelect: 'none' } : null;

// The painted open book (assets/book/flowerbook.png) with two page areas to put
// content in. The image fills the game frame (slightly stretched, like the town
// screens) with a small margin, and each page area is a rectangle given as a
// fraction of the book image — measured so text stays inside the decorative border
// and clear of the corner flowers and leaves.
//   left / right: the content of each page
//   The page numbers and flip arrows sit in the strip at the bottom of the left page.
//   When a BookProvider is above, turning pages squashes the turning side (see BookNav).
const PAGES = {
  left:  { x0: 0.120, y0: 0.143, x1: 0.452, y1: 0.779 },
  right: { x0: 0.551, y0: 0.143, x1: 0.883, y1: 0.779 },
  pager: { x0: 0.192, y0: 0.809, x1: 0.376, y1: 0.859 },
};
const MARGIN = 0.02;

// Squash a page towards the spine: `edge` is the side the spine is on.
function turnStyle(w, scale, edge, shade) {
  const half = w / 2;
  const sign = edge === 'left' ? 1 : -1; // scale about the left edge (right page) or the right edge (left page)
  return {
    transform: [{ translateX: -sign * half }, { scaleX: scale }, { translateX: sign * half }],
  };
}

export default function BookFrame({ left, right }) {
  const { width: sw, height: sh } = useLayout();
  const book = useBook();
  const mx = sw * MARGIN, my = sh * MARGIN;
  const W = sw - 2 * mx, H = sh - 2 * my;
  const rect = (r) => ({
    position: 'absolute',
    left: mx + r.x0 * W, top: my + r.y0 * H,
    width: (r.x1 - r.x0) * W, height: (r.y1 - r.y0) * H,
  });
  const pageW = (PAGES.left.x1 - PAGES.left.x0) * W;

  // 1 → 0 while a page closes onto the spine, then back up as the next one opens
  const open = book ? book.turn.interpolate({ inputRange: [0, 1], outputRange: [1, 0.02] }) : 1;
  const leftScale = book && book.dir < 0 ? open : 1;
  const rightScale = book && book.dir > 0 ? open : 1;
  const shade = book ? book.turn.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }) : 0;

  return (
    <View style={[StyleSheet.absoluteFill, NO_SELECT]} pointerEvents="box-none" {...(book ? book.panHandlers : {})}>
      <Image source={BOOK_IMG} style={{ position: 'absolute', left: mx, top: my, width: W, height: H }} resizeMode="stretch" />
      <Animated.View style={[rect(PAGES.left), turnStyle(pageW, leftScale, 'right')]}>
        {left}
        {book && book.dir < 0 && <Animated.View pointerEvents="none" style={[styles.shade, { opacity: shade }]} />}
      </Animated.View>
      <Animated.View style={[rect(PAGES.right), turnStyle(pageW, rightScale, 'left')]}>
        {right}
        {book && book.dir > 0 && <Animated.View pointerEvents="none" style={[styles.shade, { opacity: shade }]} />}
      </Animated.View>
      {book && (
        <View style={[rect(PAGES.pager), styles.center, styles.pager]}>
          <TouchableOpacity disabled={book.page === 0} onPress={() => book.flip(-1)} style={[styles.arrowBtn, book.page === 0 && styles.off]}>
            <Text style={styles.arrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.pageNum}>{book.page + 1} / {book.total}</Text>
          <TouchableOpacity disabled={book.page === book.total - 1} onPress={() => book.flip(1)} style={[styles.arrowBtn, book.page === book.total - 1 && styles.off]}>
            <Text style={styles.arrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pager: { flexDirection: 'row', gap: 10 },
  arrowBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  off: { opacity: 0.25 },
  arrow: { fontFamily: PIXEL_FONT, color: '#7a3e1a', fontSize: 11 },
  pageNum: { fontFamily: PIXEL_FONT, color: '#8a6a40', fontSize: 7 },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#5a3410' },
});
