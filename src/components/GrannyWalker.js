import React, { useEffect, useRef, useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { GRANNY } from '../engine/assets';
import Bubble from './Bubble';

// Granny Mae strolls up and down the street on the map, forever. Coordinates are the map picture's base pixels (1376x768);
// `k` converts them to screen pixels. Tap her and she stops to say something.
// The street map (1376x768 base px): nodes are corners and junctions on the cobbles, edges are the roads between them.
// Granny picks a road at each junction, so she can head up to the florist, down the left turn before the nursery,
// or across to the market.
const NODES = {
  L:  [150, 735],   // end of the left turn (down-left) 
  J1: [260, 650],   // junction by the lamp, before the nursery
  J2: [520, 610],   // in front of the nursery
  J3: [690, 552],   // the big junction: up the street, or across to the market
  P:  [880, 388], // outside the pet shop, on the sidewalk edge above the stalls
  F:  [1035, 318], // along the cobbles above the blue stall
  FL: [1215, 262], // the florist end of the street
  M1: [840, 598], // heading to the market, between the roof and the stall crates
  M2: [980, 642], // the market square, in front of the stalls
  M3: [1040, 695], // at the bottom of the square
};
const EDGES = [['L', 'J1'], ['J1', 'J2'], ['J2', 'J3'], ['J3', 'P'], ['P', 'F'], ['F', 'FL'], ['J3', 'M1'], ['M1', 'M2'], ['M2', 'M3']];
const nbrs = (n) => EDGES.filter((e) => e.includes(n)).map((e) => (e[0] === n ? e[1] : e[0]));
const SPEED = 1.15;       // base px per update
const TICK = 36;          // about 28 updates a second: she glides
const FRAME_EVERY = 3;    // a new walking frame every 3 updates (about 9 a second)
const LINES = [
  'Good evening, dear! Mind the cobbles.',
  'The marigolds at the market are lovely today.',
  'I am just off to see about some herbs.',
  'Come and see me if you have a pest in the garden.',
  'Such a nice night for a walk.',
];
const USED = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const WALK_BACK = [7, 8, 9, 10, 18, 19, 20, 21];
const WALK_FRONT = [1, 2, 3, 4, 5, 6];

const FrameImg = React.memo(function FrameImg({ src, w, h, show, flip }) {
  return <Image source={src} resizeMode="contain" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: show ? 1 : 0, transform: flip ? [{ scaleX: -1 }] : undefined }} />;
});

export default function GrannyWalker({ k, z = 8, onOpen, flag }) {
  const s = useRef({ x: NODES.J2[0], y: NODES.J2[1], from: 'J2', to: 'J3', prev: 'J2', dx: 1, dy: -0.3, frame: 0, talk: -1, until: 0, sub: 0 }).current;
  const [, tick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      if (s.talk >= 0) { if (now > s.until) s.talk = -1; }
      else {
        const [tx, ty] = NODES[s.to], dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
        if (d <= SPEED * 1.5) {                                    // reached a junction: choose the next road (mostly not straight back)
          s.x = tx; s.y = ty;
          const opts = nbrs(s.to), fwd = opts.filter((o) => o !== s.from);
          const next = fwd.length && Math.random() < 0.92 ? fwd[Math.floor(Math.random() * fwd.length)] : opts[Math.floor(Math.random() * opts.length)];
          s.prev = s.from; s.from = s.to; s.to = next;
        } else { s.x += (dx / d) * SPEED; s.y += (dy / d) * SPEED; s.dx = dx / d; s.dy = dy / d; }
        s.sub += 1;
        if (s.sub >= FRAME_EVERY) { s.sub = 0; s.frame += 1; }
      }
      tick((n) => n + 1);
    }, TICK);
    return () => clearInterval(iv);
  }, []);

  const x = s.x, y = s.y;
  const talking = s.talk >= 0;
  const depth = 0.7 + 0.5 * ((y - 285) / (735 - 285));        // lower on the map = closer = bigger
  const up = s.dy < -0.08;                                     // heading up the screen, away from us
  const faceLeft = s.dx < 0;
  let n, flip = false;
  if (talking) { n = [11, 12, 13, 14, 15, 16, 17][Math.floor(Date.now() / 450) % 7]; flip = faceLeft; }   // full-body frames, hands clasped, while she chats
  else if (up) n = WALK_BACK[s.frame % WALK_BACK.length];
  else { n = WALK_FRONT[s.frame % WALK_FRONT.length]; flip = faceLeft; }   // walking towards us, facing the way she goes
  const f = GRANNY[n];
  const H = 118 * depth * k, w = H * f.w / f.h;
  const left = x * k - w / 2, top = y * k - H;

  // tapping Granny opens her herbalist menu (today's balm, herb swaps); she waits while it is open
  const poke = () => { s.talk = (s.talk + 1) % LINES.length; s.until = Date.now() + 3800; tick((m) => m + 1); onOpen && onOpen(); };

  return (
    <>
      <TouchableOpacity activeOpacity={1} onPress={poke} style={{ position: 'absolute', left, top, width: w, height: H, zIndex: z }}>
        {/* all frames stay mounted; only the current one is visible, so nothing reloads between steps (no flicker) */}
        {USED.map((i) => <FrameImg key={i} src={GRANNY[i].src} w={w} h={H} show={i === n} flip={flip} />)}
      </TouchableOpacity>
      {flag && !talking && <Bubble width={Math.max(60, 70 * k)} text="!" style={{ left: left + w / 2 - 30 * k, top: top - 40 * k, zIndex: 60 }} />}
      {talking && <Bubble width={Math.max(230, 260 * k * 1.1)} text={LINES[s.talk]} style={{ left: Math.max(6, Math.min(x * k - 120, 1376 * k - 250)), top: Math.max(6, top - 80 * k - 40), zIndex: 60 }} />}
    </>
  );
}
