import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, TouchableOpacity, StyleSheet } from 'react-native';
import { LOBBY_BG } from '../engine/assets';
import ScreenHud from '../components/ScreenHud';
import InventoryOverlay from '../components/InventoryOverlay';

// The lobby picture is 1672×941. Tap areas, as pixels of it.
const IMG_W = 1672, IMG_H = 941;
const STAIRS = { x0: 1190, y0: 270, x1: 1672, y1: 770 };
const DOOR = { x0: 40, y0: 80, x1: 300, y1: 730 };
const px = (r, sw, sh) => ({ position: 'absolute', left: (r.x0 / IMG_W) * sw, top: (r.y0 / IMG_H) * sh, width: ((r.x1 - r.x0) / IMG_W) * sw, height: ((r.y1 - r.y0) / IMG_H) * sh });

export default function LobbyScreen({ navigation }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [invOpen, setInvOpen] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const sw = box.w, sh = box.h;

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
  arrow: { position: 'absolute', fontSize: 30, color: '#ffe29a', textShadowColor: 'rgba(60,30,5,0.9)', textShadowRadius: 6 },
});
