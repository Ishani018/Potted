import React, { useState, useRef } from 'react';
import { View, Text, Image, ScrollView, PanResponder, Animated, Easing, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { APT_ART, UI_IMAGES, BUTLER } from '../engine/assets';
import { APARTMENTS } from '../constants/gameData';
import { DECOR, DECOR_TABS, DECOR_START_Y, DECOR_Y_RANGE, STANDS, STAND_ORDER, standOf } from '../engine/decor';
import ScreenHud from '../components/ScreenHud';
import { pixelText } from '../components/Pixel';
import { Skinned } from '../components/NineSlice';
import InventoryOverlay from '../components/InventoryOverlay';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
// The butler is in the flat with you, just inside the front door. Tap him to chat.
const BUTLER_X = { 1: 0.2, 2: 0.14, 3: 0.14 };
const BUTLER_FEET = 0.93;
const BUTLER_M = 1.55;   // metres tall (1 m = 0.25 of the room's height, like the furniture)
const BUTLER_LINES = [
  { pose: 'wave',   text: 'Make yourself at home. I am just by the door.' },
  { pose: 'offer',  text: 'Tap DECORATE and the whole house is yours to arrange.' },
  { pose: 'tip',    text: 'The light here is lovely at sunset.' },
  { pose: 'clip',   text: 'A rug under the sofa ties a room together, I always say.' },
  { pose: 'pointR', text: 'There is more room further along, just slide across.' },
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// One placed item. In decorate mode you can drag it; a tap selects it (and shows a remove button).
function Placed({ item, W, H, edit, selected, onSelect, onMove, onDragState }) {
  const def = DECOR[item.key];
  const [pos, setPos] = useState(null);
  const start = useRef({ x: 0, y: 0 });
  const live = useRef(item);
  live.current = item;
  const size = def.size * H;
  const stand = def.plant ? STANDS[standOf(item)] : null;   // potted plants sit on a stool, stand or pedestal
  const standH = stand ? stand.w * size * stand.ratio : 0;
  const bw = def.furniture ? size * def.aspect : size;
  const boxH = def.plant ? size * def.bf + standH * 0.86 : size;   // the stand tucks up under the pot
  const x = (pos ?? item).x, y = (pos ?? item).y;
  const [lo, hi] = DECOR_Y_RANGE[def.kind];

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { start.current = { x: live.current.x, y: live.current.y }; onDragState(true); },
    onPanResponderMove: (_, g) => setPos({ x: clamp(start.current.x + g.dx / W, 0.03, 0.97), y: clamp(start.current.y + g.dy / H, lo, hi) }),
    onPanResponderRelease: (_, g) => {
      onDragState(false);
      if (Math.abs(g.dx) + Math.abs(g.dy) < 5) onSelect(); else onMove(clamp(start.current.x + g.dx / W, 0.03, 0.97), clamp(start.current.y + g.dy / H, lo, hi));
      setPos(null);
    },
    onPanResponderTerminate: () => { onDragState(false); setPos(null); },
  })).current;

  const left = x * W - bw / 2;
  const top = def.rug ? y * H - boxH / 2 : def.kind === 'floor' ? y * H - boxH : y * H - size / 2;
  return (
    <View {...(edit ? pan.panHandlers : {})} pointerEvents={edit ? 'auto' : 'none'} style={{ position: 'absolute', left, top, width: bw, height: boxH, zIndex: def.rug ? 1 : def.kind === 'floor' ? 10 + Math.round(y * 100) : 5 }}>
      {stand && <Image source={stand.img} resizeMode="stretch" style={{ position: 'absolute', left: (size - stand.w * size) / 2, bottom: 0, width: stand.w * size, height: standH }} />}
      <Image source={def.img} resizeMode={def.furniture ? 'stretch' : 'contain'} style={{ position: 'absolute', left: 0, top: 0, width: bw, height: def.furniture ? size : size,
        ...(def.rug ? { transform: [{ perspective: 520 }, { rotateX: '58deg' }] } : null) }} />
      {edit && selected && <View pointerEvents="none" style={[styles.ring, { borderRadius: size * 0.1 }]} />}
    </View>
  );
}

