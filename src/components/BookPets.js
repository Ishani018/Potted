import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { PET_IMAGES, PERK_ICONS } from '../engine/assets';
import { PETS, FED_BOOST, formatDuration, knownPetKeys, CUSTOMERS, STRAYS } from '../constants/gameData';
import { isFed } from '../engine/petEffects';
import PetSprite from './PetSprite';
import BookFrame from './BookFrame';
import { BookTabs, BookButton, bookStyles as b, INK, PIXEL_FONT, BODY } from './BookParts';

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
                  style={[b.tile, mine && b.tileFound, k === selected && b.tileSel, s.card, KEYS.length > 12 && { width: '18%' }]}
                >
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
          <View style={[b.hero, { width: 120, height: 92 }]}>
            <View style={[b.glow, !has && b.glowLocked, { width: 82, height: 82, borderRadius: 41 }]} />
            {has ? (
              <PetSprite petKey={selected} w={84} h={78} />
            ) : (
              <>
                <Image source={PET_IMAGES[selected]} style={[{ width: 80, height: 74 }, b.silhouette]} resizeMode="contain" />
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
            <Text style={[b.tagline, { color: isFed(state.player, selected) ? '#3f7a2e' : '#a08860' }]}>
              {isFed(state.player, selected)
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
                <BookButton label="Rename" onPress={startRename} style={{ marginTop: 5 }} />
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
  perkIcon: { width: 34, height: 32 },
  perkTitle: { fontFamily: PIXEL_FONT, color: '#3f7a2e', fontSize: 8, marginBottom: 2 },
  perkDesc: { fontFamily: BODY, color: INK, fontSize: 13, lineHeight: 14 },
  row: { flexDirection: 'row', gap: 6 },
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  input: {
    width: 120, textAlign: 'center', fontFamily: PIXEL_FONT, fontSize: 10, color: INK, backgroundColor: '#fff6df',
    borderWidth: 2, borderColor: '#c99555', borderRadius: 8, paddingVertical: 6, outlineStyle: 'none',
  },
});
