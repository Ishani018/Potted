import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { FOSTER_BG, FOSTER_REST_IMAGES } from '../engine/assets';
import { STRAYS, FOSTER_SEATS, strayFits, FOSTER_SIZE, FOSTER_BASE_W, CUSTOMERS } from '../constants/gameData';
import ScreenHud from '../components/ScreenHud';
import InventoryOverlay from '../components/InventoryOverlay';
import PetSprite from '../components/PetSprite';
import { PixelText, PixelPanel, PixelButton } from '../components/Pixel';
import TagLabel from '../components/TagLabel';
import { AdoptModal } from '../components/PetCard';

// The Foster Center: the pet shop's big back room. Customers find strays and bring
// them here; each takes an empty seat until you adopt it. Tap one to read
// where it was found and to adopt it (it then lives in your garden like any pet).

export default function FosterScreen({ navigation }) {
  const { state } = useGame();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState(null);
  const [picked, setPicked] = useState(null);
  const [invOpen, setInvOpen] = useState(false);
  const sw = box.w, sh = box.h;
  const strays = state.player.strays ?? [];
  // where each stray sits: its own seat if it fits there, otherwise the nearest free one that does
  // (an older save may have a big dog on the little bench)
  const seats = {};
  const used = new Set();
  strays.forEach((st) => {
    let seat = FOSTER_SEATS.find((x) => x.id === st.seat);
    if (!seat || !strayFits(STRAYS[st.key], seat) || used.has(seat.id)) {
      seat = FOSTER_SEATS.find((x) => !used.has(x.id) && strayFits(STRAYS[st.key], x) && x.id === 'pawRug')
        ?? FOSTER_SEATS.find((x) => !used.has(x.id) && strayFits(STRAYS[st.key], x)) ?? FOSTER_SEATS[0];
    }
    used.add(seat.id); seats[st.key] = seat;
  });
  const seatOf = (st) => seats[st.key];
  const fx = (v) => (v / FOSTER_SIZE.w) * sw;
  const fy = (v) => (v / FOSTER_SIZE.h) * sh;
  const fw = (v) => (v / FOSTER_BASE_W) * sw;   // pet widths

  return (
    <View style={styles.root} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={FOSTER_BG} style={styles.bg} resizeMode="stretch" />

      {sw > 0 && strays.map((stray) => {
        const def = STRAYS[stray.key];
        const seat = seatOf(stray);
        const rest = FOSTER_REST_IMAGES[stray.key];
        const aspect = rest ? def.restAspect : def.aspect;
        const w = fw((rest ? def.restFw : def.fw) * seat.scale);
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
              <TagLabel title={def.name} sub={`${def.price} coins`} style={styles.tag} />
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

      {sw > 0 && (
        <View style={styles.roomTitle} pointerEvents="none">
          <PixelPanel style={{ paddingHorizontal: 4 }}>
            <PixelText size={9}>FOSTER CENTER</PixelText>
          </PixelPanel>
        </View>
      )}

      <View style={styles.back}>
        <PixelButton label="< PET SHOP" tone="wood" size={8} onPress={() => navigation.navigate('PetShop')} />
      </View>

      <ScreenHud sw={sw} sh={sh} onSettings={() => navigation.navigate('Settings')} onMap={() => navigation.navigate('Map')} onInventory={() => setInvOpen(true)} />

      {picked && <AdoptModal petKey={picked.key} onClose={() => setPicked(null)} story={STRAYS[picked.key].found(CUSTOMERS[picked.finder]?.name ?? 'A customer')} />}
      {invOpen && <InventoryOverlay onClose={() => setInvOpen(false)} onPick={() => setInvOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1200' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  tag: { position: 'absolute', bottom: '100%', alignSelf: 'center', marginBottom: 2 },
  empty: { position: 'absolute', left: 0, right: 0, top: '12%', alignItems: 'center', zIndex: 30 },
  back: { position: 'absolute', right: 16, bottom: 12, zIndex: 30, flexDirection: 'row', gap: 8, alignItems: 'center' },
  roomTitle: { position: 'absolute', left: 0, right: 0, top: 8, alignItems: 'center', zIndex: 30 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  card: { width: 340, maxWidth: '94%' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  big: { width: 92, height: 92 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  perkIcon: { width: 40, height: 38 },
  buyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  stamp: { width: 40, height: 39 },
  msg: { marginVertical: 6, textAlign: 'center' },
});
