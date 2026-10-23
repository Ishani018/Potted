import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { PET_IMAGES } from '../engine/assets';
import { PixelText } from './Pixel';
import { PET_FRAMES, PET_POSES } from '../engine/petAnim';

// Pets that are drawn asleep: slow breathing + floating "Z", no hopping.
const SLEEPERS = { koazy: true, ebonyandivory: true, smoky: true, inky: true };

// An animated pet. Breathes (squash/stretch anchored at its feet), and sleepers drift a little "Z". Each pet gets its own random phase so a
// room full of pets never moves in lockstep. Layout (position/size) is the
// caller's job — this fills a w×h box.
// source: draw this picture instead of the pet's usual one; asleep: force sleeping (or awake).
// Which pose comes next: [pose, weight, min ms, max ms]. Pets that nap by default sleep most of the time.
const AWAKE_MIX = [['sit', 4, 3500, 7000], ['stand', 3, 2500, 5000], ['groom', 2, 2200, 3500], ['stretch', 1.2, 2200, 3200], ['rest', 1.5, 3500, 6500], ['sleep', 1, 5000, 9000]];
const NAP_MIX = [['sleep', 7, 6000, 11000], ['rest', 1.5, 3000, 5000], ['stretch', 1, 2200, 3000], ['sit', 1, 3000, 5000]];
const SLEEP_ONLY = [['sleep', 1, 6000, 11000]];
const pickFrom = (mix) => { const t = mix.reduce((n, m) => n + m[1], 0); let r = Math.random() * t; for (const m of mix) { r -= m[1]; if (r <= 0) return m; } return mix[0]; };

