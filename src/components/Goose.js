import React, { useEffect, useRef, useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { GOOSE, GOOSE_HONK } from '../engine/assets';
import { playSfx } from '../engine/audio';

// A goose that wanders the floor. Everything is in the room picture's own pixels; `k` converts to screen pixels.
// bounds = { x0, x1, y0, y1 } is the patch of floor it may roam (y is where its feet are).
const TICK = 100;          // ms per animation step (about 10 frames a second)
const SPEED = 5.5;         // picture pixels per tick
const BASE = 0.62;         // sheet pixels -> picture pixels at mid depth (a chunky, cute goose)
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const IDLES = [['front', 3], ['stand', 2], ['peck', 3], ['preen', 2], ['wings', 1], ['sleep', 0.7], ['honk', 0.6]];
function pickIdle() {
  const total = IDLES.reduce((n, [, w]) => n + w, 0); let r = Math.random() * total;
  for (const [name, w] of IDLES) { r -= w; if (r <= 0) return name; }
  return 'front';
}

export default function Goose({ k, bounds, zIndex = 6 }) {
  const g = useRef({ x: (bounds.x0 + bounds.x1) / 2, y: (bounds.y0 + bounds.y1) / 2, tx: 0, ty: 0, mode: 'idle', pose: 'front', until: 0, frame: 0, dir: 1, vert: 0 });
  const [, tick] = useState(0);

  const honk = (gain) => { playSfx(GOOSE_HONK, gain); };
  const rest = (now, pose) => {
    const s = g.current; s.mode = 'idle'; s.pose = pose; s.frame = 0;
    s.until = now + (pose === 'sleep' ? rand(6000, 9000) : pose === 'honk' ? 1500 : rand(1800, 4200));
    if (pose === 'honk') honk(0.45);
  };
  const wander = () => {
    const s = g.current;
    s.mode = 'walk'; s.tx = rand(bounds.x0, bounds.x1); s.ty = rand(bounds.y0, bounds.y1); s.frame = 0;
  };

  useEffect(() => {
    g.current.until = Date.now() + 800;
    const iv = setInterval(() => {
      const s = g.current, now = Date.now();
      if (s.mode === 'walk') {
        const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
        if (d <= SPEED) { rest(now, pickIdle()); }
        else {
          s.x += (dx / d) * SPEED; s.y += (dy / d) * SPEED * 0.75;
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

  const s = g.current;
  let n, flip = false;
  if (s.mode === 'walk') n = s.vert < 0 ? 28 + s.frame : (s.dir > 0 ? 1 : 10) + s.frame;
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
  const depth = 0.8 + 0.4 * ((s.y - bounds.y0) / Math.max(1, bounds.y1 - bounds.y0));   // nearer = bigger
  const w = f.w * BASE * depth * k, h = f.h * BASE * depth * k;

  const poke = () => { const now = Date.now(); s.mode = 'idle'; s.pose = 'honk'; s.frame = 0; s.until = now + 1600; honk(1); };

  return (
    <TouchableOpacity activeOpacity={1} onPress={poke} style={{ position: 'absolute', left: s.x * k - w / 2, top: s.y * k - h, width: w, height: h, zIndex: zIndex + Math.round(s.y / 10) }}>
      <Image source={f.src} resizeMode="contain" style={{ width: w, height: h, transform: flip ? [{ scaleX: -1 }] : undefined }} />
    </TouchableOpacity>
  );
}
