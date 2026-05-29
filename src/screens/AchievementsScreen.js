import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS } from '../constants/gameData';

export default function AchievementsScreen({ navigation }) {
  const { state } = useGame();
  const earned = state.player.achievements ?? [];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.count}>{earned.length}/{ACHIEVEMENTS.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {ACHIEVEMENTS.map((ach) => {
          const done = earned.includes(ach.id);
          return (
            <View key={ach.id} style={[styles.row, done && styles.rowDone]}>
              <View style={[styles.trophy, done && styles.trophyDone]}>
                <Text style={styles.trophyText}>{done ? '★' : '☆'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.achTitle, done && styles.achTitleDone]}>{ach.title}</Text>
                <Text style={styles.achDesc}>{ach.desc}</Text>
              </View>
            </View>
          );
        })}
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
  count: {
    color: '#ffd060',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scroll: {
    padding: 18,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e0f02',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3a2008',
    padding: 12,
    gap: 14,
  },
  rowDone: {
    borderColor: '#c8873a',
    backgroundColor: '#251508',
  },
  trophy: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#3a2008',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5a3010',
  },
  trophyDone: {
    backgroundColor: '#6a4010',
    borderColor: '#c8873a',
  },
  trophyText: {
    fontSize: 20,
    color: '#ffe8a0',
  },
  info: {
    flex: 1,
  },
  achTitle: {
    color: '#a07040',
    fontSize: 14,
    fontWeight: 'bold',
  },
  achTitleDone: {
    color: '#ffe8a0',
  },
  achDesc: {
    color: '#806040',
    fontSize: 12,
    marginTop: 2,
  },
});
