# 🌱 Potted

> **Grow. Tend. Bloom. Repeat.**

*(Screenshots coming soon — game in development)*

---

## 🎮 About

Potted is a cozy pixel art idle game about the quiet joy of keeping plants alive. You're given a little room, some seed money, and the gentle pressure of time — water your flowers before they wilt, harvest them at peak bloom, and slowly grow your collection into something beautiful.

The core loop is simple and meditative: buy seeds from the nursery shop, plant them in your pots and hanging planters, water them every few hours, and harvest blooms for coins. Coins buy more seeds, unlock new rooms, and let you redecorate your space. Plants grow in real time — even while you're away — so there's always something to come back to.

Every room has hand-painted seasonal backgrounds that change automatically with the real-world date. Spring brings soft pastels and fresh greens. Summer is warm and lush. Autumn turns everything amber and gold. Winter wraps the room in quiet blue light. The art is fully hand-crafted, pixel by pixel, room by room.

Three rooms wait to be unlocked: a cozy greenhouse with wooden shelves and a garden window, a warm balcony with macramé hanging rods and a sliding glass door, and a bright sunroom conservatory with a tiered plant stand and glass panels that flood the room with light. Each room has its own layout, its own mood, and its own way of being lived in.

---

## 🌸 Features

- 7 hand-drawn pixel art flowers with 5 growth stages each (seed → bud → slight bloom → full bloom → dead)
- 5 hanging plant varieties with passive coin trickle while alive
- 3 unlockable rooms with full seasonal backgrounds (spring / summer / autumn / winter)
- Real-time growth system — plants grow and die while you're away
- Drag-and-snap plant placement with a 40px snap radius
- Coin economy — harvest blooms, buy new seeds, spend wisely
- Watering can mechanic with bonus coins for watering during the bud stage
- Wall color customization per room (green, pink, white)
- Collectible paintings and pet companions for Room 2
- Achievements system tracking your garden milestones
- Landscape-only (16:9), built for Android
- Built with React Native (Expo)

---

## 🏡 Rooms

1. **Greenhouse** — A cozy indoor room with a large garden window, wooden shelves along two walls, and warm afternoon light. Your starting space. Five pots on the top shelf, four on the lower.

2. **Balcony** — A warm indoor balcony with macramé hanging rods strung across two levels. A sliding glass door opens onto whatever season is outside. Comes with a photo frame slot and a spot for a pet. Unlocks at 500 coins.

3. **Sunroom** — A bright glass-panel conservatory where the light pours in from every angle. A tiered plant stand holds floor pots and a rack pot. Hanging rods run along the top. The most expensive room to unlock — but worth it. Unlocks at 1500 coins.

---

## 🌿 Plants

### Potted Flowers
Daisy · Hydrangea · Marigold · Peony · Poppy · Rose · Snapdragon

### Hanging Plants
Bougainvillea · Jasmine · Petunia · Philodendron · String of Pearls

---

## 🛠️ Tech Stack

- React Native (Expo)
- React Navigation (Stack)
- AsyncStorage — all game state persisted locally
- react-native-gesture-handler — drag and drop
- react-native-reanimated — spring animations
- expo-av — snap sound effects

---

## 🚀 Getting Started

```bash
git clone https://github.com/Ishani018/Potted.git
cd Potted
npm install
npx expo start
```

> **Note:** Game assets (backgrounds, plant sprites, UI images) are not included in this repository. You'll need to supply your own `assets/` folder matching the structure described in the project documentation.

---

## 👩‍💻 Developer

Made with love by **Ishani**

Solo developer — code, game design, and art direction. Every shelf, every petal, every pixel placed by hand.

---

## 📄 License

MIT
