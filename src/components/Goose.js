import React, { useEffect, useRef, useState } from 'react';
import { Image, View, PanResponder } from 'react-native';
import { GOOSE, GOOSE_HONK, GOOSE_PICKUP } from '../engine/assets';
import { playSfx } from '../engine/audio';

// A goose that wanders the floor. Everything is in the scene picture's own pixels; `k` converts to screen pixels.
//   bounds   the patch of floor it may roam: { x0, x1, y0, y1 } (y is where its feet are)
//   imgH     the scene picture's height in its own pixels (sets the goose's size unless `base` is given)
//   zOf(y)   stacking order at a given foot position (so it passes behind or in front of furniture)
//   disabled stops it reacting to touch;  onHold(true/false) tells a scrolling parent to stand still while it is carried.
// Tap it and it runs away. Pick it up (drag) and it honks loudly; let go and it drops where you left it.
const TICK = 80;           // ms per animation step: every step is a new walking frame
const STRIDE = 0.032;      // distance per frame as a share of the goose's width, a little less than its legs cover, so it never skates
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const IDLES = [['front', 3], ['stand', 2], ['peck', 3], ['preen', 2], ['wings', 1], ['sleep', 0.7], ['honk', 0.6]];
function pickIdle() {
  const total = IDLES.reduce((n, [, w]) => n + w, 0); let r = Math.random() * total;
  for (const [name, w] of IDLES) { r -= w; if (r <= 0) return name; }
  return 'front';
}

