import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

// One shared music player for the whole game, so the title screen and the
// settings screen control the same thing. Preferences are saved on the device.
const MUSIC = require('../../assets/Sunlight_on_the_Sprouts.mp3');
const KEY = '@potted_audio_v1';

let sound = null;
let starting = null;
let prefs = { musicOn: true, volume: 0.8 };   // volume 0..1
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn({ ...prefs }));

export const getAudioPrefs = () => ({ ...prefs });

// Call with a function that receives the prefs whenever they change. Returns an unsubscribe.
export function subscribeAudio(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function apply() {
  if (!sound) return;
  try {
    await sound.setVolumeAsync(prefs.volume);
    await sound.setIsMutedAsync(!prefs.musicOn);
  } catch { /* the sound may have been unloaded */ }
}

async function save() {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* not critical */ }
}

// Read the saved preferences (call once at startup).
export async function loadAudioPrefs() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      prefs = {
        musicOn: saved.musicOn !== false,
        volume: typeof saved.volume === 'number' ? Math.max(0, Math.min(1, saved.volume)) : prefs.volume,
      };
      emit();
      await apply();
    }
  } catch { /* fall back to defaults */ }
}

// Create the looping music (once) and start it. Safe to call repeatedly — if it
// already exists it just resumes. Browsers may block autoplay until a user
// gesture, so the PLAY button calls this too. We never unload it, so it carries
// on into the game.
export async function ensureMusic() {
  if (sound) {
    try { await sound.playAsync(); } catch { /* ignore */ }
    return;
  }
  if (starting) return starting;
  starting = (async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound: s } = await Audio.Sound.createAsync(
        MUSIC,
        { shouldPlay: true, isLooping: true, volume: prefs.volume, isMuted: !prefs.musicOn },
      );
      sound = s;
    } catch (e) {
      console.error('Audio failed:', e?.message ?? e);
    } finally {
      starting = null;
    }
  })();
  return starting;
}

export async function setMusicOn(on) {
  prefs = { ...prefs, musicOn: !!on };
  emit();
  save();
  await ensureMusic();   // also starts the music if autoplay was blocked
  await apply();
}

// v: 0..1 (rounded to steps of 0.1)
export async function setMusicVolume(v) {
  prefs = { ...prefs, volume: Math.round(Math.max(0, Math.min(1, v)) * 10) / 10 };
  emit();
  save();
  await apply();
}
