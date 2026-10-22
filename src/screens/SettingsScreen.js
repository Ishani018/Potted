import React, { useEffect, useRef, useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import LevelBadge from '../components/LevelBadge';
import { useGame } from '../context/GameContext';
import { MAP_BG } from '../engine/assets';
import { getAudioPrefs, subscribeAudio, setMusicOn, setMusicVolume } from '../engine/audio';
import { PixelPanel, PixelButton, PixelText, COLORS } from '../components/Pixel';
import BackSign from '../components/BackSign';

// Settings: sound and the basics. Everything about your pets, paintings and
// plants lives in the garden journal now.
const CONFIRM_MS = 4000;   // how long "tap again to erase" stays armed
const STEPS = 10;          // volume bar segments

export default function SettingsScreen({ navigation }) {
  const { dispatch } = useGame();
  const [audio, setAudio] = useState(getAudioPrefs());
  const [confirming, setConfirming] = useState(false);
  const [erased, setErased] = useState(false);
  const timer = useRef(null);

  useEffect(() => subscribeAudio(setAudio), []);
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const level = Math.round(audio.volume * STEPS);

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
        <View style={styles.board}>
          <PixelPanel>
            <View style={{ gap: 14 }}>
              <PixelText size={14} color={COLORS.gold} style={{ textAlign: 'center' }}>SETTINGS</PixelText>

              {/* level, XP and the next unlock live here now, not on every screen */}
              <LevelBadge inline />

              {/* music on / off */}
              <View style={styles.row}>
                <PixelText size={10}>MUSIC</PixelText>
                <PixelButton
                  label={audio.musicOn ? 'ON' : 'OFF'}
                  tone={audio.musicOn ? 'green' : 'wood'}
                  size={10}
                  onPress={() => setMusicOn(!audio.musicOn)}
                  style={styles.toggle}
                />
              </View>

              {/* volume */}
              <View style={styles.row}>
                <PixelText size={10}>VOLUME</PixelText>
                <View style={styles.volume}>
                  <PixelButton label="-" size={12} tone="wood" disabled={level <= 0} onPress={() => setMusicVolume((level - 1) / STEPS)} style={styles.step} />
                  <View style={styles.bar}>
                    {Array.from({ length: STEPS }).map((_, i) => (
                      <View key={i} style={[styles.seg, i < level && styles.segOn, !audio.musicOn && styles.segOff]} />
                    ))}
                  </View>
                  <PixelButton label="+" size={12} tone="wood" disabled={level >= STEPS} onPress={() => setMusicVolume((level + 1) / STEPS)} style={styles.step} />
                </View>
              </View>

              <View style={styles.rule} />

              {/* start over */}
              <View style={styles.row}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <PixelText size={10}>START OVER</PixelText>
                  <PixelText size={6} color="#e8d4a8" style={{ marginTop: 5, lineHeight: 11 }}>
                    {erased ? 'ALL CLEARED. A FRESH START!' : confirming ? 'THIS ERASES YOUR GARDEN, PETS AND COINS.' : 'ERASES YOUR WHOLE GAME.'}
                  </PixelText>
                </View>
                <PixelButton
                  label={confirming ? 'TAP AGAIN' : 'ERASE'}
                  size={9}
                  tone={confirming ? 'green' : 'wood'}
                  onPress={erase}
                  style={[styles.erase, confirming && styles.eraseArmed]}
                />
              </View>

              <PixelText size={6} color="#e8d4a8" style={{ textAlign: 'center' }}>POTTED - A COZY PLANT NURSERY - V1.0</PixelText>
            </View>
          </PixelPanel>
        </View>
      </View>

      <BackSign onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140c' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,8,0,0.7)' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  board: { width: '88%', maxWidth: 440 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { minWidth: 92 },
  volume: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: {},
  bar: { flexDirection: 'row', gap: 3 },
  seg: { width: 11, height: 18, borderRadius: 2, backgroundColor: '#2a1608', borderWidth: 1, borderColor: COLORS.woodEdge },
  segOn: { backgroundColor: '#7ad05a', borderColor: COLORS.greenEdge },
  segOff: { opacity: 0.4 },
  rule: { height: 3, backgroundColor: COLORS.woodDark, borderRadius: 2 },
  erase: { minWidth: 104 },
  eraseArmed: { backgroundColor: '#8a2a1a', borderColor: '#4a1208' },
});
