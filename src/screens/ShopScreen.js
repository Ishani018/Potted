import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { POTTED_FLOWERS, HANGING_PLANTS, PAINTINGS, PETS } from '../constants/gameData';
import { SEED_IMAGES, PAINTING_IMAGES, PET_IMAGES } from '../engine/assets';

function SeedCard({ name, price, image, count, coins, onBuy }) {
  const canAfford = coins >= price;
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.seedImg} resizeMode="contain" />
      <Text style={styles.cardName}>{name}</Text>
      <Text style={styles.cardCount}>Owned: {count}</Text>
      <TouchableOpacity
        style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
        onPress={onBuy}
        disabled={!canAfford}
      >
        <Text style={styles.buyBtnText}>{price} coins</Text>
      </TouchableOpacity>
    </View>
  );
}

function DecorCard({ name, price, image, owned, coins, onBuy }) {
  const canAfford = coins >= price;
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.decorImg} resizeMode="contain" />
      <Text style={styles.cardName}>{name}</Text>
      {owned
        ? <Text style={styles.ownedText}>Owned</Text>
        : (
          <TouchableOpacity
            style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
            onPress={onBuy}
            disabled={!canAfford}
          >
            <Text style={styles.buyBtnText}>{price} coins</Text>
          </TouchableOpacity>
        )
      }
    </View>
  );
}

export default function ShopScreen({ navigation }) {
  const { state, dispatch } = useGame();
  const { player } = state;
  const coins = player.coins;

  const handleBuySeed = (key, price) => {
    if (coins < price) {
      Alert.alert('Not enough coins', `You need ${price} coins.`);
      return;
    }
    dispatch({ type: 'BUY_SEED', flowerKey: key, price });
  };

  const handleBuyPainting = (key, price) => {
    if (coins < price) { Alert.alert('Not enough coins'); return; }
    dispatch({ type: 'BUY_PAINTING', paintingKey: key, price });
  };

  const handleBuyPet = (key, price) => {
    if (coins < price) { Alert.alert('Not enough coins'); return; }
    dispatch({ type: 'BUY_PET', petKey: key, price });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.coins}>{coins} coins</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Potted Flowers</Text>
        <View style={styles.grid}>
          {Object.values(POTTED_FLOWERS).map((f) => (
            <SeedCard
              key={f.key}
              name={f.name}
              price={f.seedPrice}
              image={SEED_IMAGES[f.key]}
              count={player.inventory[f.key] ?? 0}
              coins={coins}
              onBuy={() => handleBuySeed(f.key, f.seedPrice)}
            />
          ))}
        </View>

        <Text style={styles.section}>Hanging Plants</Text>
        <View style={styles.grid}>
          {Object.values(HANGING_PLANTS).map((p) => (
            <SeedCard
              key={p.key}
              name={p.name}
              price={p.seedPrice}
              image={SEED_IMAGES[p.key]}
              count={player.inventory[p.key] ?? 0}
              coins={coins}
              onBuy={() => handleBuySeed(p.key, p.seedPrice)}
            />
          ))}
        </View>

        <Text style={styles.section}>Paintings (Room 2)</Text>
        <View style={styles.grid}>
          {Object.values(PAINTINGS).map((p) => (
            <DecorCard
              key={p.key}
              name={p.name}
              price={p.price}
              image={PAINTING_IMAGES[p.key]}
              owned={player.ownedPaintings?.includes(p.key)}
              coins={coins}
              onBuy={() => handleBuyPainting(p.key, p.price)}
            />
          ))}
        </View>

        <Text style={styles.section}>Pets (Room 2)</Text>
        <View style={styles.grid}>
          {Object.values(PETS).map((p) => (
            <DecorCard
              key={p.key}
              name={p.name}
              price={p.price}
              image={PET_IMAGES[p.key]}
              owned={player.ownedPets?.includes(p.key)}
              coins={coins}
              onBuy={() => handleBuyPet(p.key, p.price)}
            />
          ))}
        </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    color: '#c8873a',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 18,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#1e0f02',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#5a3010',
    padding: 10,
    alignItems: 'center',
    width: 110,
    gap: 5,
  },
  seedImg: {
    width: 52,
    height: 52,
  },
  decorImg: {
    width: 64,
    height: 64,
  },
  cardName: {
    color: '#ffe8a0',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardCount: {
    color: '#a07040',
    fontSize: 10,
  },
  ownedText: {
    color: '#80c060',
    fontSize: 11,
    fontWeight: 'bold',
  },
  buyBtn: {
    backgroundColor: '#3d6020',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#70a840',
  },
  buyBtnDisabled: {
    backgroundColor: '#2a2a2a',
    borderColor: '#555',
  },
  buyBtnText: {
    color: '#e0ffc0',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
