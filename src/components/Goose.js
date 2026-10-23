import React, { useEffect, useRef, useState } from 'react';
import { Image, View, PanResponder } from 'react-native';
import { GOOSE, GOOSE2, GOOSE_HONK, GOOSE_PICKUP } from '../engine/assets';
import { playSfx } from '../engine/audio';

// A goose that wanders the floor. Everything is in the scene picture's own pixels; `k` converts to screen pixels.
//   bounds   the patch of floor it may roam: { x0, x1, y0, y1 } (y is where its feet are)
//   imgH     the scene picture's height in its own pixels (sets the goose's size unless `base` is given)
//   zOf(y)   stacking order at a given foot position (so it passes behind or in front of furniture)
//   disabled stops it reacting to touch;  onHold(true/false) tells a scrolling parent to stand still while it is carried.
// Tap it and it runs away. Pick it up (drag) and it honks loudly; let go and it drops where you left it.
const TICK = 33;           // ms per update (about 30 a second): the goose glides smoothly
const FRAME_EVERY = 2;     // a new walking frame every 2 updates (about 15 a second), so each leg position is held a moment
const STRIDE = 0.032;      // distance per frame as a share of the goose's width, a little less than its legs cover, so it never skates
const AWAY = [28, 29, 30, 31, 32, 33, 34, 35, 36];   // first sheet: walking away from us (the second sheet has no such frames)
const FRAMES2 = Object.keys(GOOSE2).map(Number);
const away = (i) => 100 + i;                         // key for a first-sheet frame in the combined list
const frameOf = (n) => (n >= 100 ? GOOSE[n - 100] : GOOSE2[n]);
const FRAME_KEYS = [...FRAMES2, ...AWAY.map(away)];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const IDLES = [['front', 3], ['stand', 2], ['peck', 3], ['preen', 2], ['wings', 1], ['sleep', 0.7], ['honk', 0.6]];
function pickIdle() {
  const total = IDLES.reduce((n, [, w]) => n + w, 0); let r = Math.random() * total;
  for (const [name, w] of IDLES) { r -= w; if (r <= 0) return name; }
  return 'front';
}

// one frame's picture; memoised so a step only re-renders the frame being hidden and the one being shown
const FrameImg = React.memo(function FrameImg({ src, w, h, show, flip }) {
  return <Image source={src} resizeMode="contain" pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: show ? 1 : 0, transform: flip ? [{ scaleX: -1 }] : undefined }} />;
});

function WanderGoose({ k, bounds, imgH = 941, base, zOf, disabled, onHold, audibleAt }) {
  const size = (base ?? imgH * 0.00066) * 1.25;   // the second sheet draws the goose smaller
  const g = useRef({ x: bounds.x0, y: (bounds.y0 + bounds.y1) / 2, tx: 0, ty: 0, mode: 'idle', pose: 'front', until: 0, frame: 0, dir: 1, vert: 0, mul: 1, held: false });
  const b = useRef(bounds); b.current = bounds;
  const live = useRef({ k, disabled, onHold, audibleAt }); live.current = { k, disabled, onHold, audibleAt };
  const [, tick] = useState(0);

  // its own honks are only heard while the goose is actually in view (audibleAt tells us, for scrolling rooms)
  const honk = (gain) => { const a = live.current.audibleAt; if (a && !a(g.current.x)) return; playSfx(GOOSE_HONK, gain, { goose: true }); };
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
      if (s.held) { s.sub = (s.sub || 0) + 1; if (s.sub >= 3) { s.sub = 0; s.frame += 1; } tick((n) => n + 1); return; }
      // the scene may have moved the floor under it (another storey): put it on the new floor, standing still
      if (s.y < bd.y0 - 40 || s.y > bd.y1 + 40) { s.y = (bd.y0 + bd.y1) / 2; s.x = clamp(s.x, bd.x0, bd.x1); s.mode = 'idle'; s.pose = 'front'; s.until = now + 600; }
      s.tx = clamp(s.tx, bd.x0, bd.x1); s.ty = clamp(s.ty, bd.y0, bd.y1);
      if (s.mode === 'walk') {
        const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), sp = (GOOSE2[1].w * size * STRIDE / FRAME_EVERY) * s.mul * (0.8 + 0.4 * clamp((s.y - bd.y0) / Math.max(1, bd.y1 - bd.y0), 0, 1));
        if (d <= sp) { rest(now, s.mul > 1 ? 'front' : pickIdle()); }
        else {
          s.x += (dx / d) * sp; s.y += (dy / d) * sp * 0.75;
          if (Math.abs(dx) > 8) s.dir = dx > 0 ? 1 : -1;
          s.vert = Math.abs(dx) < Math.abs(dy) * 0.6 && dy < 0 ? -1 : 0;   // heading away from us
          s.sub = (s.sub || 0) + 1;
          if (s.sub >= FRAME_EVERY) { s.sub = 0; s.frame = (s.frame + 1) % 52; }   // wraps by whichever walk cycle is showing
        }
      } else {
        s.sub = (s.sub || 0) + 1;
        if (s.sub >= 3) { s.sub = 0; s.frame += 1; }
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
  if (s.held) { n = s.frame % 4 < 2 ? 38 : 35; flip = s.dir < 0; lift = 22; }
  else if (s.mode === 'walk') {
    if (s.vert < 0) n = away(AWAY[s.frame % AWAY.length]);
    else if (s.dir > 0) n = 1 + (s.frame % 13);          // right-facing cycle
    else n = 14 + (s.frame % 12);                         // left-facing cycle
  } else {
    flip = s.dir < 0;
    if (s.pose === 'front') { n = 26; flip = false; }
    else if (s.pose === 'stand') n = s.frame % 30 < 15 ? 27 : 32;
    else if (s.pose === 'peck') n = [39, 40, 41, 40][Math.floor(s.frame / 2) % 4];
    else if (s.pose === 'preen') n = 47;
    else if (s.pose === 'sleep') n = 44;
    else if (s.pose === 'wings') n = s.frame % 6 < 3 ? 35 : 34;
    else n = s.frame % 10 < 6 ? 36 : 37;   // honk
  }
  const f = frameOf(n);
  const bd = bounds;
  const depth = 0.8 + 0.4 * clamp((s.y - bd.y0) / Math.max(1, bd.y1 - bd.y0), 0, 1);   // nearer = bigger
  const w = f.w * size * depth * k, h = f.h * size * depth * k;

  return (
    <View {...pan.panHandlers} style={{ position: 'absolute', left: s.x * k - w / 2, top: (s.y - lift) * k - h, width: w, height: h, zIndex: s.held ? 900 : zOf ? zOf(s.y) : 6 + Math.round(s.y / 10) }}>
      {/* every frame stays mounted and only the current one is shown, so swapping never reloads a picture (no flicker) */}
      {FRAME_KEYS.map((i) => <FrameImg key={i} src={frameOf(i).src} w={w} h={h} show={i === n} flip={flip} />)}
    </View>
  );
}

// A goose asleep on a perch (the ottoman at home): { x, y } is where its feet rest, in the scene's own pixels.
function PerchGoose({ k, base = 0.6, perch }) {
  const f = frameOf(43), w = f.w * base * 1.25 * k, h = f.h * base * 1.25 * k;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: perch.x * k - w / 2, top: perch.y * k - h, width: w, height: h, zIndex: perch.z ?? 12 }}>
      <Image source={f.src} resizeMode="contain" style={{ width: w, height: h }} />
    </View>
  );
}

export default function Goose(props) {
  return props.perch ? <PerchGoose k={props.k} base={props.base} perch={props.perch} /> : <WanderGoose {...props} />;
}