// A pet drawn from its sprite-sheet frames: it settles into poses (sit, groom, stretch, nap...) and changes now and then.
// All frames stay mounted and only the current one is visible, so swapping never flickers.
function PosedPet({ petKey, w, h, flip, children, asleepForced, napper }) {
  const frames = PET_FRAMES[petKey], poses = PET_POSES[petKey];
  const mix = asleepForced ? SLEEP_ONLY : napper ? NAP_MIX : AWAKE_MIX;
  const [cur, setCur] = useState(() => { const m = pickFrom(mix); return { pose: m[0], n: 0 }; });
  const [prevFrame, setPrevFrame] = useState(null);
  const fade = useRef(new Animated.Value(1)).current;
  const shown = useRef(null);
  const breath = useRef(new Animated.Value(0)).current;
  // Moving between a lying pose and a standing one passes through a sit first, so the pet never jumps from curled-up to mid-stretch.
  const LOW = ['rest', 'sleep'], UP = ['stand', 'stretch', 'groom'];
  useEffect(() => {
    let t, t2;
    const go = () => {
      const m = pickFrom(mix);
      setCur((c) => {
        const bridge = (LOW.includes(c.pose) && UP.includes(m[0])) || (UP.includes(c.pose) && LOW.includes(m[0]));
        if (bridge && poses.sit) { t2 = setTimeout(() => setCur((c2) => ({ pose: m[0], n: c2.n + 1 })), 1100); return { pose: 'sit', n: c.n + 1 }; }
        return { pose: m[0], n: c.n + 1 };
      });
      t = setTimeout(go, m[2] + Math.random() * (m[3] - m[2]));
    };
    t = setTimeout(go, 1500 + Math.random() * 3000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [petKey, asleepForced, napper]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: cur.pose === 'sleep' ? 2600 : 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: cur.pose === 'sleep' ? 2600 : 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [cur.pose]);

  const list = poses[cur.pose] || poses.sit;
  const frame = list[cur.n % list.length];
  // The box was sized for the pet's old single picture (sitting, lying, wide or tall). Match its area so a pet that was drawn
  // lying down doesn't shrink when its sheet's base frame is a sitting pose; never let it spill far outside the box.
  const base = frames[napper || asleepForced ? poses.sleep[0] : poses.base];
  const sc = Math.min(Math.sqrt((w * h) / (base.w * base.h)), (w * 1.3) / base.w, (h * 1.3) / base.h);
  useEffect(() => {
    if (shown.current === null) { shown.current = frame; return; }
    if (shown.current === frame) return;
    setPrevFrame(shown.current); shown.current = frame;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(({ finished }) => { if (finished) setPrevFrame(null); });
  }, [frame]);
  const sleeping = cur.pose === 'sleep';
  const scaleY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  return (
    <View style={{ width: w, height: h }}>
      <Animated.View style={{ width: w, height: h, transform: [{ scaleY }, { scaleX: flip ? -1 : 1 }], transformOrigin: 'bottom' }}>
        {Object.keys(frames).map((k) => {
          // gently even out size between poses: a long lying frame is drawn a touch smaller than a tall sitting one
          const f = frames[k], norm = Math.pow((base.w * base.h) / (f.w * f.h), 0.18), fw = f.w * sc * norm, fh = f.h * sc * norm;
          const isCur = Number(k) === frame, isPrev = Number(k) === prevFrame;
          const st = { position: 'absolute', left: (w - fw) / 2, top: h - fh, width: fw, height: fh };
          if (isCur) return <Animated.Image key={k} source={f.src} resizeMode="stretch" style={[st, { opacity: prevFrame === null ? 1 : fade }]} />;
          return <Image key={k} source={f.src} resizeMode="stretch" style={[st, { opacity: isPrev ? 1 : 0 }]} />;
        })}
      </Animated.View>
      {sleeping && <View pointerEvents="none" style={{ position: 'absolute', right: w * 0.12, top: h * 0.05 }}><PixelText size={Math.max(8, w * 0.1)}>Z</PixelText></View>}
      {children}
    </View>
  );
}

function PlainPet({ petKey, w, h, flip, children, source, asleep: asleepProp }) {
  const breath = useRef(new Animated.Value(0)).current;
  const zz = useRef(new Animated.Value(0)).current;
  const asleep = asleepProp ?? !!SLEEPERS[petKey];

  useEffect(() => {
    const phase = Math.random() * 1200;
    const dur = asleep ? 2600 : 1500;
    const breathLoop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const start = setTimeout(() => breathLoop.start(), phase);

    let zzLoop;
    if (asleep) {
      zzLoop = Animated.loop(Animated.timing(zz, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true }));
      setTimeout(() => zzLoop.start(), phase);
    }
    return () => {
      clearTimeout(start);
      breathLoop.stop(); zzLoop && zzLoop.stop();
    };
  }, [petKey, asleep]);

  const amp = asleep ? 0.03 : 0.035;
  const scaleY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + amp] });
  const scaleX = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1 - amp / 2] });
  // scaleY grows about the centre; shift so the feet stay planted.
  const plant = breath.interpolate({ inputRange: [0, 1], outputRange: [0, -(h * amp) / 2] });

  const zOpacity = zz.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const zRise = zz.interpolate({ inputRange: [0, 1], outputRange: [0, -h * 0.35] });

  return (
    <View style={{ width: w, height: h }}>
      <Animated.View style={{ width: w, height: h, transform: [{ translateY: plant }, { scaleY }, { scaleX }] }}>
        <Image
          source={source ?? PET_IMAGES[petKey]}
          style={{ width: w, height: h, transform: flip ? [{ scaleX: -1 }] : undefined }}
          resizeMode="contain"
        />
      </Animated.View>
      {asleep && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', right: w * 0.12, top: h * 0.1, opacity: zOpacity, transform: [{ translateY: zRise }] }}>
          <PixelText size={Math.max(8, w * 0.1)}>Z</PixelText>
        </Animated.View>
      )}
      {children}
    </View>
  );
}

// Pets with sprite-sheet frames get the posed version; the rest keep their single picture.
// `source` (a specific picture, e.g. a stray resting) or any pet without frames stays as before.
export default function PetSprite(props) {
  const { petKey, source, asleep } = props;
  if (!source && PET_FRAMES[petKey]) return <PosedPet {...props} asleepForced={asleep === true} napper={asleep === undefined && !!SLEEPERS[petKey]} />;
  return <PlainPet {...props} />;
}