export default function Goose({ k, bounds, imgH = 941, base, zOf, disabled, onHold }) {
  const size = base ?? imgH * 0.00066;
  const g = useRef({ x: bounds.x0, y: (bounds.y0 + bounds.y1) / 2, tx: 0, ty: 0, mode: 'idle', pose: 'front', until: 0, frame: 0, dir: 1, vert: 0, mul: 1, held: false });
  const b = useRef(bounds); b.current = bounds;
  const live = useRef({ k, disabled, onHold }); live.current = { k, disabled, onHold };
  const [, tick] = useState(0);

  const honk = (gain) => { playSfx(GOOSE_HONK, gain, { goose: true }); };
  const rest = (now, pose) => {
    const s = g.current; s.mode = 'idle'; s.pose = pose; s.frame = 0; s.mul = 1;
    s.until = now + (pose === 'sleep' ? rand(6000, 9000) : pose === 'honk' ? 1500 : rand(1800, 4200));
    if (pose === 'honk') honk(0.7);
  };
  const wander = (mul = 1, far = false) => {
    const s = g.current, bd = b.current;
    s.mode = 'walk'; s.mul = mul; s.frame = 0;
    s.tx = far ? (s.x - bd.x0 > (bd.x1 - bd.x0) / 2 ? rand(bd.x0, bd.x0 + 150) : rand(bd.x1 - 150, bd.x1)) : rand(bd.x0, bd.x1);
    s.ty = rand(bd.y0, bd.y1);
  };

  // the goose starts at the door end and follows you in
  useEffect(() => {
    g.current.until = Date.now() + 500;
    const iv = setInterval(() => {
      const s = g.current, now = Date.now(), bd = b.current;
      if (s.held) { s.frame += 1; tick((n) => n + 1); return; }
      // the scene may have moved the floor under it (another storey): bring it along
      if (s.y < bd.y0 - 40 || s.y > bd.y1 + 40) { s.y = clamp(s.y, bd.y0, bd.y1) + (s.y < bd.y0 ? 0 : 0); s.y = (bd.y0 + bd.y1) / 2; s.x = clamp(s.x, bd.x0, bd.x1); }
      if (s.mode === 'walk') {
        const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), sp = (GOOSE[1].w * size * STRIDE) * s.mul * (0.8 + 0.4 * clamp((s.y - bd.y0) / Math.max(1, bd.y1 - bd.y0), 0, 1));
        if (d <= sp) { rest(now, s.mul > 1 ? 'front' : pickIdle()); }
        else {
          s.x += (dx / d) * sp; s.y += (dy / d) * sp * 0.75;
          if (Math.abs(dx) > 8) s.dir = dx > 0 ? 1 : -1;
          s.vert = Math.abs(dx) < Math.abs(dy) * 0.6 && dy < 0 ? -1 : 0;   // heading away from us
          s.frame = (s.frame + 1) % 9;
        }
      } else {
        s.frame += 1;
        if (now > s.until) { if (Math.random() < 0.8) wander(); else rest(now, pickIdle()); }
      }
      tick((n) => n + 1);
    }, TICK);
    return () => clearInterval(iv);
  }, []);

  const start = useRef({ x: 0, y: 0 });
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !live.current.disabled,
    onMoveShouldSetPanResponder: () => !live.current.disabled,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { const s = g.current; start.current = { x: s.x, y: s.y }; },
    onPanResponderMove: (_, gs) => {
      const s = g.current, bd = b.current, kk = live.current.k;
      if (!s.held && Math.hypot(gs.dx, gs.dy) > 8) {                       // picked up!
        s.held = true; s.mode = 'idle'; s.pose = 'held'; live.current.onHold && live.current.onHold(true);
        playSfx(GOOSE_PICKUP, 1, { goose: true });
      }
      if (s.held) {
        s.x = clamp(start.current.x + gs.dx / kk, bd.x0 - 80, bd.x1 + 80);
        s.y = clamp(start.current.y + gs.dy / kk, bd.y0 - 160, bd.y1 + 60);
        if (Math.abs(gs.dx) > 6) s.dir = gs.dx > 0 ? 1 : -1;
      }
    },
    onPanResponderRelease: () => {
      const s = g.current, bd = b.current, now = Date.now();
      if (s.held) {                                                         // put down where it was let go
        s.held = false; live.current.onHold && live.current.onHold(false);
        s.x = clamp(s.x, bd.x0, bd.x1); s.y = clamp(s.y, bd.y0, bd.y1);
        rest(now, 'wings'); s.until = now + 1400;
      } else wander(3, true);                                               // a tap sends it running
    },
    onPanResponderTerminate: () => { const s = g.current; if (s.held) { s.held = false; live.current.onHold && live.current.onHold(false); rest(Date.now(), 'front'); } },
  })).current;

  const s = g.current;
  let n, flip = false, lift = 0;
  if (s.held) { n = s.frame % 4 < 2 ? 24 : 23; flip = s.dir < 0; lift = 22; }
  else if (s.mode === 'walk') n = s.vert < 0 ? 28 + s.frame : (s.dir > 0 ? 1 : 10) + s.frame;
  else {
    flip = s.dir < 0;
    if (s.pose === 'front') { n = 19; flip = false; }
    else if (s.pose === 'stand') n = s.frame % 30 < 15 ? 20 : 21;
    else if (s.pose === 'peck') n = s.frame % 8 < 4 ? 25 : 20;
    else if (s.pose === 'preen') n = 27;
    else if (s.pose === 'sleep') n = 26;
    else if (s.pose === 'wings') n = s.frame % 6 < 3 ? 24 : 23;
    else n = s.frame % 10 < 6 ? 22 : 23;   // honk
  }
  const f = GOOSE[n];
  const bd = bounds;
  const depth = 0.8 + 0.4 * clamp((s.y - bd.y0) / Math.max(1, bd.y1 - bd.y0), 0, 1);   // nearer = bigger
  const w = f.w * size * depth * k, h = f.h * size * depth * k;

  return (
    <View {...pan.panHandlers} style={{ position: 'absolute', left: s.x * k - w / 2, top: (s.y - lift) * k - h, width: w, height: h, zIndex: s.held ? 900 : zOf ? zOf(s.y) : 6 + Math.round(s.y / 10) }}>
      <Image source={f.src} resizeMode="contain" pointerEvents="none" style={{ width: w, height: h, transform: flip ? [{ scaleX: -1 }] : undefined }} />
    </View>
  );
}
