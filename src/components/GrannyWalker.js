import React, { useEffect, useRef, useState } from 'react';
import { View, Image, TouchableOpacity, Text, Platform } from 'react-native';
import { GRANNY } from '../engine/assets';
import Bubble from './Bubble';

// Granny Mae strolls up and down the street on the map, forever. Coordinates are the map picture's base pixels (1376x768);
// `k` converts them to screen pixels. Tap her and she stops to say something.
const PATH = [[230, 730], [520, 600], [760, 500], [1010, 385], [1230, 285]];   // along the cobbles, bottom-left to top-right
const SPEED = 3.2;        // base px per tick
const TICK = 100;
const LINES = [
  'Good evening, dear! Mind the cobbles.',
  'The marigolds at the market are lovely today.',
  'I am just off to see about some herbs.',
  'Come by the house, I will put the kettle on.',
  'Such a nice night for a walk.',
];
const USED = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const WALK_BACK = [7, 8, 9, 10, 18, 19, 20, 21];
const WALK_FRONT = [1, 2, 3, 4, 5, 6];

// where she is along the path (0..1 of its total length) -> a point
const lens = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const total = lens.reduce((a, b) => a + b, 0);
function at(t) {
  let d = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) { const f = d / lens[i]; return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * f, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * f]; }
    d -= lens[i];
  }
  return PATH[PATH.length - 1];
}

export default function GrannyWalker({ k, z = 8 }) {
  const s = useRef({ t: 0.35, dir: 1, frame: 0, talk: -1, until: 0 }).current;
  const [, tick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      if (s.talk >= 0) { if (now > s.until) s.talk = -1; }
      else {
        s.t += s.dir * (SPEED / total);
        if (s.t >= 1) { s.t = 1; s.dir = -1; }
        if (s.t <= 0) { s.t = 0; s.dir = 1; }
        s.frame += 1;
      }
      tick((n) => n + 1);
    }, TICK);
    return () => clearInterval(iv);
  }, []);

  const [x, y] = at(s.t);
  const talking = s.talk >= 0;
  const depth = 0.7 + 0.5 * ((y - 285) / (730 - 285));        // lower on the map = closer = bigger
  const up = s.dir > 0;                                        // heading up the street, away from us
  let n, flip = false;
  if (talking) { n = [11, 12, 13, 14, 15, 16, 17][Math.floor(Date.now() / 450) % 7]; flip = !up; }   // full-body frames, hands clasped, while she chats
  else if (up) n = WALK_BACK[s.frame % WALK_BACK.length];
  else { n = WALK_FRONT[s.frame % WALK_FRONT.length]; flip = true; }   // coming down the street, facing us and to the left
  const f = GRANNY[n];
  const H = 118 * depth * k, w = H * f.w / f.h;
  const left = x * k - w / 2, top = y * k - H;

  const poke = () => { s.talk = (s.talk + 1) % LINES.length; s.until = Date.now() + 3800; tick((m) => m + 1); };

  return (
    <>
      <TouchableOpacity activeOpacity={1} onPress={poke} style={{ position: 'absolute', left, top, width: w, height: H, zIndex: z }}>
        {/* all frames stay mounted; only the current one is visible, so nothing reloads between steps (no flicker) */}
        {USED.map((i) => (
          <Image key={i} source={GRANNY[i].src} resizeMode="contain" style={{ position: 'absolute', left: 0, top: 0, width: w, height: H, opacity: i === n ? 1 : 0, transform: flip ? [{ scaleX: -1 }] : undefined }} />
        ))}
      </TouchableOpacity>
      {talking && <Bubble width={Math.max(230, 260 * k * 1.1)} text={LINES[s.talk]} style={{ left: Math.max(6, Math.min(x * k - 120, 1376 * k - 250)), top: Math.max(6, top - 80 * k - 40), zIndex: 60 }} />}
    </>
  );
}
