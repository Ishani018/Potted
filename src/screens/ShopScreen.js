import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { POTTED_FLOWERS, HANGING_PLANTS, PAINTINGS, PETS } from '../constants/gameData';
import { SEED_IMAGES, PAINTING_IMAGES, PET_IMAGES, NURSERY_BG, UI_IMAGES } from '../engine/assets';

const TABS = [
  { key: 'potted',   label: 'Potted Flowers' },
  { key: 'hanging',  label: 'Hanging Plants' },
  { key: 'decor',    label: 'Decor' },
];

function SeedCard({ name, price, image, count, coins, onBuy }) {
  const canAfford = coins >= price;
  return (
    <View style={styles.card}>
      <View style={styles.cardImgBox}>
        <Image source={image} style={styles.seedImg} resizeMode="contain" />
        {count > 0 && (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedBadgeText}>x{count}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardName}>{name}</Text>
      <TouchableOpacity
        style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
        onPress={onBuy}
        disabled={!canAfford}
      >
        <Text style={styles.buyBtnText}>{price}</Text>
      </TouchableOpacity>
    </View>
  );
}

function DecorCard({ name, price, image, owned, coins, onBuy }) {
  const canAfford = coins >= price;
  return (
    <View style={styles.card}>
      <View style={styles.cardImgBox}>
        <Image source={image} style={styles.decorImg} resizeMode="contain" />
      </View>
      <Text style={styles.cardName}>{name}</Text>
      {owned ? (
        <View style={styles.ownedBtn}>
          <Text style={styles.ownedBtnText}>Owned</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
          onPress={onBuy}
          disabled={!canAfford}
        >
          <Text style={styles.buyBtnText}>{price}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ShopScreen({ navigation }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const { state, dispatch } = useGame();
  const { player } = state;
  const coins = player.coins;
  const [activeTab, setActiveTab] = useState('potted');

  const handleBuySeed = (key, price) => {
    if (coins < price) { Alert.alert('Not enough coins', `You need ${price} coins.`); return; }
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
      {/* Full-screen background */}
      <Image source={NURSERY_BG} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Dark overlay so UI stays readable */}
      <View style={styles.overlay} />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Nursery Shop</Text>

        {/* Coin display */}
        <View style={styles.coinDisplay}>
          <Text style={styles.coinText}>{coins} coins</Text>
        </View>
      </View>

      {/* Tab row */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Item grid — horizontal scroll */}
      <View style={styles.shelfArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelf}
        >
          {activeTab === 'potted' && Object.values(POTTED_FLOWERS).map((f) => (
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

          {activeTab === 'hanging' && Object.values(HANGING_PLANTS).map((p) => (
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

          {activeTab === 'decor' && (
            <>
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
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a0f00',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,0,0.52)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: {
    backgroundColor: 'rgba(30,12,0,0.82)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: '#a0601a',
  },
  backText: {
    color: '#ffe8a0',
    fontSize: 13,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffe8a0',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  coinDisplay: {
    backgroundColor: 'rgba(30,12,0,0.82)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: '#c8873a',
  },
  coinText: {
    color: '#ffd060',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(20,10,0,0.65)',
    borderWidth: 1.5,
    borderColor: '#5a3010',
  },
  tabActive: {
    backgroundColor: 'rgba(80,38,8,0.90)',
    borderColor: '#c8873a',
  },
  tabText: {
    color: '#a07040',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: '#ffe8a0',
  },

  // Shelf / card area
  shelfArea: {
    flex: 1,
    justifyContent: 'center',
  },
  shelf: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 16,
    alignItems: 'center',
  },

  // Cards
  card: {
    backgroundColor: 'rgba(18,8,0,0.88)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#6a3810',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: 140,
    gap: 8,
  },
  cardImgBox: {
    position: 'relative',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedImg: {
    width: 110,
    height: 110,
  },
  decorImg: {
    width: 100,
    height: 100,
  },
  ownedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(60,30,0,0.9)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#c8873a',
  },
  ownedBadgeText: {
    color: '#ffe8a0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardName: {
    color: '#ffe8a0',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  buyBtn: {
    backgroundColor: '#3d6020',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#70a840',
    minWidth: 80,
    alignItems: 'center',
  },
  buyBtnDisabled: {
    backgroundColor: 'rgba(40,40,40,0.7)',
    borderColor: '#444',
  },
  buyBtnText: {
    color: '#d8ffa0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ownedBtn: {
    backgroundColor: 'rgba(20,50,10,0.8)',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#4a8a20',
    minWidth: 80,
    alignItems: 'center',
  },
  ownedBtnText: {
    color: '#90e060',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
