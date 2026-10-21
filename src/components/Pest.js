import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, PanResponder, Platform, StyleSheet, View } from 'react-native';
import { PEST_IMAGES } from '../engine/pestImages';
import { pestInfo } from '../constants/gameData';
import { PixelText } from './Pixel';

// A bug on a plant. Each kind is cleared with its own little action:
//   aphid       RUB   scrub it off by swiping back and forth over it
//   caterpillar HOLD  press and hold until it's lifted off
//   snail       DRAG  pull it away from the plant, then let go
//   moth        CATCH tap it 3 times — it flutters to a new spot after each tap
//   ladybug     TAP   one tap sends it off
// (gameData PEST_INFO). When it's gone the bug pops away and onClear() fires,
// which is what pays the coins/XP. cx/cy = centre inside the plant's box, size = width.

const DRAG_FAR = 1.0;       // snail: pull this many widths away to count
const RUB_TOTAL = 3.2;      // aphid: this many widths of scrubbing
const HOLD_MS = 900;        // caterpillar
const CATCHES = 3;          // moth
const TAP_SLOP = 14;        // px of finger travel that still counts as a tap

// Web: no focus/selection box, no browser image-drag, no touch scrolling while dragging.
const WEB_STYLE = Platform.OS === 'web'
  ? { cursor: 'pointer', userSelect: 'none', touchAction: 'none', outlineStyle: 'none', outlineWidth: 0 }
  : null;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const N = false; // useNativeDriver — these values are also set by gestures, so keep them on JS

