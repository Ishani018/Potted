import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { useLayout } from '../context/LayoutContext';
import { UI_IMAGES, BACKGROUNDS, PERK_ICONS } from '../engine/assets';
import { PETS, ROOM_NAMES } from '../constants/gameData';
import PetSprite from './PetSprite';
import { PIXEL_FONT, pixelText } from './Pixel';

// Pet card — the painted "Pixel-Art Pet Adoption Frame" (pet_frame.png, 599×656)
// with live content laid over its painted slots: banner (title), big window (pet,
// perk, room picker), name plate, coin box (price / refund) and green button.
// The window text/buttons were wiped from the art so all text is live.
const REFUND_FRACTION = 0.5; // coins returned when giving a pet up for adoption
const INK = '#5a3410', SOFT = '#8a5a24', GREEN = '#2f6a22';
const IMG_W = 599, IMG_H = 656;

// slot rectangles as fractions of the image
const F = {
  banner:   { l: 0.19, t: 0.075, w: 0.60, h: 0.085 },
  close:    { l: 0.862, t: 0.085, w: 0.09, h: 0.085 },
  window:   { l: 0.105, t: 0.2, w: 0.79, h: 0.425 },
  plate:    { l: 0.105, t: 0.645, w: 0.79, h: 0.105 },
  coinBox:  { l: 0.088, t: 0.785, w: 0.36, h: 0.125 },
  button:   { l: 0.475, t: 0.785, w: 0.43, h: 0.125 },
};

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
        <Image source={showCoin ? UI_IMAGES.petFrame : UI_IMAGES.petFrameNoCoin} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} resizeMode="stretch" />

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
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: winW * 0.36, height: winH * 0.5 }}>
                  <PetSprite petKey={petKey} w={winW * 0.36} h={winH * 0.5} />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: winW * 0.02 }}>
                  <Image source={PERK_ICONS[petKey]} style={{ width: winW * 0.15, height: winW * 0.14 }} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.perkTitle, { fontSize: fz(0.034) }]}>{pet.effect.title}</Text>
                    <Text style={[s.body, { fontSize: fz(0.029), lineHeight: fz(0.04) }]}>{pet.effect.desc}</Text>
                  </View>
                </View>
              </View>
              <Text style={[s.body, { fontSize: fz(0.03), textAlign: 'center', marginBottom: 2 }]}>
                {placedRoom == null ? 'Resting - not in a room' : `Lives in the ${ROOM_NAMES[placedRoom] ?? 'room'}`}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: winH * 0.03 }}>
                {[1, 2, 3].map((r) => (
                  <TouchableOpacity key={r} activeOpacity={0.85} onPress={() => handlePlace(r)} style={{ alignItems: 'center', width: winW * 0.22 }}>
                    <Image source={BACKGROUNDS[`room${r}`].white.summer} style={[s.thumb, { width: winW * 0.2, height: winH * 0.17 }, placedRoom === r && s.thumbOn]} resizeMode="cover" />
                    <Text style={[s.body, { fontSize: fz(0.024) }]}>{ROOM_NAMES[r]}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity activeOpacity={0.85} onPress={() => handlePlace(null)} style={{ alignItems: 'center', width: winW * 0.22 }}>
                  <View style={[s.thumb, s.tuck, { width: winW * 0.2, height: winH * 0.17, alignItems: 'center', justifyContent: 'center' }, placedRoom == null && s.thumbOn]}>
                    <Text style={pixelText(fz(0.03), '#fff')}>ZZZ</Text>
                  </View>
                  <Text style={[s.body, { fontSize: fz(0.024) }]}>Tuck away</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: winW * 0.58, height: winH * 0.62 }}>
                <PetSprite petKey={petKey} w={winW * 0.58} h={winH * 0.62} />
              </View>
              {pet.effect && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: winW * 0.025, marginTop: winH * 0.02, paddingHorizontal: winW * 0.02 }}>
                  <Image source={PERK_ICONS[petKey]} style={{ width: winW * 0.16, height: winW * 0.15 }} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.perkTitle, { fontSize: fz(0.034) }]}>{pet.effect.title}</Text>
                    <Text style={[s.body, { fontSize: fz(0.029), lineHeight: fz(0.04) }]}>{pet.effect.desc}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

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
        <Slot r={F.button} onPress={right.onPress} style={right.disabled ? { opacity: 0.6 } : null}>
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
  tuck: { backgroundColor: '#8a7a58' },
  input: {
    textAlign: 'center', fontFamily: PIXEL_FONT, color: INK, backgroundColor: '#fff6df',
    borderWidth: 3, borderColor: '#c99555', borderRadius: 8, paddingVertical: 10, outlineStyle: 'none',
  },
});
