import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MAIN_BG, UI_IMAGES } from '../engine/assets';
import { ensureMusic, setMusicOn, getAudioPrefs, subscribeAudio, loadAudioPrefs } from '../engine/audio';

export default function MainScreen({ navigation }) {
  const { width: sw } = useWindowDimensions();
  // Music is one shared player (engine/audio) — settings controls the same one.
  const [audio, setAudio] = useState(getAudioPrefs());
  useEffect(() => subscribeAudio(setAudio), []);

  // ── PLAY button — EDIT THESE TWO to resize/move ──────────────────────────────
  const PLAY_SCALE = 0.24; // fraction of screen width (bigger number = bigger button)
  const PLAY_LEFT = '79%'; // horizontal center of the button
  const PLAY_TOP = '65%'; // vertical position (smaller % = higher up)
  // play.png aspect ≈ 2.2 : 1 (width : height)
  const playW = Math.round(sw * PLAY_SCALE);
  const playH = Math.round(playW / 2.2);

  // Load the saved volume / on-off, then best-effort autoplay (works on native;
  // may be blocked on web until PLAY).
  useEffect(() => { loadAudioPrefs().then(ensureMusic); }, []);

  const toggleMute = () => setMusicOn(!audio.musicOn);

  // TODO: play a short click SFX here once a click sound asset is added.
  const handlePlay = async () => {
    await ensureMusic();             // guarantees music is running (user gesture)
    navigation.replace('Loading');
  };

  return (
    <View style={styles.root}>
      <Image source={MAIN_BG} style={styles.bg} resizeMode="cover" />

      {/* Top-left: settings */}
      <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Settings')}>
        <Image source={UI_IMAGES.settings} style={styles.cornerImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Top-right: info + sound (placeholders) */}
      <View style={styles.topRight}>
        <TouchableOpacity style={styles.cornerBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Settings')}>
          <Image source={UI_IMAGES.info} style={styles.cornerImg} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cornerBtn} activeOpacity={0.8} onPress={toggleMute}>
          <Image source={audio.musicOn ? UI_IMAGES.sound : UI_IMAGES.mutedsound} style={styles.cornerImg} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* PLAY — the only button that starts the game */}
      <TouchableOpacity
        style={[styles.playBtn, { left: PLAY_LEFT, top: PLAY_TOP, width: playW, height: playH, marginLeft: -playW / 2 }]}
        activeOpacity={0.85}
        onPress={handlePlay}
      >
        <Image source={UI_IMAGES.play} style={styles.playImg} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  settingsBtn: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 54,
    height: 54,
    zIndex: 10,
  },
  topRight: {
    position: 'absolute',
    top: 18,
    right: 18,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  cornerBtn: { width: 54, height: 54 },
  cornerImg: { width: '100%', height: '100%' },
  playBtn: {
    position: 'absolute',
    zIndex: 10,
  },
  playImg: { width: '100%', height: '100%' },
});
