import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useGame } from '../context/GameContext';
import { ROOM_UNLOCK_COSTS } from '../constants/gameData';
import { PAINTING_IMAGES, PET_IMAGES, MAP_BG, UI_IMAGES, BACKGROUNDS } from '../engine/assets';
import { PixelText, COLORS } from '../components/Pixel';
import { useNotice } from '../components/PurchaseNotice';

// Settings — built from the painted pieces in assets/ui_comps (board, hanging
// title sign, back sign, ribbons, slot tiles, vines…), laid out on 1376×768 base.
const W = 1376;
const H = 768;
const ROOM_NAMES = { 1: 'GREENHOUSE', 2: 'BALCONY', 3: 'SUNROOM' };
const nice = (r) => ROOM_NAMES[r][0] + ROOM_NAMES[r].slice(1).toLowerCase();
const ROOM_SHOT = {
  1: BACKGROUNDS.room1.white.summer,
  2: BACKGROUNDS.room2.white.summer,
  3: BACKGROUNDS.room3.white.summer,
};
const INK = '#4a2a10';

// Little pixel padlock built from blocks (no asset needed).
function Padlock({ size = 34 }) {
  const u = size / 10;
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View style={{ width: u * 6, height: u * 5, borderWidth: u * 1.2, borderBottomWidth: 0, borderColor: '#e8e0d0', borderTopLeftRadius: u * 3, borderTopRightRadius: u * 3 }} />
      <View style={{ width: u * 9, height: u * 5.5, marginTop: -u * 0.5, backgroundColor: COLORS.gold, borderWidth: u * 0.9, borderColor: COLORS.woodEdge, borderRadius: u, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: u * 1.6, height: u * 2.4, backgroundColor: COLORS.woodEdge, borderRadius: u * 0.4 }} />
      </View>
    </View>
  );
}

