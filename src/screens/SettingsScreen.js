import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import LevelBadge from '../components/LevelBadge';
import { useGame } from '../context/GameContext';
import { MAP_BG, SET_UI } from '../engine/assets';
import { getAudioPrefs, subscribeAudio, setMusicOn, setMusicVolume, setSfxOn, setSfxVolume } from '../engine/audio';
import { useLayout } from '../context/LayoutContext';

// Settings: sound and the basics, drawn with the painted UI pieces. Everything about your pets,
// paintings and plants lives in the garden journal now.
const CONFIRM_MS = 4000;   // how long "tap again to erase" stays armed
const STEPS = 10;          // volume bar segments
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const INK = '#4a2a10';

const pic = (key, h) => ({ width: h * SET_UI[key].w / SET_UI[key].h, height: h });

function Toggle({ on, onPress }) {
  const k = on ? 'toggleOn' : 'toggleOff';
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      {/* the painted OFF switch has its knob on the right; mirror it so the knob sits on the left when off */}
      <Image source={SET_UI[k].src} resizeMode="contain" style={[pic(k, 30), on ? null : { transform: [{ scaleX: -1 }] }]} />
    </TouchableOpacity>
  );
}

function Button({ k, label, onPress, h = 38, dim }) {
  const st = pic(k, h);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[st, { alignItems: 'center', justifyContent: 'center', opacity: dim ? 0.55 : 1 }]}>
      <Image source={SET_UI[k].src} resizeMode="stretch" style={[StyleSheet.absoluteFill, st]} />
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Volume({ level, on, onChange }) {
  return (
    <View style={styles.volume}>
      <TouchableOpacity activeOpacity={0.8} disabled={level <= 0} onPress={() => onChange((level - 1) / STEPS)} style={{ opacity: level <= 0 ? 0.4 : 1 }}>
        <Image source={SET_UI.left.src} resizeMode="contain" style={pic('left', 30)} />
      </TouchableOpacity>
      <View style={styles.bar}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <View key={i} style={[styles.seg, i < level && styles.segOn, !on && styles.segOff]} />
        ))}
      </View>
      <TouchableOpacity activeOpacity={0.8} disabled={level >= STEPS} onPress={() => onChange((level + 1) / STEPS)} style={{ opacity: level >= STEPS ? 0.4 : 1 }}>
        <Image source={SET_UI.right.src} resizeMode="contain" style={pic('right', 30)} />
      </TouchableOpacity>
    </View>
  );
}

const Row = ({ icon, label, children }) => (
  <View style={styles.row}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {icon && <Image source={SET_UI[icon].src} resizeMode="contain" style={pic(icon, 30)} />}
      <Text style={styles.label}>{label}</Text>
    </View>
    {children}
  </View>
);

export default function SettingsScreen({ navigation }) {
  const { height: winH } = useLayout();
  const { dispatch } = useGame();
  const [audio, setAudio] = useState(getAudioPrefs());
  const [confirming, setConfirming] = useState(false);
  const [erased, setErased] = useState(false);
  const timer = useRef(null);

  useEffect(() => subscribeAudio(setAudio), []);
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const level = Math.round(audio.volume * STEPS);
  const sfxLevel = Math.round(audio.sfxVolume * STEPS);

  const erase = () => {
    if (!confirming) {
      setConfirming(true);
      timer.current = setTimeout(() => setConfirming(false), CONFIRM_MS);
      return;
    }
    clearTimeout(timer.current);
    setConfirming(false);
    dispatch({ type: 'RESET_GAME' });
    setErased(true);
    timer.current = setTimeout(() => setErased(false), 2500);
  };

  return (
    <View style={styles.root}>
      <Image source={MAP_BG} style={styles.bg} resizeMode="cover" />
      <View style={styles.dim} />

      <View style={styles.center} pointerEvents="box-none">
        <View style={[styles.board, { maxHeight: Math.max(260, (winH || 600) * 0.88) }]}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.close}>
              <Image source={SET_UI.close.src} resizeMode="contain" style={pic('close', 36)} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            <LevelBadge inline />

            <Row icon="music" label="Music"><Toggle on={audio.musicOn} onPress={() => setMusicOn(!audio.musicOn)} /></Row>
            <Row label="Music volume"><Volume level={level} on={audio.musicOn} onChange={setMusicVolume} /></Row>

            <View style={styles.rule} />

            <Row icon="sound" label="Sound effects"><Toggle on={audio.sfxOn} onPress={() => setSfxOn(!audio.sfxOn)} /></Row>
            <Row label="Effects volume"><Volume level={sfxLevel} on={audio.sfxOn} onChange={setSfxVolume} /></Row>

            <View style={styles.rule} />

            <Row label="Start over">
              <Button k={confirming ? 'btnRed' : 'btnCream'} label={confirming ? 'Tap again' : 'Erase'} h={38} onPress={erase} />
            </Row>
            <Text style={styles.warn}>{erased ? 'All cleared. A fresh start!' : confirming ? 'This erases your garden, pets and coins.' : 'Erases your whole game.'}</Text>

            <Text style={styles.foot}>Potted · a cozy plant nursery · v1.0</Text>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140c' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,8,0,0.7)' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  board: { width: '88%', maxWidth: 460, backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12 },
  titleRow: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontFamily: SERIF, fontSize: 26, color: INK, fontWeight: 'bold' },
  close: { position: 'absolute', right: -4, top: -2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { fontFamily: SERIF, fontSize: 17, color: INK },
  volume: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { flexDirection: 'row', gap: 3 },
  seg: { width: 10, height: 18, borderRadius: 3, backgroundColor: '#d9c08a', borderWidth: 1, borderColor: '#8a5a2a' },
  segOn: { backgroundColor: '#6a8f4a', borderColor: '#3c5a28' },
  segOff: { opacity: 0.4 },
  rule: { height: 3, backgroundColor: '#d2b27a', borderRadius: 2 },
  btnText: { fontFamily: SERIF, fontSize: 16, color: INK, fontWeight: 'bold' },
  warn: { fontFamily: SERIF, fontSize: 13, color: '#7a5030', marginTop: -6 },
  foot: { fontFamily: SERIF, fontSize: 12, color: '#7a5030', textAlign: 'center' },
});
