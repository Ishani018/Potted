import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { useLayout } from '../context/LayoutContext';
import { PETCARD_GRASS, PERK_ICONS, SET_UI, UI_IMAGES } from '../engine/assets';
import { PETS, ROOM_NAMES, CUSTOMERS } from '../constants/gameData';
import Portrait from './Portrait';
import PetSprite from './PetSprite';
import { PIXEL_FONT } from './Pixel';

// the card's lettering: the same soft serif as the other painted pop-ups
const HEAD = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
const pixelText = (size, color) => ({
  fontFamily: HEAD, fontSize: Math.round(size * 1.45), color: color ?? '#fbf3da',
  ...(color ? {} : { textShadowColor: 'rgba(40,24,6,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }),
});

// Pet card — the painted "Pixel-Art Pet Adoption Frame" (pet_frame.png, 599×656)
// with live content laid over its painted slots: banner (title), big window (pet,
// perk, room picker), name plate, coin box (price / refund) and green button.
// The window text/buttons were wiped from the art so all text is live.
const REFUND_FRACTION = 0.5; // coins returned when giving a pet up for adoption
const INK = '#5a3410', SOFT = '#8a5a24', GREEN = '#2f6a22';
const IMG_W = 600, IMG_H = 624;

// slot rectangles as fractions of the image
const F = {
  banner:   { l: 0.193, t: 0.034, w: 0.579, h: 0.077 },
  close:    { l: 0.854, t: 0.036, w: 0.116, h: 0.111 },
  window:   { l: 0.064, t: 0.147, w: 0.852, h: 0.405 },
  perk:     { l: 0.09, t: 0.56, w: 0.77, h: 0.12 },
  plate:    { l: 0.093, t: 0.706, w: 0.764, h: 0.117 },
  coinBox:  { l: 0.0675, t: 0.847, w: 0.326, h: 0.116 },
  button:   { l: 0.418, t: 0.847, w: 0.466, h: 0.116 },
};

// A pet sitting on its grass patch: the patch is wider than the pet, the pet's feet land on it.
function OnGrass({ petKey, w, h, winW }) {
  const gw = Math.min(winW * 0.8, w * 1.75), gh = gw * (146 / 620);
  return (
    <View style={{ width: gw, height: h + gh * 0.35, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Image source={PETCARD_GRASS} style={{ position: 'absolute', bottom: 0, width: gw, height: gh }} resizeMode="stretch" />
      <View style={{ width: w, height: h, marginBottom: gh * 0.30 }}><PetSprite petKey={petKey} w={w} h={h} /></View>
    </View>
  );
}

export function AdoptModal({ petKey, onClose, finder }) {
  const { state, dispatch } = useGame();
  const { height: frameH, width: frameW } = useLayout();
  const pet = PETS[petKey];
  const owned = (state.player.ownedPets ?? []).includes(petKey);
  const placedRoom = state.player.petPlacements?.[petKey] ?? null;   // 'all' | room number (older saves) | null
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

  const greeting = step === 'greet' && owned;
  const renaming = step === 'rename' && owned;
  const manage = owned && !greeting && !renaming;
  const showCoin = !greeting && !renaming;           // coin art only on price/refund views

  const W = Math.min(620, Math.max(320, (frameW || 800) * 0.72));
  const picW = Math.min(W * 0.42, Math.max(150, (frameH || 480) * 0.5));
  const bannerText = greeting ? 'Welcome home!' : renaming ? 'Pick a new name' : owned ? 'Your pet' : 'Meet your new friend';
  const display = savedName ?? pet.name;
  const fav = (state.player.favourites ?? []).includes('pet:' + petKey);

  // bottom row actions
  let left = null, right = null;
  if (greeting) {
    left = { label: 'Keep name', onPress: () => setStep(null) };
    right = { label: 'Rename', onPress: () => { setName(pet.name); setStep('rename'); } };
  } else if (renaming) {
    left = { label: 'Cancel', onPress: () => setStep(null) };
    right = { label: 'Save', onPress: saveName };
  } else if (owned) {
    left = { label: `Rehome  +${refund}`, onPress: handleGiveUp };
    right = { label: 'Rename', onPress: () => { setName(savedName ?? pet.name); setStep('rename'); } };
  } else {
    right = { label: canAfford ? (isPair ? 'Adopt the pair' : 'Adopt') : `Need ${pet.price - state.player.coins} more`, onPress: canAfford ? handleAdopt : undefined, disabled: !canAfford };
  }

  const Btn = ({ b, green }) => (
    <TouchableOpacity activeOpacity={0.8} disabled={!b.onPress} onPress={b.onPress} style={{ width: Math.min(170, W * 0.36), height: 42, opacity: b.disabled ? 0.55 : 1 }}>
      <Image source={SET_UI[green ? 'btnGreen' : 'btnCream'].src} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text numberOfLines={1} style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 'bold', color: green ? '#fff3d0' : INK }}>{b.label}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[s.panel, { width: W }]}>
        <View style={s.topRight}>
          <TouchableOpacity onPress={() => dispatch({ type: 'TOGGLE_FAV', id: 'pet:' + petKey })} activeOpacity={0.8}>
            <Image source={(fav ? SET_UI.heart : SET_UI.heartOff).src} style={{ width: 34, height: 30 }} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
            <Image source={SET_UI.close.src} style={{ width: 32, height: 31 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={[s.picFrame, { width: picW, height: picW * 1.02 }]}>
            {renaming || greeting
              ? <PetSprite petKey={petKey} w={picW * 0.95} h={picW * 0.95} />
              : <OnGrass petKey={petKey} winW={picW} w={picW * 0.82} h={picW * 0.86} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={s.petName}>{display}</Text>
            {renaming ? (
              <TextInput value={name} onChangeText={(t) => setName(t.slice(0, 12))} maxLength={12} autoFocus selectTextOnFocus placeholder={pet.name}
                placeholderTextColor="#b8793a" onSubmitEditing={saveName} style={s.input} />
            ) : greeting ? (
              <Text style={s.body}>You adopted {pet.name}! They already have a name, but you can give them a new one if you like.</Text>
            ) : (
              <>
                <View style={s.priceRow}>
                  <Image source={UI_IMAGES.goldcoins} style={{ width: 26, height: 26 }} resizeMode="contain" />
                  <Text style={s.price}>{owned ? `${refund} back if rehomed` : pet.price}</Text>
                  {owned ? <Text style={s.tag}>Yours</Text> : null}
                </View>
                {pet.effect ? <Text style={s.body}>{pet.effect.desc}</Text> : null}
                <View style={s.detailRow}><Text style={s.detailKey}>Breed</Text><Text style={s.detailVal}>{pet.breed}</Text></View>
                {pet.effect ? <View style={s.detailRow}><Text style={s.detailKey}>Perk</Text><Text style={s.detailVal}>{pet.effect.title}</Text></View> : null}
                {finder && CUSTOMERS[finder] ? <View style={s.detailRow}><Text style={s.detailKey}>Found by</Text><Text style={s.detailVal}>{CUSTOMERS[finder].name}</Text></View> : null}
                {manage ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    {[['all', 'Every room'], [null, 'Tuck away']].map(([val, label]) => {
                      const on = (placedRoom === 'all' || (typeof placedRoom === 'number')) ? val === 'all' : val === null;
                      return (
                        <TouchableOpacity key={label} activeOpacity={0.85} onPress={() => handlePlace(val)} style={[s.choice, on && s.choiceOn]}>
                          <Text style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 'bold', color: on ? '#fff3d0' : INK }}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>

        <View style={s.footRow}>
          {left ? <Btn b={left} /> : null}
          <Btn b={right} green />
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,12,0,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  panel: { backgroundColor: '#f3e0b6', borderWidth: 4, borderColor: '#8a5a2a', borderRadius: 18, padding: 14, gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: HEAD, fontSize: 22, fontWeight: 'bold', color: '#4a2a10', flex: 1 },
  topRight: { position: 'absolute', right: 12, top: 10, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tag: { fontFamily: HEAD, fontSize: 13, color: '#fff3d0', backgroundColor: '#8a5a2a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 1, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#d9bd86', paddingVertical: 2 },
  detailKey: { fontFamily: HEAD, fontSize: 14, color: '#7a5030' },
  detailVal: { fontFamily: HEAD, fontSize: 14, color: '#4a2a10', fontWeight: 'bold' },
  picFrame: { alignItems: 'center', justifyContent: 'center' },
  petName: { fontFamily: HEAD, fontSize: 28, fontWeight: 'bold', color: '#4a2a10' },
  breed: { fontFamily: HEAD, fontSize: 14, color: '#7a5030' },
  body: { fontFamily: HEAD, fontSize: 15, color: '#6a4524' },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  perkTitle: { fontFamily: HEAD, fontSize: 15, fontWeight: 'bold', color: GREEN },
  perkDesc: { fontFamily: HEAD, fontSize: 13, color: '#6a4524' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  price: { fontFamily: HEAD, fontSize: 24, fontWeight: 'bold', color: '#4a2a10' },
  footRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  choice: { borderRadius: 10, borderWidth: 2, borderColor: '#b98a4e', backgroundColor: '#ecd9a6', paddingHorizontal: 12, paddingVertical: 5 },
  choiceOn: { borderColor: '#2f5a22', backgroundColor: '#4f8a3a' },
  input: { fontFamily: HEAD, fontSize: 18, color: INK, backgroundColor: '#fff6df', borderWidth: 2, borderColor: '#b98a4e', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, outlineStyle: 'none' },
});