export default function RoomScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const { player } = state;
  const [notice, notify] = useNotice();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const photoRef = useRef(null);
  const petRef = useRef(null);
  const sw = box.w, sh = box.h;
  const fx = (v) => (v / W) * sw;
  const fy = (v) => (v / H) * sh;
  const fs = (n, min = 6) => Math.max(min, Math.round(fx(n)));

  const currentRoom = player.currentRoom;
  const decor = player.placedDecor?.room2 ?? {};

  const handleUnlock = (room) => {
    const cost = ROOM_UNLOCK_COSTS[room];
    if (player.coins < cost) {
      notify({ icon: UI_IMAGES.goldcoins, title: 'Not enough coins', subtitle: `You need ${cost - player.coins} more for the ${nice(room)}.` });
      return;
    }
    dispatch({ type: 'UNLOCK_ROOM', room });
    notify({ icon: ROOM_SHOT[room], title: `Unlocked the ${nice(room)}!`, subtitle: 'Find it from the Home screen.' });
  };
  const place = (slot, value) => dispatch({ type: 'PLACE_DECOR', room: 2, slot, value });

  const Ribbon = ({ label, top, w = 280 }) => (
    <View style={{ position: 'absolute', left: fx(215), top: fy(top), width: fx(w), height: fx(w) * (22 / 100) }}>
      <Image source={UI_IMAGES.ribbon} style={styles.fill} resizeMode="stretch" />
      <View style={{ ...StyleSheet.absoluteFillObject, paddingRight: fx(34), alignItems: 'center', justifyContent: 'center' }}>
        <PixelText size={fs(15, 8)} color={INK} style={styles.noShadow}>{label}</PixelText>
      </View>
    </View>
  );

  const Divider = ({ top }) => (
    <Image source={UI_IMAGES.dividerPaw} style={{ position: 'absolute', left: fx(215), top: fy(top), width: fx(946), height: fx(946) / 20 }} resizeMode="stretch" />
  );

  // A row of selectable tiles: NONE + items, with a scroll arrow when it overflows.
  const picker = (top, slot, items, images, scrollRef) => {
    const tile = fx(62), gap = fx(10);
    const rowW = fx(946) - fx(54);
    const overflow = (items.length + 1) * (tile + gap) > rowW;
    return (
      <>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ position: 'absolute', left: fx(215), top: fy(top), width: overflow ? rowW : fx(946), height: tile }}
          contentContainerStyle={{ gap, alignItems: 'center' }}
        >
          <TouchableOpacity activeOpacity={0.85} onPress={() => place(slot, null)} style={{ width: tile, height: tile }}>
            <Image source={!decor[slot] ? UI_IMAGES.slotTileOn : UI_IMAGES.slotNone} style={styles.fill} resizeMode="stretch" />
            <View style={styles.noneLbl}><PixelText size={fs(8, 6)} color={INK} style={styles.noShadow}>NONE</PixelText></View>
          </TouchableOpacity>
          {items.map((key) => (
            <TouchableOpacity key={key} activeOpacity={0.85} onPress={() => place(slot, key)} style={{ width: tile, height: tile, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={decor[slot] === key ? UI_IMAGES.slotTileOn : UI_IMAGES.slotTile} style={styles.fill} resizeMode="stretch" />
              <Image source={images[key]} style={{ width: tile * 0.78, height: tile * 0.78 }} resizeMode="contain" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {overflow && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: true })}
            style={{ position: 'absolute', left: fx(215) + rowW + fx(10), top: fy(top) + (tile - fx(46)) / 2, width: fx(36), height: fx(46) }}
          >
            <Image source={UI_IMAGES.nextBtn} style={{ width: '100%', height: '100%' }} resizeMode="stretch" />
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={MAP_BG} style={styles.bg} resizeMode="cover" />
      <View style={styles.dim} />

      {sw > 0 && (
        <>
          {/* board + vines + corner decor */}
          <Image source={UI_IMAGES.settingsBoard} style={{ position: 'absolute', left: fx(160), top: fy(120), width: fx(1056), height: fx(1056) * (160 / 292) }} resizeMode="stretch" />
          <Image source={UI_IMAGES.vineLeft} style={{ position: 'absolute', left: fx(99), top: fy(100), width: fx(122), height: fx(122) * 5 }} resizeMode="stretch" />
          <Image source={UI_IMAGES.vineRight} style={{ position: 'absolute', left: fx(1155), top: fy(100), width: fx(122), height: fx(122) * 5 }} resizeMode="stretch" />
          <Image source={UI_IMAGES.decoPlant} style={{ position: 'absolute', left: fx(86), top: fy(584), width: fx(150), height: fx(180) }} resizeMode="stretch" />
          <Image source={UI_IMAGES.decoCrate} style={{ position: 'absolute', left: fx(1150), top: fy(570), width: fx(200), height: fx(184) }} resizeMode="stretch" />

          {/* hanging title sign */}
          <View style={{ position: 'absolute', left: fx(428), top: fy(26), width: fx(520), height: fx(520) * (38 / 140) }}>
            <Image source={UI_IMAGES.settingsTitle} style={styles.fill} resizeMode="stretch" />
            <View style={{ ...StyleSheet.absoluteFillObject, top: '24%', alignItems: 'center', justifyContent: 'center' }}>
              <PixelText size={fs(34, 14)}>SETTINGS</PixelText>
            </View>
          </View>

          {/* back sign (top-left) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', left: fx(34), top: fy(14), width: fx(190), height: fx(95) }}
          >
            <Image source={UI_IMAGES.backSign} style={styles.fill} resizeMode="stretch" />
            <View style={{ ...StyleSheet.absoluteFillObject, top: '20%', paddingRight: '10%', alignItems: 'center', justifyContent: 'center' }}>
              <PixelText size={fs(22, 10)}>{'< BACK'}</PixelText>
            </View>
          </TouchableOpacity>

          {/* coins (top-right) */}
          <View style={{ position: 'absolute', right: fx(40), top: fy(22), width: fx(240), height: fx(80) }}>
            <Image source={UI_IMAGES.coinPlaque} style={styles.fill} resizeMode="stretch" />
            <View style={{ ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: fx(12) }}>
              <Image source={UI_IMAGES.goldcoins} style={{ width: fx(46), height: fx(46) }} resizeMode="contain" />
              <PixelText size={fs(24, 10)}>{player.coins}</PixelText>
            </View>
          </View>

          {/* ── MY ROOMS ── */}
          <Ribbon label="MY ROOMS" top={150} w={260} />
          {[1, 2, 3].map((r, i) => {
            const unlocked = r === 1 || player.unlockedRooms.includes(r);
            const cost = ROOM_UNLOCK_COSTS[r];
            const afford = player.coins >= cost;
            const cur = unlocked && currentRoom === r;
            return (
              <TouchableOpacity
                key={r}
                activeOpacity={unlocked ? 1 : 0.85}
                onPress={() => { if (!unlocked) handleUnlock(r); }}
                style={[styles.card, { left: fx(215 + i * 326), top: fy(220), width: fx(294), height: fy(125) }, cur && styles.cardOn]}
              >
                <Image source={ROOM_SHOT[r]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {!unlocked && (
                  <View style={styles.veil}>
                    <Padlock size={fx(40)} />
                    <View style={styles.costRow}>
                      <Image source={UI_IMAGES.goldcoins} style={{ width: fx(22), height: fx(22) }} resizeMode="contain" />
                      <PixelText size={fs(14, 8)} color={afford ? COLORS.gold : '#ff8a8a'}>{cost}</PixelText>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          {[1, 2, 3].map((r, i) => {
            const unlocked = r === 1 || player.unlockedRooms.includes(r);
            return (
              <View key={`n${r}`} pointerEvents="none" style={{ position: 'absolute', left: fx(215 + i * 326) + fx(294) / 2 - fx(100), top: fy(220) + fy(125) - fx(30), width: fx(200), height: fx(200) / 6 }}>
                <Image source={UI_IMAGES.roomRibbon} style={styles.fill} resizeMode="stretch" />
                <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}>
                  <PixelText size={fs(10, 6)} color={INK} style={styles.noShadow}>{unlocked ? ROOM_NAMES[r] : `${ROOM_NAMES[r]} - LOCKED`}</PixelText>
                </View>
              </View>
            );
          })}

          <Divider top={350} />

          {/* ── PHOTO FRAME ── */}
          <Ribbon label="PHOTO FRAME" top={392} w={270} />
          {picker(458, 'photoFrame', player.ownedPaintings ?? [], PAINTING_IMAGES, photoRef)}

          <Divider top={510} />

          {/* ── PET ── */}
          <Ribbon label="PET" top={552} w={190} />
          {picker(600, 'pet', player.ownedPets ?? [], PET_IMAGES, petRef)}
        </>
      )}

      {notice}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140c' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,8,0,0.7)' },
  fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  noShadow: { textShadowColor: 'transparent', textShadowRadius: 0 },
  card: { position: 'absolute', borderRadius: 10, overflow: 'hidden', borderWidth: 3, borderColor: '#d3b27a', backgroundColor: '#000' },
  cardOn: { borderColor: '#3f7a2e' },
  veil: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,10,0,0.62)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  noneLbl: { position: 'absolute', left: 0, right: 0, bottom: 6, alignItems: 'center' },
});
