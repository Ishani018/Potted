import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { FOSTER_BG, FOSTER_REST_IMAGES, PET_IMAGES, PERK_ICONS } from '../engine/assets';
import { STRAYS, FOSTER_SEATS, FOSTER_SIZE, CUSTOMERS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import InventoryOverlay from '../components/InventoryOverlay';
import PetSprite from '../components/PetSprite';
import { PixelText, PixelPanel, PixelButton, COLORS } from '../components/Pixel';

// The foster corner: the pet shop's cosy back room. Customers find strays and
// bring them here; each takes an empty seat until you adopt it. Tap one to read
// where it was found and to adopt it (it then lives in your garden like any pet).
const dark = { textShadowRadius: 0 };

function StrayCard({ stray, onClose }) {
  const { state, dispatch } = useGame();
  const [done, setDone] = useState(false);
  const def = STRAYS[stray.key];
  const finder = CUSTOMERS[stray.finder]?.name ?? 'A customer';
  const coins = state.player.coins;
  const canAfford = coins >= def.price;
  const adopt = () => { dispatch({ type: 'BUY_PET', petKey: stray.key, price: def.price }); setDone(true); };
  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable onPress={() => {}}>
        <PixelPanel cream style={styles.card}>
          <View style={styles.head}>
            <Image source={PET_IMAGES[stray.key]} style={styles.big} resizeMode="contain" />
            <View style={{ flex: 1, gap: 6 }}>
              <PixelText size={11} color="#5a3410" style={dark}>{def.name.toUpperCase()}</PixelText>
              <PixelText size={7} color="#8a5a24" style={dark}>{def.breed.toUpperCase()}</PixelText>
              <PixelText size={7} color="#5a3410" style={[dark, { lineHeight: 12 }]}>{def.found(finder)}</PixelText>
            </View>
          </View>

          <View style={styles.perk}>
            <Image source={PERK_ICONS[stray.key]} style={styles.perkIcon} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <PixelText size={8} color="#3f7a2e" style={dark}>{def.effect.title.toUpperCase()}</PixelText>
              <PixelText size={7} color="#5a3410" style={[dark, { lineHeight: 12, marginTop: 3 }]}>{def.effect.desc}</PixelText>
            </View>
          </View>

          {done ? (
            <PixelText size={8} color="#3f7a2e" style={[dark, styles.msg]}>
              {`${def.name} is yours! Rename or move them in the flower book.`}
            </PixelText>
          ) : (
            <View style={styles.buyRow}>
              <PixelText size={9} color="#a8700a" style={dark}>{`${def.price} coins`}</PixelText>
              <PixelButton label="ADOPT" onPress={adopt} disabled={!canAfford} />
            </View>
          )}
          {!done && !canAfford && <PixelText size={7} color="#b04a2a" style={[dark, styles.msg]}>Not enough coins yet.</PixelText>}
          <PixelButton label={done ? 'DONE' : 'CLOSE'} tone="wood" size={8} onPress={onClose} style={{ marginTop: 10, alignSelf: 'center' }} />
        </PixelPanel>
      </Pressable>
    </Pressable>
  );
}

export default function FosterScreen({ navigation }) {
  const { state } = useGame();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState(null);
  const [picked, setPicked] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const sw = box.w, sh = box.h;
  const strays = state.player.strays ?? [];
  const fx = (v) => (v / FOSTER_SIZE.w) * sw;
  const fy = (v) => (v / FOSTER_SIZE.h) * sh;

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={FOSTER_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && strays.map((stray) => {
        const def = STRAYS[stray.key];
        const seat = FOSTER_SEATS.find((s) => s.id === stray.seat) ?? FOSTER_SEATS[0];
        const rest = FOSTER_REST_IMAGES[stray.key];
        const aspect = rest ? def.restAspect : def.aspect;
        const w = fx((rest ? def.restFw : def.fw) * seat.scale);
        const h = w / aspect;
        const on = hovered === stray.key;
        return (
          <Pressable
            key={stray.key}
            style={{ position: 'absolute', left: fx(seat.x) - w / 2, top: fy(seat.y) - h, width: w, height: h, zIndex: on ? 40 : Math.round(seat.y / 10) }}
            onHoverIn={() => setHovered(stray.key)}
            onHoverOut={() => setHovered((k) => (k === stray.key ? null : k))}
            onPress={() => setPicked(stray)}
          >
            <PetSprite petKey={stray.key} w={w} h={h} source={rest} asleep={rest ? true : undefined} />
            {on && (
              <View style={styles.tag} pointerEvents="none">
                <PixelText size={8}>{def.name.toUpperCase()}</PixelText>
                <PixelText size={7} color={COLORS.gold}>{`${def.price} COINS`}</PixelText>
              </View>
            )}
          </Pressable>
        );
      })}

      {sw > 0 && strays.length === 0 && (
        <View style={styles.empty} pointerEvents="none">
          <PixelText size={8}>NO STRAYS RIGHT NOW</PixelText>
          <PixelText size={7} color="#f6e2b8" style={{ marginTop: 4 }}>CUSTOMERS BRING THEM IN FROM TIME TO TIME</PixelText>
        </View>
      )}

      <View style={styles.back}>
        <PixelButton label="< PET SHOP" tone="wood" size={8} onPress={() => navigation.navigate('PetShop')} />
      </View>

      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Settings')} onMap={() => navigation.navigate('Map')} onInventory={() => setInvOpen(true)} />

      {picked && <StrayCard stray={picked} onClose={() => setPicked(null)} />}
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1200' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  tag: { position: 'absolute', bottom: '100%', left: -50, right: -50, alignItems: 'center', gap: 2, marginBottom: 2 },
  empty: { position: 'absolute', left: 0, right: 0, top: '12%', alignItems: 'center', zIndex: 30 },
  back: { position: 'absolute', right: 16, bottom: 12, zIndex: 30 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  card: { width: 340, maxWidth: '94%' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  big: { width: 92, height: 92 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  perkIcon: { width: 40, height: 38 },
  buyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  msg: { marginVertical: 6, textAlign: 'center' },
});
