import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useLayout } from '../context/LayoutContext';
import { useGame } from '../context/GameContext';
import { UI_IMAGES, BACKGROUNDS } from '../engine/assets';
import { PETS, ROOM_NAMES } from '../constants/gameData';
import PetSprite from './PetSprite';
import { PIXEL_FONT, pixelText } from './Pixel';

// Pet card — adopt (unowned), welcome + rename (just adopted) or manage (owned).
// A warm parchment card with a green ribbon banner, framed portrait, name plate,
// perk note, and price + adopt row.
const REFUND_FRACTION = 0.5; // coins returned when giving a pet up for adoption

const C = {
  card: '#fbefd2', cardEdge: '#8a5a2a', cardIn: '#e8c98c',
  green: '#3f7a2e', greenDark: '#26521c', greenSoft: '#e4eecb', greenSoftEdge: '#b9cf92',
  peach: '#fcdb9a', peachEdge: '#e2b362',
  plate: '#f2cf96', plateEdge: '#c99555',
  ink: '#5a3410', inkSoft: '#8a5a24',
  tan: '#e9c58a', tanEdge: '#b98745',
  red: '#b5452e', redEdge: '#7a2a1a',
};

function Leaf({ rot = '0deg', size = 14, color = '#5a9a3a' }) {
  return <View style={{ width: size, height: size * 0.55, borderRadius: size, backgroundColor: color, transform: [{ rotate: rot }] }} />;
}
function Blossom({ size = 14 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d8d0b8' }}>
      <View style={{ width: size * 0.38, height: size * 0.38, borderRadius: size, backgroundColor: '#f0b838' }} />
    </View>
  );
}
function Paw({ size = 14, color = '#b57a3a' }) {
  const s = size;
  return (
    <View style={{ width: s, height: s }}>
      <View style={{ position: 'absolute', left: s * 0.22, top: s * 0.48, width: s * 0.56, height: s * 0.46, borderRadius: s, backgroundColor: color }} />
      {[[0.02, 0.28], [0.26, 0.04], [0.54, 0.04], [0.78, 0.28]].map(([x, y], i) => (
        <View key={i} style={{ position: 'absolute', left: s * x - s * 0.05, top: s * y, width: s * 0.22, height: s * 0.26, borderRadius: s, backgroundColor: color }} />
      ))}
    </View>
  );
}
function Sprout({ flip }) {
  return (
    <View style={{ width: 22, height: 34, alignItems: 'center', transform: [{ scaleX: flip ? -1 : 1 }] }}>
      <View style={{ position: 'absolute', top: 2, left: 0 }}><Leaf rot="-40deg" size={13} color="#7aa25a" /></View>
      <View style={{ position: 'absolute', top: 2, right: 0 }}><Leaf rot="40deg" size={13} color="#7aa25a" /></View>
      <View style={{ position: 'absolute', top: 8, width: 2, height: 24, backgroundColor: '#7aa25a' }} />
    </View>
  );
}

function Banner({ children }) {
  return (
    <View style={s.bannerWrap}>
      <View style={s.bannerDecoL}><Blossom size={16} /><Leaf rot="-30deg" /></View>
      <View style={s.banner}><Text numberOfLines={1} style={[pixelText(10), { textAlign: 'center' }]}>{children}</Text></View>
      <View style={s.bannerDecoR}><Leaf rot="30deg" /><Blossom size={16} /></View>
    </View>
  );
}

// tone: 'green' | 'tan' | 'red'
function CardButton({ label, tone = 'green', onPress, disabled, style, leaves }) {
  const bg = tone === 'green' ? C.green : tone === 'red' ? C.red : C.tan;
  const edge = tone === 'green' ? C.greenDark : tone === 'red' ? C.redEdge : C.tanEdge;
  const txtColor = tone === 'tan' ? C.ink : '#fff';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={disabled ? undefined : onPress}
      style={[s.btn, { backgroundColor: bg, borderColor: edge, opacity: disabled ? 0.55 : 1 }, style]}
    >
      {leaves && <Leaf rot="-35deg" size={13} color="#b7dc8a" />}
      <Text style={[pixelText(10, txtColor), tone === 'tan' && { textShadowColor: 'transparent' }, { marginHorizontal: 8 }]}>{label}</Text>
      {leaves && <Leaf rot="35deg" size={13} color="#b7dc8a" />}
    </TouchableOpacity>
  );
}

