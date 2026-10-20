import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { useLayout } from '../context/LayoutContext';
import { UI_IMAGES, BACKGROUNDS } from '../engine/assets';
import { PETS, ROOM_NAMES } from '../constants/gameData';
import PetSprite from './PetSprite';
import { Skinned } from './NineSlice';
import { PIXEL_FONT, pixelText } from './Pixel';

// Pet card — adopt (unowned), welcome + rename (just adopted) or manage (owned).
// Every frame/button is a generated pixel PNG (tools/pet_art.py) drawn 9-sliced.
const REFUND_FRACTION = 0.5; // coins returned when giving a pet up for adoption
const INK = '#5a3410', INK_SOFT = '#8a5a24', GREEN = '#3f8a35';

// image px size + corner inset for each piece
const SK = {
  card:     ['pcCard', 160, 160, 24],
  banner:   ['pcBanner', 128, 64, 20],
  portrait: ['pcPortrait', 128, 128, 22],
  plate:    ['pcPlate', 128, 88, 18],
  green:    ['pcGreen', 128, 96, 18],
  price:    ['pcPrice', 128, 88, 18],
  green_b:  ['pcBtnGreen', 112, 80, 18],
  tan_b:    ['pcBtnTan', 112, 80, 18],
  red_b:    ['pcBtnRed', 112, 80, 18],
  thumb:    ['pcThumb', 112, 80, 14],
  thumbOn:  ['pcThumbOn', 112, 80, 14],
};
function Box({ k, style, children, onPress, disabled }) {
  const [name, sw, sh, inset] = SK[k];
  return <Skinned src={UI_IMAGES[name]} sw={sw} sh={sh} inset={inset} scale={0.5} style={style} onPress={onPress} disabled={disabled}>{children}</Skinned>;
}

