import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, ScrollView, Animated, Easing, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { BUILDING_BG, UI_IMAGES, BUTLER } from '../engine/assets';
import { APARTMENTS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import { pixelText } from '../components/Pixel';
import { Skinned } from '../components/NineSlice';
import InventoryOverlay from '../components/InventoryOverlay';
import Bubble from '../components/Bubble';
import Goose from '../components/Goose';

// The building picture is 1672×941. Each door's tap area, in its pixels.
const IMG_W = 1672, IMG_H = 941;
const DOORS = {
  3: { x0: 480, y0: 70,  x1: 780, y1: 290 },
  2: { x0: 562, y0: 345, x1: 765, y1: 578 },
  1: { x0: 582, y0: 655, x1: 755, y1: 868 },
};
const FLOOR_Y = { 3: 300, 2: 585, 1: 875 };     // where the floor is on each storey (picture pixels)
const FLOOR_NAME = { 1: 'Ground floor', 2: 'First floor', 3: 'Top floor' };
const ZOOM = 1.6;                                // how far the picture is zoomed in; you scroll between floors
const FOCUS_X = 0.42;                            // the doors' side of the picture stays in view
const BUTLER_X = 405;                            // he waits just left of each door
const BUTLER_H = 172;                            // about 1.65 m next to a ~2.1 m door (213 px)
const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function BuildingScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [asking, setAsking] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const [floor, setFloor] = useState(1);
  const [pose, setPose] = useState('wave');
  const [say, setSay] = useState(null);       // what the butler is saying (null = nothing)
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState(false);   // the goose is being carried: don't scroll the building
  const scroller = useRef(null);
  const slide = useRef(new Animated.Value(-60)).current;
  const sw = box.w, sh = box.h;
  const owned = state.player.ownedApartments ?? [];
  const coins = state.player.coins;

  const W = sw * ZOOM, H = W * IMG_H / IMG_W, k = W / IMG_W;
  const xOff = clamp(sw / 2 - FOCUS_X * W, sw - W, 0);
  const offsetFor = (f) => clamp((FLOOR_Y[f] - 250) * k - sh / 2 + 120 * k, 0, Math.max(0, H - sh));

  useEffect(() => { if (sw > 0 && scroller.current) scroller.current.scrollTo({ y: offsetFor(1), animated: false }); }, [sw, sh]);

  // he greets you whenever you reach a floor
  useEffect(() => {
    slide.setValue(-60);
    Animated.timing(slide, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    setPose('wave'); setSay(null);
    const t = setTimeout(() => setPose('idle'), 2000);
    return () => clearTimeout(t);
  }, [floor]);

  const go = (f) => { if (f < 1 || f > 3) return; setFloor(f); scroller.current && scroller.current.scrollTo({ y: offsetFor(f), animated: true }); };
  const onScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const nearest = [1, 2, 3].reduce((a, f) => (Math.abs(offsetFor(f) - y) < Math.abs(offsetFor(a) - y) ? f : a), 1);
    if (nearest !== floor) setFloor(nearest);
  };

  const chat = () => {
    const apt = APARTMENTS[floor];
    if (owned.includes(floor)) { setPose('offer'); setSay(`Your ${apt.name.toLowerCase()} is right here. Shall we go in?`); }
    else { setPose('clip'); setSay(`${apt.name}: ${apt.size.toLowerCase()}, ${apt.price} coins. Just tap the door.`); }
    setTimeout(() => { setPose('idle'); setSay(null); }, 3600);
  };

  const tapDoor = (id) => {
    if (busy) return;
    if (owned.includes(id)) navigation.navigate('Apartment', { aptId: id });
    else setAsking(id);
  };

  const buy = () => {
    const id = asking, price = APARTMENTS[id].price;
    dispatch({ type: 'BUY_APARTMENT', aptId: id, price });
    setAsking(null); setBusy(true);
    setPose('keys'); setSay('Here are your keys! Welcome home.');
    setTimeout(() => { setBusy(false); setPose('idle'); setSay(null); navigation.navigate('Apartment', { aptId: id }); }, 2800);
  };

  const bp = BUTLER[pose], bh = BUTLER_H * k, bw = bh * bp.w / bp.h;
  const canBuy = asking && coins >= APARTMENTS[asking].price;

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {sw > 0 && (
        <ScrollView ref={scroller} scrollEnabled={!held} showsVerticalScrollIndicator={false} scrollEventThrottle={32} onScroll={onScroll} style={StyleSheet.absoluteFill} contentContainerStyle={{ width: sw, height: H }}>
          <View style={{ position: 'absolute', left: xOff, top: 0, width: W, height: H }}>
            <Image source={BUILDING_BG} style={{ width: W, height: H }} resizeMode="stretch" />

            {[1, 2, 3].map((id) => {
              const d = DOORS[id], isOwned = owned.includes(id);
              const w = (d.x1 - d.x0) * k;
              return (
                <TouchableOpacity key={id} activeOpacity={0.85} onPress={() => tapDoor(id)} style={{ position: 'absolute', left: d.x0 * k, top: d.y0 * k, width: w, height: (d.y1 - d.y0) * k, alignItems: 'center', justifyContent: 'center', borderRadius: w * 0.25, backgroundColor: isOwned ? 'transparent' : 'rgba(30,16,6,0.38)' }}>
                  {!isOwned && (
                    <View style={styles.lockChip}>
                      <Text style={styles.lockText}>{'\u{1F512}'}</Text>
                      <Image source={UI_IMAGES.goldcoins} style={{ width: 18, height: 18 }} resizeMode="contain" />
                      <Text style={styles.lockText}>{APARTMENTS[id].price}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* the goose follows you up the stairs and waddles along the landing */}
            <Goose k={k} bounds={{ x0: 500, x1: 1150, y0: FLOOR_Y[floor] - 14, y1: FLOOR_Y[floor] + 18 }} imgH={IMG_H} base={0.42} disabled={busy} onHold={setHeld} zOf={() => 8} />

            {/* the butler waits beside the door on whichever floor you are on */}
            <Animated.View style={{ position: 'absolute', left: BUTLER_X * k - bw / 2, top: FLOOR_Y[floor] * k - bh, width: bw, height: bh, transform: [{ translateX: slide }] }}>
              <TouchableOpacity activeOpacity={1} onPress={chat} style={{ width: bw, height: bh }}>
                <Image source={bp.src} resizeMode="contain" style={{ width: bw, height: bh }} />
              </TouchableOpacity>
            </Animated.View>
            {say && <Bubble flip width={235 * k} text={say} style={{ left: BUTLER_X * k - 0.22 * 235 * k, top: FLOOR_Y[floor] * k - bh - 235 * k * 0.414 - 6 * k }} />}
          </View>
        </ScrollView>
      )}

      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Settings')} onMap={() => navigation.navigate('Map')} onInventory={() => setInvOpen(true)} />

      {/* floor switcher */}
      <Text style={styles.floorName} pointerEvents="none">{FLOOR_NAME[floor]}</Text>
      <View style={styles.arrows}>
        {floor < 3 && (
          <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.42} onPress={() => go(floor + 1)} style={styles.arrowBtn}>
            <Text style={pixelText(9, '#fff')}>UP</Text>
          </Skinned>
        )}
        {floor > 1 && (
          <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.42} onPress={() => go(floor - 1)} style={styles.arrowBtn}>
            <Text style={pixelText(9, '#fff')}>DOWN</Text>
          </Skinned>
        )}
      </View>

      {asking && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setAsking(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            <Text style={styles.title}>{APARTMENTS[asking].name}</Text>
            <Text style={styles.sub}>{APARTMENTS[asking].floor} · {APARTMENTS[asking].size}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 10 }}>
              <Image source={UI_IMAGES.goldcoins} style={{ width: 24, height: 24 }} resizeMode="contain" />
              <Text style={[styles.title, { fontSize: 24 }]}>{APARTMENTS[asking].price}</Text>
            </View>
            <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.5} disabled={!canBuy} onPress={canBuy ? buy : undefined} style={{ paddingVertical: 11, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={pixelText(11, '#fff')}>{canBuy ? 'BUY' : `NEED ${APARTMENTS[asking].price - coins} MORE`}</Text>
            </Skinned>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1208', overflow: 'hidden' },
  lockChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(40,22,8,0.78)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  lockText: { fontFamily: SERIF, fontSize: 15, color: '#ffe9b8' },
  floorName: { position: 'absolute', top: 12, alignSelf: 'center', overflow: 'hidden', backgroundColor: 'rgba(60,34,14,0.82)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 3, fontFamily: SERIF, fontSize: 18, color: '#fff3d0', zIndex: 40 },
  arrows: { position: 'absolute', right: 14, top: '40%', gap: 10, zIndex: 40 },
  arrowBtn: { paddingVertical: 9, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', backgroundColor: '#f6e6bd', borderWidth: 2, borderColor: '#8a5a2a', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 10 },
  bubbleText: { fontFamily: SERIF, fontSize: 13, color: '#4a2a10', textAlign: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  card: { backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 28, alignItems: 'center', maxWidth: 360 },
  title: { fontFamily: SERIF, fontSize: 22, color: '#4a2a10', textAlign: 'center', fontWeight: 'bold' },
  sub: { fontFamily: SERIF, fontSize: 14, color: '#7a5030', textAlign: 'center', marginTop: 2 },
});
