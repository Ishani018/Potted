import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useGame } from '../context/GameContext';
import { WALL_COLORS, ROOM_UNLOCK_COSTS } from '../constants/gameData';
import { PAINTING_IMAGES, PET_IMAGES, MAP_BG, UI_IMAGES } from '../engine/assets';
import { PixelText, PixelPanel, PixelButton, PixelToast, COLORS } from '../components/Pixel';

const COLOR_SWATCH = { green: '#4a8a3a', pink: '#d07090', white: '#e8e0d0' };
const ROOM_NAMES = { 2: 'BALCONY', 3: 'SUNROOM' };
const ROOM_DESC = {
  2: 'HANGING RODS, PHOTO FRAME & A PET',
  3: 'GLASS CONSERVATORY & TIERED STAND',
};

// Section label in the same pixel style as the map signs.
function Label({ children }) {
  return (
    <View style={styles.label}>
      <PixelText size={11}>{children}</PixelText>
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
  const [toast, setToast] = React.useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 1600); };

  const currentRoom = player.currentRoom;
  const availableColors = WALL_COLORS[`room${currentRoom}`] ?? ['white'];
  const currentColor = player.wallColor[`room${currentRoom}`] ?? availableColors[0];
  const decor = player.placedDecor?.room2 ?? {};

  const handleUnlock = (room) => {
    const cost = ROOM_UNLOCK_COSTS[room];
    if (player.coins < cost) { showToast(`NEED ${cost} COINS`); return; }
    dispatch({ type: 'UNLOCK_ROOM', room });
  };
  const place = (slot, value) => dispatch({ type: 'PLACE_DECOR', room: 2, slot, value });

  const picker = (title, slot, owned, images, hint) => (
    <>
      <Label>{title}</Label>
      <View style={styles.row}>
        <Slot active={!decor[slot]} onPress={() => place(slot, null)}>
          <PixelText size={8} color="#5a3410" style={styles.dark}>NONE</PixelText>
        </Slot>
        {owned.map((key) => (
          <Slot key={key} active={decor[slot] === key} onPress={() => place(slot, key)}>
            <Image source={images[key]} style={styles.thumb} resizeMode="contain" />
          </Slot>
        ))}
        {owned.length === 0 && <PixelText size={8} color="#8a5a24" style={styles.dark}>{hint}</PixelText>}
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

      <View style={styles.center}>
        <PixelPanel style={styles.board}>
          <PixelText size={20} style={styles.title}>SETTINGS</PixelText>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <PixelPanel cream>
              {currentRoom !== 1 && (
                <>
                  <Label>{`WALL COLOR - ROOM ${currentRoom}`}</Label>
                  <View style={styles.row}>
                    {availableColors.map((color) => (
                      <TouchableOpacity
                        key={color}
                        activeOpacity={0.8}
                        onPress={() => dispatch({ type: 'SET_WALL_COLOR', room: currentRoom, color })}
                        style={[styles.swatch, { backgroundColor: COLOR_SWATCH[color] ?? '#aaa' }, currentColor === color && styles.slotActive]}
                      />
                    ))}
                  </View>
                </>
              )}

              <Label>UNLOCK ROOMS</Label>
              {[2, 3].map((r) => {
                const unlocked = player.unlockedRooms.includes(r);
                const cost = ROOM_UNLOCK_COSTS[r];
                return (
                  <View key={r} style={styles.unlockRow}>
                    <View style={{ flex: 1 }}>
                      <PixelText size={11} color="#5a3410" style={styles.dark}>{ROOM_NAMES[r]}</PixelText>
                      <PixelText size={7} color="#8a5a24" style={[styles.dark, { marginTop: 6 }]}>{ROOM_DESC[r]}</PixelText>
                    </View>
                    {unlocked ? (
                      <PixelText size={9} color="#2a6a1a" style={styles.dark}>UNLOCKED</PixelText>
                    ) : (
                      <PixelButton label={`${cost} COINS`} size={9} onPress={() => handleUnlock(r)} disabled={player.coins < cost} />
                    )}
                  </View>
                );
              })}

              {currentRoom === 2 && (
                <>
                  {picker('PHOTO FRAME', 'photoFrame', player.ownedPaintings ?? [], PAINTING_IMAGES, 'BUY PAINTINGS IN THE GALLERY')}
                  {picker('PET', 'pet', player.ownedPets ?? [], PET_IMAGES, 'ADOPT PETS IN THE PET SHOP')}
                </>
              )}
            </PixelPanel>
          </ScrollView>
        </PixelPanel>
      </View>

      <PixelToast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140c' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,10,0,0.55)' },
  back: { position: 'absolute', top: 14, left: 14, width: 56, height: 56, zIndex: 20 },
  coins: {
    position: 'absolute', top: 18, right: 18, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  coinImg: { width: 24, height: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  board: { width: '100%', maxWidth: 720, maxHeight: '96%' },
  title: { textAlign: 'center', marginBottom: 10, marginTop: 4 },
  scroll: { paddingBottom: 4 },
  label: {
    alignSelf: 'flex-start', backgroundColor: COLORS.wood, borderWidth: 3, borderColor: COLORS.woodEdge,
    borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, marginTop: 14, marginBottom: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  slot: {
    width: 60, height: 60, borderRadius: 4, backgroundColor: '#f8dfae', borderWidth: 3,
    borderColor: COLORS.creamEdge, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  slotActive: { borderColor: COLORS.woodEdge, borderWidth: 4 },
  thumb: { width: 52, height: 52 },
  swatch: { width: 44, height: 44, borderRadius: 4, borderWidth: 3, borderColor: COLORS.creamEdge },
  unlockRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8dfae',
    borderWidth: 3, borderColor: COLORS.creamEdge, borderRadius: 4, padding: 12, marginBottom: 8,
  },
  dark: { textShadowColor: 'rgba(255,240,200,0.7)', textShadowRadius: 0, textShadowOffset: { width: 1, height: 1 } },
});
