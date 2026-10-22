import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder } from 'react-native';

// Page-turning for the garden journal. The book is a row of spreads; you flip with
// the arrows under the left page, by swiping across the book, or from the
// contents page. A flip squashes the turning page towards the spine, swaps the
// spread at the edge-on moment, and opens the new one out again.
//   forward  = the right page turns (squashes to the spine, new spread opens out)
//   backward = the left page turns
export const BOOK_PAGES = [
  { key: 'contents', title: 'Contents' },
  { key: 'flowers', title: 'Flowers' },
  { key: 'rare', title: 'Rare Plants' },
  { key: 'bouquets', title: 'Bouquets' },
  { key: 'care', title: 'Care', spread: 0 },
  { key: 'care', title: 'Care', spread: 1 },
  { key: 'care', title: 'Care', spread: 2 },
  { key: 'care', title: 'Care', spread: 3 },
  { key: 'customers', title: 'Customers' },
  { key: 'pets', title: 'Pets' },
  { key: 'paintings', title: 'Paintings' },
];

// The chapters listed on the contents page → the spread each starts on.
export const CHAPTERS = [
  { key: 'flowers', title: 'Flowers' },
  { key: 'rare', title: 'Rare Plants' },
  { key: 'bouquets', title: 'Bouquets' },
  { key: 'care', title: 'Care Guide' },
  { key: 'customers', title: 'Customers' },
  { key: 'pets', title: 'Pets' },
  { key: 'paintings', title: 'Paintings' },
].map((c) => ({ ...c, page: BOOK_PAGES.findIndex((p) => p.key === c.key) }));

export const pageIndexFor = (key) => Math.max(0, BOOK_PAGES.findIndex((p) => p.key === key));

const TURN_MS = 240;
const BookContext = createContext(null);
export const useBook = () => useContext(BookContext);

export function BookProvider({ startKey = 'flowers', children }) {
  const [page, setPage] = useState(pageIndexFor(startKey));
  const [dir, setDir] = useState(1);
  const turn = useRef(new Animated.Value(0)).current; // 0 = flat, 1 = edge-on
  const busy = useRef(false);
  const pageRef = useRef(page);
  pageRef.current = page;

  const goTo = (to) => {
    const target = Math.max(0, Math.min(BOOK_PAGES.length - 1, to));
    if (busy.current || target === pageRef.current) return;
    busy.current = true;
    setDir(target > pageRef.current ? 1 : -1);
    Animated.timing(turn, { toValue: 1, duration: TURN_MS, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => {
      setPage(target);
      Animated.timing(turn, { toValue: 0, duration: TURN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => { busy.current = false; });
    });
  };
  const flip = (d) => goTo(pageRef.current + d);
  const flipRef = useRef(flip); flipRef.current = flip;

  // swipe across the book to turn (capture, so the pages' scroll views don't swallow it)
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50) flipRef.current(1);
      else if (g.dx > 50) flipRef.current(-1);
    },
  }), []);

  const value = { page, info: BOOK_PAGES[page], total: BOOK_PAGES.length, dir, turn, goTo, flip, panHandlers: pan.panHandlers };
  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}