export default function ApartmentScreen({ navigation, route }) {
  const aptId = route?.params?.aptId ?? 1;
  const { state, dispatch } = useGame();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState(Object.values(DECOR).some((d) => d.furniture) ? 'green' : 'floor');
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const welcome = !!route?.params?.welcome;
  const [bLine, setBLine] = useState(welcome ? -1 : 0);   // -1 = handing over the keys
  const [bPose, setBPose] = useState(welcome ? 'keys' : 'idle');
  // When you walk in he strolls over from the door and acts it out with his poses; later he fidgets now and then.
  const slide = useRef(new Animated.Value(-70)).current;
  React.useEffect(() => {
    Animated.timing(slide, { toValue: 0, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    const steps = welcome
      ? [[0, 'tip', -1], [1400, 'keys', -1], [4300, 'offer', 0], [6300, 'wave', 0], [8300, 'idle', 0]]
      : [[0, 'wave', 0], [1700, 'offer', 0], [3600, 'idle', 0]];
    const ts = steps.map(([at, pose, line]) => setTimeout(() => { setBPose(pose); setBLine(line); }, at));
    return () => ts.forEach(clearTimeout);
  }, []);
  React.useEffect(() => {
    const iv = setInterval(() => {
      setBPose((cur) => {
        if (cur !== 'idle') return cur;
        const pick = ['tip', 'clip', 'bow', 'wave'][Math.floor(Math.random() * 4)];
        setTimeout(() => setBPose((c) => (c === pick ? 'idle' : c)), 2400);
        return pick;
      });
    }, 9000);
    return () => clearInterval(iv);
  }, []);
  const chat = () => { const n = bLine < 0 ? 0 : (bLine + 1) % BUTLER_LINES.length; setBLine(n); setBPose(BUTLER_LINES[n].pose); };
  const scrollX = useRef(0);
  const sw = box.w, sh = box.h;
  const art = APT_ART[aptId];
  const items = (state.player.apartmentItems ?? {})[aptId] ?? [];
  const ownedArt = state.player.ownedPaintings ?? [];

  // the room picture fills the screen's height (or its width, if that is bigger) and pans sideways
  const scale = sw > 0 ? Math.max(sh / art.h, sw / art.w) : 1;
  const W = art.w * scale, H = art.h * scale;
  const trayH = edit ? 84 : 0;
  const lift = edit ? 70 : 0;   // slide the room up so the floor isn't hidden behind the tray

  const add = (def) => {
    const cx = clamp((scrollX.current + sw / 2) / W + (Math.random() - 0.5) * 0.06, 0.06, 0.94);
    const item = { id: Date.now().toString(36) + Math.floor(Math.random() * 1e4), key: def.key, kind: def.kind, x: cx, y: DECOR_START_Y[def.kind] };
    dispatch({ type: 'PLACE_APT_ITEM', aptId, item });
    setSelected(item.id);
  };

  const tabItems = Object.values(DECOR).filter((d) => DECOR_TABS.find((t) => t.id === tab).match(d) && (d.kind !== 'wall' || ownedArt.includes(d.painting)));

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {sw > 0 && (
        <ScrollView horizontal scrollEnabled={!dragging} showsHorizontalScrollIndicator={false} scrollEventThrottle={16}
          onScroll={(e) => { scrollX.current = e.nativeEvent.contentOffset.x; }}
          style={StyleSheet.absoluteFill} contentContainerStyle={{ width: W, height: sh }}>
          <View style={{ width: W, height: sh, backgroundColor: '#1a1208' }}>
            <TouchableOpacity activeOpacity={1} onPress={() => setSelected(null)} style={{ position: 'absolute', left: 0, top: sh - H - lift, width: W, height: H }}>
              <Image source={art.src} style={{ width: W, height: H }} resizeMode="stretch" />
            </TouchableOpacity>
            <View style={{ position: 'absolute', left: 0, top: sh - H - lift, width: W, height: H }}>
              {/* the butler, standing in the flat just inside the door */}
              {(() => {
                const bh = BUTLER_M * 0.25 * H, bp = BUTLER[bPose], bw = bh * bp.w / bp.h, bx = BUTLER_X[aptId] * W, by = BUTLER_FEET * H;
                return (
                  <>
                    <Animated.View style={{ position: 'absolute', left: bx - bw / 2, top: by - bh, width: bw, height: bh, zIndex: 10 + Math.round(BUTLER_FEET * 100), transform: [{ translateX: slide }] }}>
                      <TouchableOpacity activeOpacity={1} onPress={edit ? undefined : chat} disabled={edit} style={{ width: bw, height: bh }}>
                        <Image source={bp.src} resizeMode="contain" style={{ width: bw, height: bh }} />
                      </TouchableOpacity>
                    </Animated.View>
                    {!edit && (
                      <View pointerEvents="none" style={[styles.bubble, { left: bx - 110, top: by - bh - 46, width: 220, zIndex: 400 }]}>
                        <Text style={styles.bubbleText}>{bLine < 0 ? 'Here are your keys! Welcome home.' : BUTLER_LINES[bLine].text}</Text>
                      </View>
                    )}
                  </>
                );
              })()}
              {items.map((it) => (
                <Placed key={it.id} item={it} W={W} H={H} edit={edit} selected={selected === it.id}
                  onSelect={() => setSelected(selected === it.id ? null : it.id)}
                  onMove={(x, y) => dispatch({ type: 'MOVE_APT_ITEM', aptId, id: it.id, x, y })}
                  onDragState={(d) => { setDragging(d); if (d) setSelected(it.id); }} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Settings')} onMap={() => navigation.navigate('Map')} onInventory={() => setInvOpen(true)} />

      {/* top bar: back to the floors + the flat's name */}
      <View style={styles.top} pointerEvents="box-none">
        <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.4} onPress={() => navigation.navigate('Building')} style={{ paddingVertical: 7, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={pixelText(9, '#fff')}>FLOORS</Text>
        </Skinned>
        <Text style={styles.name}>{APARTMENTS[aptId].name}</Text>
      </View>

      {selected && edit && (
        <View style={[styles.removeWrap, { bottom: trayH + 70 }]} pointerEvents="box-none">
          {DECOR[items.find((it) => it.id === selected)?.key]?.plant && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => { const it = items.find((i) => i.id === selected); dispatch({ type: 'STAND_APT_ITEM', aptId, id: selected, stand: STAND_ORDER[(STAND_ORDER.indexOf(standOf(it) ?? 'none') + 1) % STAND_ORDER.length] }); }} style={[styles.removeBtn, { backgroundColor: '#8a5a2a', borderColor: '#4a2a10', marginRight: 8 }]}>
              <Text style={styles.removeText}>CHANGE STAND</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.8} onPress={() => { dispatch({ type: 'REMOVE_APT_ITEM', aptId, id: selected }); setSelected(null); }} style={styles.removeBtn}>
            <Text style={styles.removeText}>PUT AWAY</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.decoBtn, { bottom: trayH + 14 }]}>
        <Skinned src={UI_IMAGES.pcBtnGreen} sw={112} sh={80} inset={18} scale={0.45} onPress={() => { setEdit(!edit); setSelected(null); }} style={{ paddingVertical: 9, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={pixelText(10, '#fff')}>{edit ? 'DONE' : 'DECORATE'}</Text>
        </Skinned>
      </View>

      {edit && (
        <View style={styles.tray}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.tabs}>
            {DECOR_TABS.filter((t) => Object.values(DECOR).some((d) => t.match(d))).map((t) => (
              <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} activeOpacity={0.8} style={[styles.tab, tab === t.id && styles.tabOn]}>
                <Text style={[styles.tabText, tab === t.id && { color: '#fff3d0' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 8, alignItems: 'center' }} style={{ flex: 1 }}>
            {tabItems.length === 0 && <Text style={styles.empty}>Buy paintings in the gallery to hang them here.</Text>}
            {tabItems.map((d) => (
              <TouchableOpacity key={d.key} activeOpacity={0.8} onPress={() => add(d)} style={styles.tile}>
                <Image source={d.img} resizeMode="contain" style={{ width: 48, height: 48 }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1208', overflow: 'hidden' },
  top: { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 40 },
  name: { fontFamily: SERIF, fontSize: 20, color: '#fff3d0', textShadowColor: 'rgba(40,20,5,0.95)', textShadowRadius: 6 },
  decoBtn: { position: 'absolute', right: 14, zIndex: 40 },
  removeWrap: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', zIndex: 45 },
  removeBtn: { backgroundColor: '#a63a2a', borderWidth: 2, borderColor: '#5a1a10', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 6 },
  removeText: { fontFamily: SERIF, fontSize: 15, color: '#fff3d0' },
  ring: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: '#ffe29a', borderStyle: 'dashed' },
  tray: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: 'rgba(60,34,14,0.94)', borderTopWidth: 3, borderTopColor: '#8a5a2a', zIndex: 42 },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingTop: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,230,170,0.16)' },
  tabOn: { backgroundColor: '#8a5a2a' },
  tabText: { fontFamily: SERIF, fontSize: 13, color: '#e8cf9a' },
  tile: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#f3e0b6', borderWidth: 2, borderColor: '#8a5a2a', alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', backgroundColor: '#f6e6bd', borderWidth: 2, borderColor: '#8a5a2a', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 10 },
  bubbleText: { fontFamily: SERIF, fontSize: 13, color: '#4a2a10', textAlign: 'center' },
  empty: { fontFamily: SERIF, fontSize: 14, color: '#e8cf9a' },
});
