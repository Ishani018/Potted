import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useGame } from '../context/GameContext';
import { ROOM_UNLOCK_COSTS } from '../constants/gameData';
import { PAINTING_IMAGES, PET_IMAGES, MAP_BG, UI_IMAGES, BACKGROUNDS } from '../engine/assets';
import { PixelText, COLORS } from '../components/Pixel';
import { useNotice } from '../components/PurchaseNotice';
import BackSign from '../components/BackSign';

// Settings — the painted panel (settings_panel.png, 1609×977) fills the screen;
// everything interactive is laid over its painted slots. Coordinates below are in
// that image's own pixels; `k` maps them to the screen.
const IMG_W = 1609;
const IMG_H = 977;

const ROOM_NAMES = { 1: 'GREENHOUSE', 2: 'BALCONY', 3: 'SUNROOM' };
const nice = (r) => ROOM_NAMES[r][0] + ROOM_NAMES[r].slice(1).toLowerCase();
const ROOM_SHOT = {
  1: BACKGROUNDS.room1.white.summer,
  2: BACKGROUNDS.room2.white.summer,
  3: BACKGROUNDS.room3.white.summer,
};

const ROOM_CARDS = [
  { room: 1, x: 252,  y: 218, w: 360, h: 248 },
  { room: 2, x: 628,  y: 218, w: 360, h: 248 },
  { room: 3, x: 1003, y: 218, w: 360, h: 248 },
];
const PHOTO_NONE = { x: 252, y: 550, w: 131, h: 118 };
const PHOTO_TILES = [393, 524, 655, 787, 918, 1049, 1181].map((x) => ({ x, y: 550, w: 124, h: 118 }));
const PHOTO_ARROW = { x: 1327, y: 580, w: 60, h: 58 };
const PET_NONE = { x: 252, y: 745, w: 136, h: 128 };
const PET_TILES = [401, 567, 732, 897, 1063].map((x) => ({ x, y: 744, w: 160, h: 130 }));
const PET_ARROW = { x: 1245, y: 783, w: 60, h: 58 };

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
  const [photoPage, setPhotoPage] = useState(0);
  const [petPage, setPetPage] = useState(0);

  const sw = box.w, sh = box.h;
  const k = sh / IMG_H;                       // image px → screen px (fit to height)
  const imgW = IMG_W * k;
  const left0 = (sw - imgW) / 2;
  const R = (r) => ({ position: 'absolute', left: left0 + r.x * k, top: r.y * k, width: r.w * k, height: r.h * k });

  const currentRoom = player.currentRoom;
  const decor = player.placedDecor?.room2 ?? {};
  const paintings = player.ownedPaintings ?? [];
  const pets = player.ownedPets ?? [];
  const placements = player.petPlacements ?? {};

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

  // Selected-tile highlight laid over a painted slot.
  const Sel = ({ r }) => (
    <View pointerEvents="none" style={[R(r), styles.sel, { borderRadius: 14 * k, borderWidth: Math.max(2, 4 * k) }]} />
  );

  // One row of slots: NONE + a page of items.
  const row = (slot, none, tiles, items, page, setPage, arrow, images, h) => {
    const perPage = tiles.length;
    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const shown = items.slice(page * perPage, page * perPage + perPage);
    return (
      <>
        <TouchableOpacity activeOpacity={0.8} onPress={h.none} style={R(none)} />
        {h.noneOn && <Sel r={none} />}
        {shown.map((key, i) => {
          const t = tiles[i];
          const on = h.isOn(key);
          return (
            <React.Fragment key={key}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => h.pick(key)} style={[R(t), { alignItems: 'center', justifyContent: 'center' }]}>
                <Image source={images[key]} style={{ width: '78%', height: '78%' }} resizeMode="contain" />
              </TouchableOpacity>
              {on && <Sel r={t} />}
            </React.Fragment>
          );
        })}
        {items.length === 0 && (
          <View pointerEvents="none" style={[R({ x: tiles[0].x, y: tiles[0].y, w: tiles[tiles.length - 1].x + tiles[tiles.length - 1].w - tiles[0].x, h: tiles[0].h }), { alignItems: 'center', justifyContent: 'center' }]}>
            <PixelText size={Math.max(7, Math.round(17 * k))} color="#9a7440" style={styles.noShadow}>
              {slot === 'pet' ? 'ADOPT PETS AT THE PET SHOP' : 'BUY PAINTINGS AT THE GALLERY'}
            </PixelText>
          </View>
        )}
        {pages > 1 && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setPage((page + 1) % pages)} style={R(arrow)}>
            <Image source={UI_IMAGES.nextBtn} style={styles.fill} resizeMode="stretch" />
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
          <Image source={UI_IMAGES.settingsPanel} style={{ position: 'absolute', left: left0, top: 0, width: imgW, height: sh }} resizeMode="stretch" />

          {/* room cards */}
          {ROOM_CARDS.map((c) => {
            const unlocked = c.room === 1 || player.unlockedRooms.includes(c.room);
            const cost = ROOM_UNLOCK_COSTS[c.room];
            const afford = player.coins >= cost;
            const cur = unlocked && currentRoom === c.room;
            return (
              <React.Fragment key={c.room}>
                <TouchableOpacity
                  activeOpacity={unlocked ? 1 : 0.85}
                  onPress={() => { if (!unlocked) handleUnlock(c.room); }}
                  style={R(c)}
                >
                  {!unlocked && (
                    <View style={[styles.veil, { borderRadius: 16 * k }]}>
                      <Padlock size={Math.max(24, 78 * k)} />
                      <View style={styles.costRow}>
                        <Image source={UI_IMAGES.goldcoins} style={{ width: 40 * k, height: 40 * k }} resizeMode="contain" />
                        <PixelText size={Math.max(9, Math.round(34 * k))} color={afford ? COLORS.gold : '#ff8a8a'}>{cost}</PixelText>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
                {cur && <Sel r={c} />}
              </React.Fragment>
            );
          })}

          {row('photoFrame', PHOTO_NONE, PHOTO_TILES, paintings, photoPage, setPhotoPage, PHOTO_ARROW, PAINTING_IMAGES, {
            none: () => place('photoFrame', null), noneOn: !decor.photoFrame,
            isOn: (key) => decor.photoFrame === key, pick: (key) => place('photoFrame', key),
          })}
          {/* Pets: tap to move a pet into / out of the Balcony; NONE sends them all back */}
          {row('pet', PET_NONE, PET_TILES, pets, petPage, setPetPage, PET_ARROW, PET_IMAGES, {
            none: () => pets.forEach((k) => { if (placements[k] === 2) dispatch({ type: 'PLACE_PET', petKey: k, room: null }); }),
            noneOn: !pets.some((k) => placements[k] === 2),
            isOn: (key) => placements[key] === 2,
            pick: (key) => dispatch({ type: 'PLACE_PET', petKey: key, room: placements[key] === 2 ? null : 2 }),
          })}

          {/* coins (top-right) */}
          <View style={{ position: 'absolute', right: 14, top: 10, width: Math.max(120, sw * 0.17), height: Math.max(40, sw * 0.17 / 3) }}>
            <Image source={UI_IMAGES.coinPlaque} style={styles.fill} resizeMode="stretch" />
            <View style={{ ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Image source={UI_IMAGES.goldcoins} style={{ width: 26, height: 26 }} resizeMode="contain" />
              <PixelText size={Math.max(10, Math.round(sw * 0.0175))}>{player.coins}</PixelText>
            </View>
          </View>
        </>
      )}

      <BackSign onPress={() => navigation.goBack()} />
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
  sel: { borderColor: '#3f7a2e', backgroundColor: 'rgba(63,122,46,0.14)' },
  veil: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,10,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
