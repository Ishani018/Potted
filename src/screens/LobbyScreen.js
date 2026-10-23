import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LOBBY_BG, BUTLER } from '../engine/assets';
import ScreenHud from '../components/ScreenHud';
import InventoryOverlay from '../components/InventoryOverlay';

// The lobby picture is 1672×941. Tap areas, as pixels of it.
const IMG_W = 1672, IMG_H = 941;
const STAIRS = { x0: 1190, y0: 270, x1: 1672, y1: 770 };
const DOOR = { x0: 40, y0: 80, x1: 300, y1: 730 };
// The butler stands behind the reception desk (picture pixels): centre x, where his feet would be, his height,
// and the desk's top edge, where he is cut off so the desk hides his legs.
const BUTLER_AT = { x: 985, feet: 640, h: 270, desk: 528 };   // a grown man behind a ~1 m desk: head to waist show
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const LINES = [
  { pose: 'wave',    text: 'Welcome home! The flats are up the stairs.' },
  { pose: 'pointR',  text: 'Mind the stairs, and do mind the cat.' },
  { pose: 'clip',    text: 'No post for you today, I am afraid.' },
  { pose: 'offer',   text: 'Take your time. I am always here at the desk.' },
  { pose: 'tip',     text: 'Anything you need, just ask.' },
];
const px = (r, sw, sh) => ({ position: 'absolute', left: (r.x0 / IMG_W) * sw, top: (r.y0 / IMG_H) * sh, width: ((r.x1 - r.x0) / IMG_W) * sw, height: ((r.y1 - r.y0) / IMG_H) * sh });

export default function LobbyScreen({ navigation }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [invOpen, setInvOpen] = useState(false);
  const [line, setLine] = useState(0);
  const [pose, setPose] = useState('wave');
  const bob = useRef(new Animated.Value(0)).current;
  const sw = box.w, sh = box.h;

  useEffect(() => { const t = setTimeout(() => setPose('idle'), 2200); return () => clearTimeout(t); }, []);

  const talk = () => { const n = (line + 1) % LINES.length; setLine(n); setPose(LINES[n].pose); };

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={LOBBY_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && (
        <>
          {/* the staircase leads up to the three floors */}
          <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Building')} style={px(STAIRS, sw, sh)}>
            <Animated.Text style={[styles.arrow, { left: '38%', top: '18%', opacity: bob.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) }] }]}>{'\u25B2\uFE0E'}</Animated.Text>
          </TouchableOpacity>

          {/* the butler, behind the desk: his legs are cut off at the desk's top edge */}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: sw, height: (BUTLER_AT.desk / IMG_H) * sh, overflow: 'hidden' }}>
            <Image source={BUTLER[pose].src} resizeMode="contain" style={{ position: 'absolute', left: ((BUTLER_AT.x - (BUTLER_AT.h * BUTLER[pose].w / BUTLER[pose].h) / 2) / IMG_W) * sw, top: ((BUTLER_AT.feet - BUTLER_AT.h) / IMG_H) * sh, width: ((BUTLER_AT.h * BUTLER[pose].w / BUTLER[pose].h) / IMG_W) * sw, height: (BUTLER_AT.h / IMG_H) * sh }} />
          </View>
          <TouchableOpacity activeOpacity={1} onPress={talk} style={{ position: 'absolute', left: ((BUTLER_AT.x - 130) / IMG_W) * sw, top: ((BUTLER_AT.feet - BUTLER_AT.h) / IMG_H) * sh, width: (260 / IMG_W) * sw, height: ((BUTLER_AT.desk - BUTLER_AT.feet + BUTLER_AT.h) / IMG_H) * sh }} />
          <View pointerEvents="none" style={[styles.bubble, { left: (560 / IMG_W) * sw, top: (205 / IMG_H) * sh, width: (330 / IMG_W) * sw }]}>
            <Text style={styles.bubbleText}>{LINES[line].text}</Text>
          </View>
          {/* the front door goes back out to the map */}
          <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Map')} style={px(DOOR, sw, sh)} />
        </>
      )}

      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Settings')} onMap={() => navigation.navigate('Map')} onInventory={() => setInvOpen(true)} />
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1208' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  bubble: { position: 'absolute', backgroundColor: '#f6e6bd', borderWidth: 2, borderColor: '#8a5a2a', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  bubbleText: { fontFamily: SERIF, fontSize: 14, color: '#4a2a10', textAlign: 'center' },
  arrow: { position: 'absolute', fontSize: 30, color: '#ffe29a', textShadowColor: 'rgba(60,30,5,0.9)', textShadowRadius: 6 },
});
