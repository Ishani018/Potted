import React, { useRef, useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Audio } from 'expo-av';
import { MAIN_BG, UI_IMAGES } from '../engine/assets';

const MUSIC = require('../../assets/Sunlight_on_the_Sprouts.mp3');

export default function MainScreen({ navigation }) {
  const soundRef = useRef(null);
  const mutedRef = useRef(false);          // read inside async without stale closure
  const [muted, setMuted] = useState(false);
  const { width: sw } = useWindowDimensions();

  // ── PLAY button — EDIT THESE TWO to resize/move ──────────────────────────────
  const PLAY_SCALE = 0.24; // fraction of screen width (bigger number = bigger button)
  const PLAY_LEFT = '79%'; // horizontal center of the button
  const PLAY_TOP = '65%'; // vertical position (smaller % = higher up)
  // play.png aspect ≈ 2.2 : 1 (width : height)
  const playW = Math.round(sw * PLAY_SCALE);
  const playH = Math.round(playW / 2.2);

  // Create the looping music (once) and start it. Safe to call repeatedly — if the
  // sound already exists it just resumes. We do NOT unload on unmount so it carries
  // into the game. Autoplay may be blocked until a user gesture; PLAY also calls
  // this, so the music is guaranteed to start by the time you enter the game.
  const ensureMusic = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        return;
      }
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        MUSIC,
        { shouldPlay: true, isLooping: true, volume: 1.0, isMuted: mutedRef.current },
      );
      soundRef.current = sound;
    } catch (e) {
      console.error('Audio failed:', e?.message ?? e);
    }
  };

  // Best-effort autoplay on mount (works on native; may be blocked on web).
  useEffect(() => { ensureMusic(); }, []);

  const toggleMute = async () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    await ensureMusic();             // also starts music if autoplay was blocked
    if (soundRef.current) {
      try { await soundRef.current.setIsMutedAsync(next); } catch { }
    }
  };

  // TODO: play a short click SFX here once a click sound asset is added.
  const handlePlay = async () => {
    await ensureMusic();             // guarantees music is running (user gesture)
    navigation.replace('Loading');
  };

  return (
    <View style={styles.root}>
      <Image source={MAIN_BG} style={styles.bg} resizeMode="cover" />

      {/* Top-left: settings (placeholder) */}
      <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8} onPress={() => { }}>
        <Image source={UI_IMAGES.settings} style={styles.cornerImg} resizeMode="contain" />
      </TouchableOpacity>

      {/* Top-right: info + sound (placeholders) */}
      <View style={styles.topRight}>
        <TouchableOpacity style={styles.cornerBtn} activeOpacity={0.8} onPress={() => { }}>
          <Image source={UI_IMAGES.info} style={styles.cornerImg} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cornerBtn} activeOpacity={0.8} onPress={toggleMute}>
          <Image source={muted ? UI_IMAGES.mutedsound : UI_IMAGES.sound} style={styles.cornerImg} resizeMode="contain" />
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
