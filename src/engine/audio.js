import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

// One shared music player for the whole game, so the title screen and the
// settings screen control the same thing. Preferences are saved on the device.
const MUSIC = require('../../assets/Sunlight_on_the_Sprouts.mp3');
const KEY = '@potted_audio_v1';

let sound = null;
let starting = null;
// music = the looping song; sfx = one-off sounds; goose = the goose's honks (a part of sfx, with its own switch)
let prefs = { musicOn: true, volume: 0.8, sfxOn: true, sfxVolume: 1, gooseOn: true };   // volumes 0..1
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
        sfxOn: saved.sfxOn !== false,
        sfxVolume: typeof saved.sfxVolume === 'number' ? Math.max(0, Math.min(1, saved.sfxVolume)) : prefs.sfxVolume,
        gooseOn: saved.gooseOn !== false,
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

export async function setSfxOn(on) { prefs = { ...prefs, sfxOn: !!on }; emit(); save(); }
export async function setGooseOn(on) { prefs = { ...prefs, gooseOn: !!on }; emit(); save(); }
// v: 0..1 (rounded to steps of 0.1)
export async function setSfxVolume(v) { prefs = { ...prefs, sfxVolume: Math.round(Math.max(0, Math.min(1, v)) * 10) / 10 }; emit(); save(); }

// A short one-off sound effect (a honk, a chime). Follows the sound-effects switch and volume.
// opts.goose marks a goose sound, which also needs the goose switch on.
export async function playSfx(source, gain = 1, opts = {}) {
  if (!prefs.sfxOn || (opts.goose && !prefs.gooseOn)) return;
  const volume = Math.max(0, Math.min(1, prefs.sfxVolume * gain));
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Audio) {
      // on the web a plain audio element is the most dependable way to fire a short sound
      const uri = Asset.fromModule(source).uri;
      const a = new window.Audio(uri);
      a.volume = volume;
      const p = a.play();
      if (p && p.catch) p.catch((e) => console.warn('Sound effect was blocked:', e?.message ?? e));
      return;
    }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    const { sound: fx } = await Audio.Sound.createAsync(source, { volume, shouldPlay: true });
    fx.setOnPlaybackStatusUpdate((st) => { if (st.didJustFinish) fx.unloadAsync(); });
  } catch (e) { console.warn('Sound effect failed:', e?.message ?? e); }
}