export default function Pest({ type, size, cx, cy, onClear }) {
  const info = pestInfo(type);
  const action = info.action;
  const w = size;
  const h = size * info.aspect;

  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;      // degrees
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const idle = useRef(new Animated.Value(0)).current;     // 0..1 bobbing
  const prog = useRef(new Animated.Value(0)).current;     // 0..1 progress bar (+ hold lift)
  const [far, setFar] = useState(false);                   // snail: pulled far enough

  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;
  const st = useRef({ done: false, path: 0, lastDx: 0, lastDy: 0, taps: 0, far: false, hold: null }).current;

  // Gentle idle motion (moths flutter a bit faster).
  useEffect(() => {
    const ms = action === 'catch' ? 420 : 1100;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(idle, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: N }),
      Animated.timing(idle, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: N }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [action]);

  const finish = (drift) => {
    if (st.done) return;
    st.done = true;
    const anims = [
      Animated.timing(scale, { toValue: 0.25, duration: 220, useNativeDriver: N }),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: N }),
    ];
    if (drift) {
      anims.push(Animated.timing(tx, { toValue: drift.dx, duration: 220, useNativeDriver: N }));
      anims.push(Animated.timing(ty, { toValue: drift.dy, duration: 220, useNativeDriver: N }));
    } else {
      anims.push(Animated.timing(ty, { toValue: -h * 0.6, duration: 220, useNativeDriver: N }));
    }
    Animated.parallel(anims).start(() => onClearRef.current && onClearRef.current());
  };

  const springBack = () => {
    Animated.parallel([
      Animated.spring(tx, { toValue: 0, friction: 6, useNativeDriver: N }),
      Animated.spring(ty, { toValue: 0, friction: 6, useNativeDriver: N }),
      Animated.spring(rot, { toValue: 0, friction: 6, useNativeDriver: N }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: N }),
    ]).start();
  };

  const cancelHold = () => {
    if (st.hold) { st.hold.stop(); st.hold = null; }
    if (!st.done) Animated.timing(prog, { toValue: 0, duration: 160, useNativeDriver: N }).start();
  };

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !st.done,
    onMoveShouldSetPanResponder: () => !st.done,
    onPanResponderTerminationRequest: () => false,

    onPanResponderGrant: () => {
      st.lastDx = 0; st.lastDy = 0;
      if (action === 'drag') Animated.timing(scale, { toValue: 1.08, duration: 90, useNativeDriver: N }).start();
      if (action === 'hold') {
        prog.stopAnimation();
        prog.setValue(0);
        st.hold = Animated.timing(prog, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: N });
        st.hold.start(({ finished }) => { if (finished) { st.hold = null; finish(); } });
      }
    },

    onPanResponderMove: (_, g) => {
      if (st.done) return;
      if (action === 'rub') {
        st.path += Math.hypot(g.dx - st.lastDx, g.dy - st.lastDy);
        st.lastDx = g.dx; st.lastDy = g.dy;
        tx.setValue(clamp(g.dx * 0.4, -w * 0.15, w * 0.15));
        rot.setValue(clamp(g.dx * 0.15, -12, 12));
        const p = Math.min(1, st.path / (w * RUB_TOTAL));
        prog.setValue(p);
        if (p >= 1) finish();
      } else if (action === 'drag') {
        tx.setValue(g.dx);
        ty.setValue(g.dy);
        const isFar = Math.hypot(g.dx, g.dy) >= w * DRAG_FAR;
        if (isFar !== st.far) { st.far = isFar; setFar(isFar); }
      } else if (action === 'hold') {
        if (Math.hypot(g.dx, g.dy) > w * 0.7 && st.hold) cancelHold(); // wandered off it
      }
    },

    onPanResponderRelease: (_, g) => {
      if (st.done) return;
      const moved = Math.hypot(g.dx, g.dy);
      if (action === 'tap') {
        if (moved < TAP_SLOP) finish();
      } else if (action === 'rub') {
        Animated.parallel([
          Animated.spring(tx, { toValue: 0, friction: 6, useNativeDriver: N }),
          Animated.spring(rot, { toValue: 0, friction: 6, useNativeDriver: N }),
        ]).start();
      } else if (action === 'drag') {
        if (moved >= w * DRAG_FAR) finish({ dx: g.dx * 2, dy: g.dy * 2 });
        else { st.far = false; setFar(false); springBack(); }
      } else if (action === 'hold') {
        cancelHold();
      } else if (action === 'catch') {
        if (moved >= TAP_SLOP) return;
        st.taps += 1;
        Animated.timing(prog, { toValue: st.taps / CATCHES, duration: 140, useNativeDriver: N }).start();
        if (st.taps >= CATCHES) { finish(); return; }
        // flutter to a new spot near the plant
        const nx = (Math.random() - 0.5) * w * 0.9;
        const ny = (Math.random() - 0.5) * h * 0.9;
        Animated.parallel([
          Animated.timing(tx, { toValue: nx, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: N }),
          Animated.timing(ty, { toValue: ny, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: N }),
          Animated.sequence([
            Animated.timing(rot, { toValue: nx > 0 ? 18 : -18, duration: 120, useNativeDriver: N }),
            Animated.timing(rot, { toValue: 0, duration: 120, useNativeDriver: N }),
          ]),
        ]).start();
      }
    },

    onPanResponderTerminate: () => {
      if (st.done) return;
      if (action === 'hold') cancelHold();
      if (action === 'drag' || action === 'rub') springBack();
    },
  }), [type, size]);

  const bob = idle.interpolate({ inputRange: [0, 1], outputRange: [0, -h * (action === 'catch' ? 0.1 : 0.04)] });
  const flap = idle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', action === 'catch' ? '5deg' : '0deg'] });
  const rotDeg = rot.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });
  const lift = prog.interpolate({ inputRange: [0, 1], outputRange: [0, action === 'hold' ? -h * 0.3 : 0] });
  const grow = prog.interpolate({ inputRange: [0, 1], outputRange: [1, action === 'hold' ? 1.15 : 1] });
  const showBar = action === 'rub' || action === 'hold' || action === 'catch';
  const hint = action === 'drag' && far ? 'LET GO!' : info.hint;
  const hintSize = Math.max(6, Math.round(w * 0.2));

  return (
    <Animated.View
      {...responder.panHandlers}
      testID={`pest-${type}`}
      focusable={false}
      style={[
        styles.root,
        WEB_STYLE,
        { left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity },
        {
          transform: [
            { translateX: tx },
            { translateY: Animated.add(Animated.add(ty, bob), lift) },
            { rotate: rotDeg },
            { rotate: flap },
            { scale: Animated.multiply(scale, grow) },
          ],
        },
      ]}
    >
      <Image source={PEST_IMAGES[type] ?? PEST_IMAGES.ladybug} style={{ width: w, height: h }} resizeMode="contain" draggable={false} />

      {/* what to do, and how far along you are */}
      <View style={[styles.hintWrap, { top: h + 1 }]}>
        <PixelText size={hintSize} color="#fff">{hint}</PixelText>
        {showBar && (
          <View style={[styles.bar, { width: w * 0.8 }]}>
            <Animated.View style={[styles.fill, { width: prog.interpolate({ inputRange: [0, 1], outputRange: [0, w * 0.8] }) }]} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', zIndex: 12 },
  hintWrap: { position: 'absolute', left: -20, right: -20, alignItems: 'center', gap: 2, pointerEvents: 'none' },
  bar: { height: 4, backgroundColor: 'rgba(42,22,8,0.75)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#7ad05a' },
});
