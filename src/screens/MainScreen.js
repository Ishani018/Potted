import React, { useRef } from 'react';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { MAIN_BG, UI_IMAGES } from '../engine/assets';

const MUSIC = require('../../Sunlight_on_the_Sprouts.mp3');

export default function MainScreen({ navigation }) {
  const soundRef = useRef(null);

  const handlePlay = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        MUSIC,
        { shouldPlay: true, isLooping: true, volume: 1.0 },
      );
      soundRef.current = sound;
    } catch (e) {
      console.error('Audio failed:', e?.message ?? e);
    }
    navigation.replace('Garden');
  };

  return (
    <TouchableOpacity style={styles.root} onPress={handlePlay} activeOpacity={1}>
      <Image source={MAIN_BG} style={styles.bg} resizeMode="cover" />
      <Image
        source={UI_IMAGES.play}
        style={styles.playImg}
        resizeMode="contain"
        pointerEvents="none"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  playImg: {
    position: 'absolute',
    left: '22%',
    top: '55%',
    width: 180,
    height: 80,
  },
});