function Btn({ label, tone = 'green', onPress, disabled, style, leaves }) {
  const k = tone === 'green' ? 'green_b' : tone === 'red' ? 'red_b' : 'tan_b';
  const txt = tone === 'tan' ? INK : '#fff';
  return (
    <View style={style}>
      <Box k={k} onPress={onPress} disabled={disabled} style={s.btn}>
        {leaves && <Image source={UI_IMAGES.pcLeaf} style={[s.leaf, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />}
        <Text style={[pixelText(10, txt), tone === 'tan' && { textShadowColor: 'transparent' }, { marginHorizontal: 8 }]}>{label}</Text>
        {leaves && <Image source={UI_IMAGES.pcLeaf} style={s.leaf} resizeMode="contain" />}
      </Box>
    </View>
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
  const compact = owned && !greeting && !renaming;
  const bannerText = greeting ? 'WELCOME HOME!' : renaming ? 'PICK A NEW NAME' : owned ? 'YOUR PET' : 'MEET YOUR NEW FRIEND';

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: 372, maxHeight: Math.max(280, frameH - 8) }}>
        <Box k="card" style={{ padding: 18 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {/* banner + close */}
            <View style={s.topRow}>
              <View style={{ flex: 1, marginRight: 4 }}>
                <Box k="banner" style={s.banner}>
                  <Image source={UI_IMAGES.pcBlossom} style={[s.deco, { left: -8, top: -6 }]} resizeMode="contain" />
                  <Image source={UI_IMAGES.pcLeaf} style={[s.deco, { left: 8, top: -9, width: 22, height: 14 }]} resizeMode="contain" />
                  <Image source={UI_IMAGES.pcBlossom} style={[s.deco, { right: -8, top: -6 }]} resizeMode="contain" />
                  <Image source={UI_IMAGES.pcLeaf} style={[s.deco, { right: 8, top: -9, width: 22, height: 14, transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
                  <Text numberOfLines={1} style={[pixelText(10), { textAlign: 'center' }]}>{bannerText}</Text>
                </Box>
              </View>
              <TouchableOpacity style={s.close} onPress={onClose} activeOpacity={0.85}>
                <Image source={UI_IMAGES.cancelbutton} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </TouchableOpacity>
            </View>

            {/* portrait */}
            <Box k="portrait" style={s.portrait}>
              {!compact && (
                <View style={s.sprouts} pointerEvents="none">
                  <Image source={UI_IMAGES.pcSprout} style={s.sprout} resizeMode="contain" />
                  <Image source={UI_IMAGES.pcSprout} style={[s.sprout, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
                </View>
              )}
              <View style={{ width: compact ? 110 : 190, height: compact ? 78 : 140, alignItems: 'center', justifyContent: 'flex-end' }}>
                <PetSprite petKey={petKey} w={compact ? 100 : 170} h={compact ? 74 : 132} />
              </View>
            </Box>

            {/* name plate */}
            <Box k="plate" style={s.plate}>
              <Image source={UI_IMAGES.pcPaw} style={s.paw} resizeMode="contain" />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={pixelText(13, INK)} numberOfLines={1}>{display}</Text>
                <Text style={[pixelText(7, INK_SOFT), { marginTop: 5 }]}>
                  {'- '}{pet.breed.toUpperCase()}{savedName ? ` / ${pet.name.toUpperCase()}` : ''}{' -'}
                </Text>
              </View>
              <Image source={UI_IMAGES.pcPaw} style={s.paw} resizeMode="contain" />
            </Box>

            {greeting ? (
              <>
                <Box k="green" style={s.note}>
                  <Text style={s.noteTxt}>You adopted {pet.name}! They already have a name, but you can give them a new one if you like.</Text>
                </Box>
                <View style={s.row}>
                  <Btn label="RENAME" onPress={() => { setName(pet.name); setStep('rename'); }} style={{ flex: 1 }} leaves />
                  <Btn label="KEEP NAME" tone="tan" onPress={() => setStep(null)} style={{ flex: 1 }} />
                </View>
              </>
            ) : renaming ? (
              <>
                <Box k="price" style={{ padding: 4 }}>
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
                </Box>
                <View style={s.row}>
                  <Btn label="SAVE" onPress={saveName} style={{ flex: 1 }} leaves />
                  <Btn label="CANCEL" tone="tan" onPress={() => setStep(null)} style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              <>
                {pet.effect && (
                  <Box k="green" style={s.perk}>
                    <Image source={UI_IMAGES.pcPerk} style={{ width: 34, height: 38 }} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={s.perkTitle}>{pet.effect.title}</Text>
                      <Text style={s.perkTxt}>{pet.effect.desc}</Text>
                    </View>
                  </Box>
                )}

                {!owned ? (
                  <View style={s.row}>
                    <Box k="price" style={s.price}>
                      <Image source={UI_IMAGES.goldcoins} style={{ width: 28, height: 28 }} resizeMode="contain" />
                      <Text style={pixelText(14, INK)}>{pet.price}</Text>
                    </Box>
                    <Btn
                      label={canAfford ? (isPair ? 'ADOPT PAIR' : 'ADOPT') : `NEED ${pet.price - state.player.coins} MORE`}
                      onPress={handleAdopt}
                      disabled={!canAfford}
                      style={{ flex: 1 }}
                      leaves={canAfford}
                    />
                  </View>
                ) : (
                  <>
                    <Box k="green" style={s.homeBox}>
                      <Text style={s.homeLabel}>
                        {placedRoom == null ? 'Resting - not in a room' : `Lives in the ${ROOM_NAMES[placedRoom] ?? 'room'}`}
                      </Text>
                      <View style={s.rooms}>
                        {[1, 2, 3].map((r) => (
                          <TouchableOpacity key={r} activeOpacity={0.85} onPress={() => handlePlace(r)} style={s.room}>
                            <Box k={placedRoom === r ? 'thumbOn' : 'thumb'} style={{ padding: 3 }}>
                              <Image source={BACKGROUNDS[`room${r}`].white.summer} style={s.thumbImg} resizeMode="cover" />
                            </Box>
                            <Text style={s.roomName}>{ROOM_NAMES[r]}</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity activeOpacity={0.85} onPress={() => handlePlace(null)} style={s.room}>
                          <Box k={placedRoom == null ? 'thumbOn' : 'thumb'} style={{ padding: 3 }}>
                            <View style={[s.thumbImg, s.tuck]}><Text style={pixelText(9, '#fff')}>ZZZ</Text></View>
                          </Box>
                          <Text style={s.roomName}>Tuck away</Text>
                        </TouchableOpacity>
                      </View>
                    </Box>
                    <View style={s.row}>
                      <Btn label="RENAME" tone="tan" onPress={() => { setName(savedName ?? pet.name); setStep('rename'); }} style={{ flex: 1 }} />
                      <Btn label={`REHOME +${refund}`} tone="red" onPress={handleGiveUp} style={{ flex: 1 }} />
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </Box>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,12,0,0.55)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6 },
  close: { width: 32, height: 32 },
  banner: { paddingVertical: 10, paddingHorizontal: 18, justifyContent: 'center' },
  deco: { position: 'absolute', width: 18, height: 18, zIndex: 3 },

  portrait: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  sprouts: { position: 'absolute', left: 14, right: 14, top: 44, flexDirection: 'row', justifyContent: 'space-between' },
  sprout: { width: 24, height: 34 },

  plate: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14 },
  paw: { width: 18, height: 18 },

  note: { padding: 14 },
  noteTxt: { color: INK, fontSize: 13, lineHeight: 18 },

  perk: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  perkTitle: { color: GREEN, fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  perkTxt: { color: INK, fontSize: 13, lineHeight: 17 },

  row: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  price: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 112, paddingHorizontal: 12, paddingVertical: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 10 },
  leaf: { width: 18, height: 12 },

  homeBox: { paddingVertical: 10, paddingHorizontal: 12 },
  homeLabel: { color: INK, fontSize: 12, marginBottom: 6, textAlign: 'center' },
  rooms: { flexDirection: 'row', justifyContent: 'space-between' },
  room: { alignItems: 'center', width: 70 },
  thumbImg: { width: 58, height: 36, borderRadius: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  tuck: { backgroundColor: '#8a7a58' },
  roomName: { color: INK, fontSize: 10, marginTop: 4 },

  input: {
    textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 14, color: INK,
    paddingVertical: 10, paddingHorizontal: 12, outlineStyle: 'none',
  },
});