export function AdoptModal({ petKey, onClose }) {
  const { state, dispatch } = useGame();
  const { height: frameH } = useLayout();
  const pet = PETS[petKey];
  const owned = (state.player.ownedPets ?? []).includes(petKey);
  const placedRoom = state.player.petPlacements?.[petKey] ?? null;
  const savedName = state.player.petNames?.[petKey];
  const canAfford = state.player.coins >= pet.price;
  const refund = Math.floor(pet.price * REFUND_FRACTION);
  const isPair = petKey === 'ebonyandivory';

  const [step, setStep] = useState(null); // null | 'greet' | 'rename'
  const [name, setName] = useState(savedName ?? pet.name);

  const handleAdopt = () => {
    dispatch({ type: 'BUY_PET', petKey, price: pet.price });
    setName(pet.name);
    setStep('greet');
  };
  const saveName = () => { dispatch({ type: 'NAME_PET', petKey, name }); setStep(null); };
  const handlePlace = (room) => dispatch({ type: 'PLACE_PET', petKey, room });
  const handleGiveUp = () => { dispatch({ type: 'GIVE_UP_PET', petKey, refund }); onClose(); };

  const display = (savedName ?? pet.name).toUpperCase();
  const greeting = step === 'greet' && owned;
  const renaming = step === 'rename' && owned;
  const compact = owned && !greeting && !renaming; // manage view is taller, so shrink the portrait
  const bannerText = greeting ? 'WELCOME HOME!' : renaming ? 'PICK A NEW NAME' : owned ? 'YOUR PET' : 'MEET YOUR NEW FRIEND';

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[s.card, { maxHeight: Math.max(280, frameH - 8) }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {/* corner studs */}
        {[{ top: 5, left: 5 }, { top: 5, right: 5 }, { bottom: 5, left: 5 }, { bottom: 5, right: 5 }].map((p, i) => (
          <View key={i} style={[s.stud, p]} />
        ))}

        <View style={s.topRow}>
          <Banner>{bannerText}</Banner>
          <TouchableOpacity style={s.close} onPress={onClose} activeOpacity={0.85}>
            <Image source={UI_IMAGES.cancelbutton} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* portrait */}
        <View style={s.portrait}>
          {!compact && <View style={s.sprouts}><Sprout /><Sprout flip /></View>}
          <View style={{ width: compact ? 110 : 190, height: compact ? 78 : 140, alignItems: 'center', justifyContent: 'flex-end' }}>
            <PetSprite petKey={petKey} w={compact ? 100 : 170} h={compact ? 74 : 132} />
          </View>
        </View>

        {/* name plate */}
        <View style={s.plate}>
          <Paw />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={pixelText(13, C.ink)} numberOfLines={1}>{display}</Text>
            <Text style={[pixelText(7, C.inkSoft), { marginTop: 5 }]}>
              {'- '}{pet.breed.toUpperCase()}{savedName ? ` / ${pet.name.toUpperCase()}` : ''}{' -'}
            </Text>
          </View>
          <Paw />
        </View>

        {greeting ? (
          <>
            <View style={s.note}>
              <Text style={s.noteTxt}>You adopted {pet.name}! They already have a name, but you can give them a new one if you like.</Text>
            </View>
            <View style={s.row}>
              <CardButton label="RENAME" onPress={() => { setName(pet.name); setStep('rename'); }} style={{ flex: 1 }} leaves />
              <CardButton label="KEEP NAME" tone="tan" onPress={() => setStep(null)} style={{ flex: 1 }} />
            </View>
          </>
        ) : renaming ? (
          <>
            <TextInput
              value={name}
              onChangeText={(t) => setName(t.slice(0, 12))}
              maxLength={12}
              autoFocus
              selectTextOnFocus
              placeholder={pet.name}
              placeholderTextColor="#b8793a"
              onSubmitEditing={saveName}
              style={s.input}
            />
            <View style={s.row}>
              <CardButton label="SAVE" onPress={saveName} style={{ flex: 1 }} leaves />
              <CardButton label="CANCEL" tone="tan" onPress={() => setStep(null)} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <>
            {pet.effect && (
              <View style={s.perk}>
                <View style={s.perkIcon}>
                  <View style={{ flexDirection: 'row', marginBottom: -2 }}><Leaf rot="-35deg" size={12} /><Leaf rot="35deg" size={12} /></View>
                  <View style={s.perkPot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.perkTitle]}>{pet.effect.title}</Text>
                  <Text style={s.perkTxt}>{pet.effect.desc}</Text>
                </View>
              </View>
            )}

            {!owned ? (
              <View style={s.row}>
                <View style={s.price}>
                  <Image source={UI_IMAGES.goldcoins} style={{ width: 28, height: 28 }} resizeMode="contain" />
                  <Text style={pixelText(14, C.ink)}>{pet.price}</Text>
                </View>
                <CardButton
                  label={canAfford ? (isPair ? 'ADOPT PAIR' : 'ADOPT') : `NEED ${pet.price - state.player.coins} MORE`}
                  onPress={handleAdopt}
                  disabled={!canAfford}
                  style={{ flex: 1 }}
                  leaves={canAfford}
                />
              </View>
            ) : (
              <>
                <View style={s.homeBox}>
                  <Text style={s.homeLabel}>
                    {placedRoom == null ? 'Resting - not in a room' : `Lives in the ${ROOM_NAMES[placedRoom] ?? 'room'}`}
                  </Text>
                  <View style={s.rooms}>
                    {[1, 2, 3].map((r) => (
                      <TouchableOpacity key={r} activeOpacity={0.85} onPress={() => handlePlace(r)} style={s.room}>
                        <View style={[s.thumb, placedRoom === r && s.thumbOn]}>
                          <Image source={BACKGROUNDS[`room${r}`].white.summer} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </View>
                        <Text style={s.roomName}>{ROOM_NAMES[r]}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity activeOpacity={0.85} onPress={() => handlePlace(null)} style={s.room}>
                      <View style={[s.thumb, s.tuck, placedRoom == null && s.thumbOn]}>
                        <Text style={pixelText(9, '#fff')}>ZZZ</Text>
                      </View>
                      <Text style={s.roomName}>Tuck away</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={s.row}>
                  <CardButton label="RENAME" tone="tan" onPress={() => { setName(savedName ?? pet.name); setStep('rename'); }} style={{ flex: 1 }} />
                  <CardButton label={`REHOME +${refund}`} tone="red" onPress={handleGiveUp} style={{ flex: 1 }} />
                </View>
              </>
            )}
          </>
        )}
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,12,0,0.55)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  card: {
    width: 360, backgroundColor: C.card, borderWidth: 4, borderColor: C.cardEdge, borderRadius: 10,
    padding: 12,
  },
  stud: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: C.cardIn },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  close: { width: 32, height: 32 },

  bannerWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  banner: {
    flex: 1, backgroundColor: C.green, borderWidth: 3, borderColor: C.greenDark, borderRadius: 6,
    paddingVertical: 10, paddingHorizontal: 14, marginHorizontal: -6,
  },
  bannerDecoL: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  bannerDecoR: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },

  portrait: {
    backgroundColor: C.peach, borderWidth: 3, borderColor: C.peachEdge, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 6,
  },
  sprouts: { position: 'absolute', left: 14, right: 14, top: 50, flexDirection: 'row', justifyContent: 'space-between' },

  plate: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.plate,
    borderWidth: 3, borderColor: C.plateEdge, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,
  },

  note: { backgroundColor: C.greenSoft, borderWidth: 2, borderColor: C.greenSoftEdge, borderRadius: 8, padding: 10 },
  noteTxt: { color: C.ink, fontSize: 13, lineHeight: 18 },

  perk: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.greenSoft,
    borderWidth: 2, borderColor: C.greenSoftEdge, borderRadius: 8, padding: 8,
  },
  perkIcon: { alignItems: 'center', width: 36 },
  perkPot: { width: 22, height: 14, backgroundColor: '#c8743a', borderRadius: 3, borderTopWidth: 3, borderTopColor: '#a85a28' },
  perkTitle: { color: C.green, fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  perkTxt: { color: C.ink, fontSize: 13, lineHeight: 17 },

  row: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  price: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 108,
    backgroundColor: '#fde9b8', borderWidth: 3, borderColor: C.plateEdge, borderRadius: 8, paddingHorizontal: 10,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 10,
  },

  homeBox: { backgroundColor: C.greenSoft, borderWidth: 2, borderColor: C.greenSoftEdge, borderRadius: 8, padding: 8 },
  homeLabel: { color: C.ink, fontSize: 12, marginBottom: 6, textAlign: 'center' },
  rooms: { flexDirection: 'row', justifyContent: 'space-between' },
  room: { alignItems: 'center', width: 70 },
  thumb: { width: 62, height: 38, borderRadius: 5, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  thumbOn: { borderColor: C.green },
  tuck: { backgroundColor: 'rgba(90,52,16,0.55)' },
  roomName: { color: C.ink, fontSize: 10, marginTop: 4 },

  input: {
    textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 14, color: C.ink, backgroundColor: '#fff6df',
    borderWidth: 3, borderColor: C.plateEdge, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12,
    outlineStyle: 'none',
  },
});
