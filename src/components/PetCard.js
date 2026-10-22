import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { useLayout } from '../context/LayoutContext';
import { PETCARD_IMAGES, PETCARD_GRASS, PERK_ICONS } from '../engine/assets';
import { PETS, ROOM_NAMES } from '../constants/gameData';
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

export function AdoptModal({ petKey, onClose, story }) {
  const { state, dispatch } = useGame();
  const { height: frameH } = useLayout();
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

  const W = Math.min(430, Math.max(260, (frameH - 6) * (IMG_W / IMG_H)));
  const H = W * (IMG_H / IMG_W);
  const R = (r) => ({ position: 'absolute', left: W * r.l, top: H * r.t, width: W * r.w, height: H * r.h });
  const fz = (n) => Math.max(7, Math.round(W * n));

  const bannerText = greeting ? 'WELCOME HOME!' : renaming ? 'PICK A NEW NAME' : owned ? 'YOUR PET' : 'MEET YOUR NEW FRIEND';
  const display = (savedName ?? pet.name).toUpperCase();

  // bottom row actions
  let left = null, right = null;
  if (greeting) {
    left = { label: 'KEEP NAME', onPress: () => setStep(null), tone: 'tan' };
    right = { label: 'RENAME', onPress: () => { setName(pet.name); setStep('rename'); } };
  } else if (renaming) {
    left = { label: 'CANCEL', onPress: () => setStep(null), tone: 'tan' };
    right = { label: 'SAVE', onPress: saveName };
  } else if (owned) {
    left = { label: `+${refund}`, sub: 'REHOME', onPress: handleGiveUp, tone: 'coin' };
    right = { label: 'RENAME', onPress: () => { setName(savedName ?? pet.name); setStep('rename'); } };
  } else {
    left = { label: String(pet.price), tone: 'coin', static: true };
    right = { label: canAfford ? (isPair ? 'ADOPT PAIR' : 'ADOPT') : `NEED ${pet.price - state.player.coins} MORE`, onPress: canAfford ? handleAdopt : undefined, disabled: !canAfford };
  }

  const Slot = ({ r, onPress, children, style }) => (
    <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={onPress} disabled={!onPress} style={[R(r), { alignItems: 'center', justifyContent: 'center' }, style]}>
      {children}
    </TouchableOpacity>
  );

  const winW = W * F.window.w, winH = H * F.window.h;

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: W, height: H }}>
        <Image source={showCoin ? PETCARD_IMAGES.coin : PETCARD_IMAGES.nocoin} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} resizeMode="stretch" />

        {/* banner title */}
        <View pointerEvents="none" style={[R(F.banner), { alignItems: 'center', justifyContent: 'center' }]}>
          <Text numberOfLines={1} style={pixelText(fz(bannerText.length > 16 ? 0.0245 : 0.03))}>{bannerText}</Text>
        </View>

        {/* painted red X */}
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={R(F.close)} />

        {/* ── window ── */}
        <View style={[R(F.window), { paddingHorizontal: winW * 0.03, paddingTop: winH * 0.03 }]} pointerEvents="box-none">
          {renaming ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: winH * 0.06 }}>
              <View style={{ width: winW * 0.45, height: winH * 0.45 }}>
                <PetSprite petKey={petKey} w={winW * 0.45} h={winH * 0.45} />
              </View>
              <TextInput
                value={name}
                onChangeText={(t) => setName(t.slice(0, 12))}
                maxLength={12}
                autoFocus
                selectTextOnFocus
                placeholder={pet.name}
                placeholderTextColor="#b8793a"
                onSubmitEditing={saveName}
                style={[s.input, { fontSize: fz(0.034), width: winW * 0.75 }]}
              />
            </View>
          ) : greeting ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: winH * 0.05 }}>
              <View style={{ width: winW * 0.5, height: winH * 0.5 }}>
                <PetSprite petKey={petKey} w={winW * 0.5} h={winH * 0.5} />
              </View>
              <Text style={[s.body, { fontSize: fz(0.036), lineHeight: fz(0.05), textAlign: 'center' }]}>
                You adopted {pet.name}! They already have a name, but you can give them a new one if you like.
              </Text>
            </View>
          ) : manage ? (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <OnGrass petKey={petKey} winW={winW} w={winW * 0.36} h={winH * 0.4} />
              {/* two big choices, no cramped room picker */}
              <View style={{ flexDirection: 'row', gap: winW * 0.04, marginTop: winH * 0.03, alignSelf: 'stretch', paddingHorizontal: winW * 0.04 }}>
                {[['all', 'EVERY ROOM'], [null, 'TUCK AWAY']].map(([val, label]) => {
                  const on = (placedRoom === 'all' || (typeof placedRoom === 'number')) ? val === 'all' : val === null;
                  return (
                    <TouchableOpacity key={label} activeOpacity={0.85} onPress={() => handlePlace(val)} style={[s.choice, { flex: 1, paddingVertical: winH * 0.03 }, on && s.choiceOn]}>
                      <Text style={pixelText(fz(0.028), on ? '#fff' : INK)}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <OnGrass petKey={petKey} winW={winW} w={winW * 0.5} h={winH * (story ? 0.44 : 0.7)} />
              {story ? <Text style={[s.body, { fontSize: fz(0.028), lineHeight: fz(0.038), textAlign: 'center', marginTop: winH * 0.02, paddingHorizontal: winW * 0.02 }]} numberOfLines={3}>{story}</Text> : null}
            </View>
          )}
        </View>

        {/* what the pet does, in the painted green strip */}
        {pet.effect && !renaming && (
          <View pointerEvents="none" style={[R(F.perk), { flexDirection: 'row', alignItems: 'center', paddingHorizontal: W * 0.025, gap: W * 0.02 }]}>
            <Image source={PERK_ICONS[petKey]} style={{ width: W * 0.1, height: W * 0.095 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[s.perkTitle, { fontSize: fz(0.034) }]} numberOfLines={1}>{pet.effect.title}</Text>
              <Text style={[s.body, { fontSize: fz(0.027), lineHeight: fz(0.034) }]} numberOfLines={2}>{pet.effect.desc}</Text>
            </View>
          </View>
        )}

        {/* name plate */}
        <View pointerEvents="none" style={[R(F.plate), { alignItems: 'center', justifyContent: 'center' }]}>
          <Text numberOfLines={1} style={pixelText(fz(0.042), INK)}>{display}</Text>
          <Text style={[pixelText(fz(0.02), SOFT), { marginTop: 3 }]}>
            {'- '}{pet.breed.toUpperCase()}{savedName ? ` / ${pet.name.toUpperCase()}` : ''}{' -'}
          </Text>
        </View>

        {/* bottom-left (coin box) */}
        <Slot r={F.coinBox} onPress={left.onPress} style={showCoin ? { paddingLeft: W * 0.16 } : null}>
          <Text style={[pixelText(fz(left.static ? 0.05 : left.sub ? 0.036 : 0.026), INK), { textShadowColor: 'transparent' }]} numberOfLines={1}>{left.label}</Text>
          {left.sub && <Text style={[pixelText(fz(0.02), '#8a2a1a'), { textShadowColor: 'transparent', marginTop: 2 }]}>{left.sub}</Text>}
        </Slot>

        {/* bottom-right (green button) */}
        <Slot r={F.button} onPress={right.onPress} style={[{ paddingLeft: W * 0.1 }, right.disabled ? { opacity: 0.6 } : null]}>
          <Text style={pixelText(fz(0.034))} numberOfLines={1}>{right.label}</Text>
        </Slot>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,12,0,0.55)',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  body: { color: INK },
  perkTitle: { color: GREEN, fontWeight: 'bold', marginBottom: 2 },
  thumb: { borderRadius: 4, borderWidth: 3, borderColor: 'transparent' },
  thumbOn: { borderColor: '#3f8a35' },
  choice: { alignItems: 'center', borderRadius: 8, borderWidth: 3, borderColor: '#c99555', backgroundColor: '#fde9b8' },
  choiceOn: { borderColor: '#1d4a14', backgroundColor: '#3f8a35' },
  input: {
    textAlign: 'center', fontFamily: HEAD, color: INK, backgroundColor: '#fff6df',
    borderWidth: 3, borderColor: '#c99555', borderRadius: 8, paddingVertical: 10, outlineStyle: 'none',
  },
});
