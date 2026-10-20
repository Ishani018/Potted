import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useGame } from '../context/GameContext';
import { ROOM_UNLOCK_COSTS } from '../constants/gameData';
import { PAINTING_IMAGES, PET_IMAGES, MAP_BG, UI_IMAGES, BACKGROUNDS } from '../engine/assets';
import { PixelText, COLORS } from '../components/Pixel';
import { useNotice } from '../components/PurchaseNotice';

const ROOM_NAMES = { 1: 'GREENHOUSE', 2: 'BALCONY', 3: 'SUNROOM' };
const nice = (r) => ROOM_NAMES[r][0] + ROOM_NAMES[r].slice(1).toLowerCase();
const ROOM_SHOT = {
  1: BACKGROUNDS.room1.white.summer,
  2: BACKGROUNDS.room2.white.summer,
  3: BACKGROUNDS.room3.white.summer,
};

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

// Section heading: white pixel text with a thin gold rule — no box.
function Heading({ children }) {
  return (
    <View style={styles.heading}>
      <PixelText size={11}>{children}</PixelText>
      <View style={styles.rule} />
    </View>
  );
}

function Slot({ active, onPress, children }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.slot, active && styles.slotActive]}>
      {children}
    </TouchableOpacity>
  );
}

export default function RoomScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const { player } = state;
  const [notice, notify] = useNotice();

  const currentRoom = player.currentRoom;
  const decor = player.placedDecor?.room2 ?? {};

  const handleUnlock = (room) => {
    const cost = ROOM_UNLOCK_COSTS[room];
    if (player.coins < cost) { notify({ icon: UI_IMAGES.goldcoins, title: 'Not enough coins', subtitle: `You need ${cost - player.coins} more for the ${nice(room)}.` }); return; }
    dispatch({ type: 'UNLOCK_ROOM', room });
    notify({ icon: ROOM_SHOT[room], title: `Unlocked the ${nice(room)}!`, subtitle: 'Find it from the Home screen.' });
  };
  const place = (slot, value) => dispatch({ type: 'PLACE_DECOR', room: 2, slot, value });

  const picker = (title, slot, owned, images, hint) => (
    <>
      <Heading>{title}</Heading>
      <View style={styles.row}>
        <Slot active={!decor[slot]} onPress={() => place(slot, null)}>
          <PixelText size={8}>NONE</PixelText>
        </Slot>
        {owned.map((key) => (
          <Slot key={key} active={decor[slot] === key} onPress={() => place(slot, key)}>
            <Image source={images[key]} style={styles.thumb} resizeMode="contain" />
          </Slot>
        ))}
        {owned.length === 0 && <PixelText size={8} color="#e8c890">{hint}</PixelText>}
      </View>
    </>
  );

  return (
    <View style={styles.root}>
      <Image source={MAP_BG} style={styles.bg} resizeMode="cover" />
      <View style={styles.dim} />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Image source={UI_IMAGES.back} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </TouchableOpacity>

      <View style={styles.coins}>
        <Image source={UI_IMAGES.goldcoins} style={styles.coinImg} resizeMode="contain" />
        <PixelText size={13}>{player.coins}</PixelText>
      </View>

      <ScrollView style={styles.scrollWrap} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PixelText size={22} style={styles.title}>SETTINGS</PixelText>

        <Heading>MY ROOMS</Heading>
        <View style={styles.roomGrid}>
          {[1, 2, 3].map((r) => {
            const unlocked = r === 1 || player.unlockedRooms.includes(r);
            const cost = ROOM_UNLOCK_COSTS[r];
            const afford = player.coins >= cost;
            return (
              <TouchableOpacity
                key={r}
                activeOpacity={unlocked ? 1 : 0.8}
                onPress={() => { if (!unlocked) handleUnlock(r); }}
                style={styles.roomCard}
              >
                <Image source={ROOM_SHOT[r]} style={styles.roomShot} resizeMode="cover" />
                {!unlocked && (
                  <View style={styles.lockVeil}>
                    <Padlock />
                    <View style={styles.costRow}>
                      <Image source={UI_IMAGES.goldcoins} style={{ width: 16, height: 16 }} resizeMode="contain" />
                      <PixelText size={10} color={afford ? COLORS.gold : '#ff8a8a'}>{cost}</PixelText>
                    </View>
                  </View>
                )}
                <View style={[styles.roomName, unlocked && { backgroundColor: 'rgba(29,74,20,0.88)' }]}>
                  <PixelText size={9}>{unlocked ? ROOM_NAMES[r] : `${ROOM_NAMES[r]} - LOCKED`}</PixelText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {currentRoom === 2 && (
          <>
            {picker('PHOTO FRAME', 'photoFrame', player.ownedPaintings ?? [], PAINTING_IMAGES, 'BUY PAINTINGS IN THE GALLERY')}
            {picker('PET', 'pet', player.ownedPets ?? [], PET_IMAGES, 'ADOPT PETS IN THE PET SHOP')}
          </>
        )}
      </ScrollView>

      {notice}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140c' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,8,0,0.72)' },
  back: { position: 'absolute', top: 14, left: 14, width: 52, height: 52, zIndex: 20 },
  coins: {
    position: 'absolute', top: 20, right: 20, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  coinImg: { width: 26, height: 26 },
  scrollWrap: { flex: 1 },
  scroll: { alignItems: 'center', paddingTop: 22, paddingBottom: 40, paddingHorizontal: 24 },
  title: { marginBottom: 18 },
  heading: { alignSelf: 'stretch', maxWidth: 720, marginTop: 22, marginBottom: 12 },
  rule: { height: 3, backgroundColor: 'rgba(255,208,96,0.55)', marginTop: 8, borderRadius: 2 },
  row: { alignSelf: 'stretch', maxWidth: 720, flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  slot: {
    width: 62, height: 62, borderRadius: 6, backgroundColor: 'rgba(255,243,214,0.14)',
    borderWidth: 2, borderColor: 'rgba(255,243,214,0.35)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  slotActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(255,208,96,0.22)' },
  thumb: { width: 54, height: 54 },
  roomGrid: { alignSelf: 'stretch', maxWidth: 720, flexDirection: 'row', gap: 14 },
  roomCard: { flex: 1, aspectRatio: 1.5, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' },
  roomShot: { width: '100%', height: '100%' },
  lockVeil: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,10,0,0.64)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  roomName: {
    position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingVertical: 6,
    backgroundColor: 'rgba(42,22,8,0.85)',
  },
});
