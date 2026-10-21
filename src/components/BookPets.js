import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { PET_IMAGES, PERK_ICONS } from '../engine/assets';
import { PETS, FED_BOOST, formatDuration, knownPetKeys, CUSTOMERS, STRAYS } from '../constants/gameData';
import { adventureLeftMs } from '../engine/adventures';
import { isFed } from '../engine/petEffects';
import PetSprite from './PetSprite';
import BookFrame from './BookFrame';
import TileFrame from './TileFrame';
import { BookTabs, BookButton, bookStyles as b, INK, PIXEL_FONT, BODY, HEAD } from './BookParts';

// Flower book → Pets. A portrait card for every pet. Pets you've adopted are in
// colour; the rest are silhouettes. The card shows their perk and (for your pets)
// lets you choose where they live and give them a new name. Adopting still
// happens at the pet shop.

export default function BookPets({ tab, setTab }) {
  const { state, dispatch } = useGame();
  const owned = state.player.ownedPets ?? [];
  const names = state.player.petNames ?? {};
  const placements = state.player.petPlacements ?? {};
  const KEYS = knownPetKeys(state.player);
  const [selected, setSelected] = useState(Object.keys(PETS)[0]);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');

  const pet = PETS[selected];
  const has = owned.includes(selected);
  const shown = (k) => names[k] ?? PETS[k].name;
  const home = placements[selected] != null;     // 'all' (or an older room number) = out and about
  const count = owned.filter((k) => PETS[k]).length;
  const found = state.player.petFound?.[selected];
  const now = Date.now();
  const away = !!state.player.adventures?.[selected];
  const left = adventureLeftMs(state.player, selected, now);

  const pick = (k) => { setSelected(k); setRenaming(false); };
  const startRename = () => { setDraft(names[selected] ?? pet.name); setRenaming(true); };
  const saveName = () => { dispatch({ type: 'NAME_PET', petKey: selected, name: draft }); setRenaming(false); };

  return (
    <BookFrame
      left={(
        <View style={b.pageInner}>
          <BookTabs tab={tab} setTab={setTab} />
          <Text style={b.progress}>{count} / {KEYS.length} adopted</Text>
          <View style={b.grid}>
            {KEYS.map((k) => {
              const mine = owned.includes(k);
              return (
                <TouchableOpacity
                  key={k}
                  activeOpacity={0.8}
                  onPress={() => pick(k)}
                  style={[b.tile, mine && b.tileFound, k === selected && b.tileSel, s.card, KEYS.length > 20 ? { width: '14.8%' } : KEYS.length > 12 && { width: '18%' }]}
                >
                  <TileFrame state={k === selected ? 'selected' : mine ? 'found' : 'empty'} />
                  <View style={b.tileArt}>
                    <Image source={PET_IMAGES[k]} style={[s.tileImg, !mine && b.silhouette]} resizeMode="contain" />
                    {!mine && <Text style={b.tileQ}>?</Text>}
                  </View>
                  <Text numberOfLines={1} style={[b.tileName, !mine && b.tileNameLocked]}>{mine ? shown(k) : '???'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
      right={(
        <ScrollView style={b.pageInner} contentContainerStyle={b.detail} showsVerticalScrollIndicator={false}>
          <View style={[b.hero, { width: 120, height: 70 }]}>
            <View style={[b.glow, !has && b.glowLocked, { width: 64, height: 64, borderRadius: 32 }]} />
            {has ? (
              <PetSprite petKey={selected} w={70} h={62} />
            ) : (
              <>
                <Image source={PET_IMAGES[selected]} style={[{ width: 66, height: 60 }, b.silhouette]} resizeMode="contain" />
                <Text style={[b.tileQ, { fontSize: 22 }]}>?</Text>
              </>
            )}
          </View>

          <Text style={b.name}>{has ? shown(selected) : '???'}</Text>
          <Text style={b.sub}>{pet.breed}{has && names[selected] ? ` · ${pet.name}` : ''}</Text>
          {has && found && CUSTOMERS[found] && STRAYS[selected] && (
            <Text style={[b.tagline, { color: '#a08860' }]}>{`✦ Found by ${CUSTOMERS[found].name}`}</Text>
          )}

          {has && (
            <Text style={[b.tagline, { color: away ? '#a8700a' : isFed(state.player, selected) ? '#3f7a2e' : '#a08860' }]}>
              {away
                ? (left > 0 ? `✦ Out exploring, back in ${formatDuration(left)}` : '✦ Back with a box!')
                : isFed(state.player, selected)
                  ? `✦ Fed, perk ${FED_BOOST}x for ${formatDuration(state.player.petCare[selected] - Date.now())}`
                  : '✦ Hungry, try the pet food aisle'}
            </Text>
          )}

          {pet.effect && (
            <View style={s.perk}>
              <Image source={PERK_ICONS[selected]} style={s.perkIcon} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={s.perkTitle}>{pet.effect.title}</Text>
                <Text style={s.perkDesc}>{pet.effect.desc}</Text>
              </View>
            </View>
          )}

          {has ? (
            renaming ? (
              <View style={s.renameRow}>
                <TextInput
                  value={draft}
                  onChangeText={(t) => setDraft(t.slice(0, 12))}
                  maxLength={12}
                  autoFocus
                  selectTextOnFocus
                  onSubmitEditing={saveName}
                  placeholder={pet.name}
                  placeholderTextColor="#b8793a"
                  style={s.input}
                />
                <BookButton label="SAVE" onPress={saveName} on />
              </View>
            ) : (
              <>
                <Text style={b.label}>LIVES IN</Text>
                <View style={s.row}>
                  <BookButton label="Every room" on={home} onPress={() => dispatch({ type: 'PLACE_PET', petKey: selected, room: 'all' })} />
                  <BookButton label="Tuck away" on={!home} onPress={() => dispatch({ type: 'PLACE_PET', petKey: selected, room: null })} />
                </View>
                <View style={[s.row, { marginTop: 5 }]}>
                  <BookButton label="Rename" onPress={startRename} />
                  {away ? (
                    left > 0
                      ? <BookButton label={`Away ${formatDuration(left)}`} disabled onPress={() => {}} />
                      : <BookButton label="Open box" on onPress={() => dispatch({ type: 'COLLECT_ADVENTURE', petKey: selected, now: Date.now(), seed: Math.random() })} />
                  ) : (
                    <BookButton label="Adventure" on onPress={() => dispatch({ type: 'SEND_ADVENTURE', petKey: selected, now: Date.now() })} />
                  )}
                </View>
              </>
            )
          ) : (
            <Text style={b.note}>
              {pet.stray
                ? `Waiting at the Foster Center. Adopt ${pet.name} for ${pet.price} coins.`
                : `Not adopted yet. Visit the pet shop to adopt ${pet.name} for ${pet.price} coins.`}
            </Text>
          )}
        </ScrollView>
      )}
    />
  );
}

const s = StyleSheet.create({
  card: { width: '23%', aspectRatio: 0.88 },
  tileImg: { width: '92%', height: '92%' },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch', marginTop: 2, marginBottom: 2, paddingHorizontal: 4 },
  perkIcon: { width: 28, height: 27 },
  perkTitle: { fontFamily: HEAD, color: '#3f7a2e', fontSize: 16, marginBottom: 1 },
  perkDesc: { fontFamily: BODY, color: INK, fontSize: 12.5, lineHeight: 13 },
  row: { flexDirection: 'row', gap: 6 },
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  input: {
    width: 120, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 10, color: INK, backgroundColor: '#fff6df',
    borderWidth: 2, borderColor: '#c99555', borderRadius: 8, paddingVertical: 6, outlineStyle: 'none',
  },
});
