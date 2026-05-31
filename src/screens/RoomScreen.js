import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { WALL_COLORS, ROOM_UNLOCK_COSTS, PAINTINGS, PETS } from '../constants/gameData';
import { PAINTING_IMAGES, PET_IMAGES } from '../engine/assets';

const COLOR_SWATCH = {
  green: '#4a8a3a',
  pink:  '#d07090',
  white: '#e8e0d0',
};

export default function RoomScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const { player } = state;

  const currentRoom = player.currentRoom;
  const availableColors = WALL_COLORS[`room${currentRoom}`] ?? ['white'];

  const handleUnlock = (room) => {
    const cost = ROOM_UNLOCK_COSTS[room];
    if (player.coins < cost) {
      Alert.alert('Not enough coins', `You need ${cost} coins to unlock Room ${room}.`);
      return;
    }
    dispatch({ type: 'UNLOCK_ROOM', room });
  };

  const handleSetColor = (color) => {
    dispatch({ type: 'SET_WALL_COLOR', room: currentRoom, color });
  };

  const handlePlacePainting = (key) => {
    dispatch({ type: 'PLACE_DECOR', room: 2, slot: 'photoFrame', value: key });
  };

  const handleRemovePainting = () => {
    dispatch({ type: 'PLACE_DECOR', room: 2, slot: 'photoFrame', value: null });
  };

  const handlePlacePet = (key) => {
    dispatch({ type: 'PLACE_DECOR', room: 2, slot: 'pet', value: key });
  };

  const handleRemovePet = () => {
    dispatch({ type: 'PLACE_DECOR', room: 2, slot: 'pet', value: null });
  };

  const currentColor = player.wallColor[`room${currentRoom}`] ?? availableColors[0];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Room</Text>
        <Text style={styles.coins}>{player.coins} coins</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Wall color section — room 1 is always white, no picker */}
        {currentRoom !== 1 && (
          <>
            <Text style={styles.section}>Wall Color — Room {currentRoom}</Text>
            <View style={styles.swatchRow}>
              {availableColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.swatch,
                    { backgroundColor: COLOR_SWATCH[color] ?? '#aaa' },
                    currentColor === color && styles.swatchActive,
                  ]}
                  onPress={() => handleSetColor(color)}
                />
              ))}
            </View>
          </>
        )}

        {/* Room unlock */}
        <Text style={styles.section}>Unlock Rooms</Text>
        {[2, 3].map((r) => {
          const unlocked = player.unlockedRooms.includes(r);
          const cost = ROOM_UNLOCK_COSTS[r];
          return (
            <View key={r} style={styles.unlockRow}>
              <View style={styles.unlockInfo}>
                <Text style={styles.unlockTitle}>Room {r}</Text>
                <Text style={styles.unlockDesc}>
                  {r === 2 ? 'Balcony — hanging rods + photo frame + pet' : 'Sunroom — glass conservatory + tiered stand'}
                </Text>
              </View>
              {unlocked ? (
                <View style={styles.unlockedBadge}>
                  <Text style={styles.unlockedText}>Unlocked</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.unlockBtn, player.coins < cost && styles.unlockBtnDisabled]}
                  onPress={() => handleUnlock(r)}
                  disabled={player.coins < cost}
                >
                  <Text style={styles.unlockBtnText}>{cost} coins</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Room 2 decor: paintings */}
        {currentRoom === 2 && (
          <>
            <Text style={styles.section}>Photo Frame</Text>
            <View style={styles.decorRow}>
              <TouchableOpacity
                style={[styles.decorNone, !player.placedDecor?.room2?.photoFrame && styles.decorNoneActive]}
                onPress={handleRemovePainting}
              >
                <Text style={styles.decorNoneText}>None</Text>
              </TouchableOpacity>
              {(player.ownedPaintings ?? []).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.decorThumb, player.placedDecor?.room2?.photoFrame === key && styles.decorThumbActive]}
                  onPress={() => handlePlacePainting(key)}
                >
                  <Image source={PAINTING_IMAGES[key]} style={styles.decorThumbImg} resizeMode="contain" />
                </TouchableOpacity>
              ))}
              {(player.ownedPaintings ?? []).length === 0 && (
                <Text style={styles.emptyHint}>Buy paintings from the Shop.</Text>
              )}
            </View>

            <Text style={styles.section}>Pet</Text>
            <View style={styles.decorRow}>
              <TouchableOpacity
                style={[styles.decorNone, !player.placedDecor?.room2?.pet && styles.decorNoneActive]}
                onPress={handleRemovePet}
              >
                <Text style={styles.decorNoneText}>None</Text>
              </TouchableOpacity>
              {(player.ownedPets ?? []).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.decorThumb, player.placedDecor?.room2?.pet === key && styles.decorThumbActive]}
                  onPress={() => handlePlacePet(key)}
                >
                  <Image source={PET_IMAGES[key]} style={styles.decorThumbImg} resizeMode="contain" />
                </TouchableOpacity>
              ))}
              {(player.ownedPets ?? []).length === 0 && (
                <Text style={styles.emptyHint}>Buy pets from the Shop.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2a1608',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#7a4a18',
  },
  backBtn: {
    backgroundColor: '#3d2009',
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#7a4a18',
  },
  backText: {
    color: '#ffe8a0',
    fontSize: 13,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffe8a0',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  coins: {
    color: '#ffd060',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  section: {
    color: '#c8873a',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 14,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#5a3010',
  },
  swatchActive: {
    borderColor: '#ffe8a0',
    borderWidth: 3,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e0f02',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3a2008',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  unlockInfo: {
    flex: 1,
  },
  unlockTitle: {
    color: '#ffe8a0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unlockDesc: {
    color: '#806040',
    fontSize: 11,
    marginTop: 2,
  },
  unlockedBadge: {
    backgroundColor: '#2a5c1e',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#5aaa3a',
  },
  unlockedText: {
    color: '#c0ffa0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  unlockBtn: {
    backgroundColor: '#3d6020',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#70a840',
  },
  unlockBtnDisabled: {
    backgroundColor: '#2a2a2a',
    borderColor: '#555',
  },
  unlockBtnText: {
    color: '#e0ffc0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  decorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  decorNone: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#1e0f02',
    borderWidth: 1.5,
    borderColor: '#3a2008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorNoneActive: {
    borderColor: '#ffe8a0',
  },
  decorNoneText: {
    color: '#806040',
    fontSize: 10,
  },
  decorThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#1e0f02',
    borderWidth: 1.5,
    borderColor: '#3a2008',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  decorThumbActive: {
    borderColor: '#ffe8a0',
    borderWidth: 2.5,
  },
  decorThumbImg: {
    width: 52,
    height: 52,
  },
  emptyHint: {
    color: '#604030',
    fontSize: 11,
    fontStyle: 'italic',
  },
});
