import React from 'react';
import { View, Image, Text, TouchableOpacity, Animated, Platform, StyleSheet } from 'react-native';
import { BOOK_IMG, SET_UI } from '../engine/assets';
import { useLayout } from '../context/LayoutContext';
import { useBook } from './BookNav';

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

// Turn a page about the spine like a real leaf: it swings (rotateY, with perspective) from flat to edge-on,
// the spread changes at that moment, and the new page swings open again. `edge` is the side the spine is on.
function turnStyle(w, angle, edge) {
  const half = w / 2;
  const sign = edge === 'left' ? 1 : -1;      // the right page hinges on its left edge, the left page on its right edge
  return {
    transform: [{ perspective: 1100 }, { translateX: -sign * half }, { rotateY: angle }, { translateX: sign * half }],
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
  const swingL = book ? book.turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '88deg'] }) : '0deg';
  const swingR = book ? book.turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-88deg'] }) : '0deg';
  const leftScale = book && book.dir < 0 ? swingL : '0deg';
  const rightScale = book && book.dir > 0 ? swingR : '0deg';
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
      {/* page arrows: the painted arrow buttons on either side of the book */}
      {book && (
        <>
          <TouchableOpacity accessibilityLabel="Previous page" disabled={book.page === 0} onPress={() => book.flip(-1)} activeOpacity={0.8}
            style={[styles.arrow, { left: mx + 0.018 * W, top: my + 0.47 * H }, book.page === 0 && styles.off]}>
            <Image source={SET_UI.left.src} style={{ width: 48, height: 48 * SET_UI.left.h / SET_UI.left.w }} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Next page" disabled={book.page === book.total - 1} onPress={() => book.flip(1)} activeOpacity={0.8}
            style={[styles.arrow, { right: mx + 0.018 * W, top: my + 0.47 * H }, book.page === book.total - 1 && styles.off]}>
            <Image source={SET_UI.right.src} style={{ width: 48, height: 48 * SET_UI.right.h / SET_UI.right.w }} resizeMode="contain" />
          </TouchableOpacity>
        </>
      )}
      {book && (
        <View style={[rect(PAGES.pager), styles.center, styles.pager]}>
          <Text style={styles.pageNum}>{book.page + 1} / {book.total}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pager: { flexDirection: 'row', gap: 10 },
  arrowBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  arrow: { position: 'absolute', zIndex: 20 },
  off: { opacity: 0.25 },
  arrowImg: { width: 44, height: 38 },
  pageNum: { fontFamily: Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' }), color: '#7a5030', fontSize: 14 },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#5a3410' },
});
