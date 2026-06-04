import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_PLAYER_STATE, ROOM_UNLOCK_COSTS } from '../constants/gameData';
import {
  tickAllSlots,
  harvestPlant,
  waterPlant,
  plantSeed,
  createEmptySlot,
  calcHangingPassiveCoins,
} from '../engine/gameEngine';
import { getSnapPoints } from '../engine/snapPoints';

const STORAGE_KEY = '@potted_save_v4';
const TICK_INTERVAL_MS = 60_000;

// slot: { slotId, room, type, flowerKey, stage, plantedAt, lastWatered, wilting, _budWatered }

const INVENTORY_CAP = 35; // 7×5 grid

const initialState = {
  player: INITIAL_PLAYER_STATE,
  slots: {},
  inventory: [],       // { id, flowerKey } seed bags owned (shared across rooms)
  heldSeed: null,      // { invItemId, flowerKey } picked from inventory, awaiting a pot tap
  initialized: false,
  lastPassiveTick: Date.now(),
};

function reducer(state, action) {
  switch (action.type) {

    case 'LOAD': {
      return { ...state, ...action.payload, initialized: true };
    }

    case 'TICK': {
      const now = action.now;
      const updatedSlots = tickAllSlots(state.slots, now);
      const passiveCoins = calcHangingPassiveCoins(state.slots, state.lastPassiveTick, now);
      return {
        ...state,
        slots: updatedSlots,
        lastPassiveTick: now,
        player: { ...state.player, coins: state.player.coins + passiveCoins },
      };
    }

    case 'INIT_SLOTS': {
      const { screenWidth, screenHeight } = action;
      const slots = { ...state.slots };
      for (const room of [1, 2, 3]) {
        // Only auto-create hanging slots; potted pots are placed by dragging
        for (const type of ['hanging']) {
          const pts = getSnapPoints(room, type, screenWidth, screenHeight);
          for (const pt of pts) {
            if (!slots[pt.id]) {
              slots[pt.id] = createEmptySlot(pt.id, room, type);
            }
          }
        }
      }
      return { ...state, slots };
    }

    // Buy a seed in the nursery → charge coins, add a bag to the shared inventory.
    // action: { flowerKey, price }
    case 'BUY_SEED': {
      const { flowerKey, price = 0 } = action;
      if (state.player.coins < price) return state;          // can't afford
      if (state.inventory.length >= INVENTORY_CAP) return state; // inventory full
      const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return {
        ...state,
        player: { ...state.player, coins: state.player.coins - price },
        inventory: [...state.inventory, { id, flowerKey }],
      };
    }

    // Pick a seed from the inventory to plant next (held until a pot is tapped).
    case 'HOLD_SEED': {
      const { invItemId, flowerKey } = action;
      return { ...state, heldSeed: { invItemId, flowerKey } };
    }

    case 'CLEAR_HELD': {
      return { ...state, heldSeed: null };
    }

    // Tap an empty pot while holding a seed → plant it, consume from inventory.
    case 'PLANT_HELD': {
      const { slotId } = action;
      const held = state.heldSeed;
      const slot = state.slots[slotId];
      if (!held || !slot || slot.flowerKey) return state;
      return {
        ...state,
        slots: { ...state.slots, [slotId]: plantSeed(slot, held.flowerKey) },
        inventory: state.inventory.filter((i) => i.id !== held.invItemId),
        heldSeed: null,
      };
    }

    case 'PLACE_POT': {
      const { slotId, room } = action;
      // Reject if pot already placed (hasPot:true) or if slot has a plant
      if (state.slots[slotId]?.hasPot) return state;
      const type = slotId.includes('_h') ? 'hanging' : 'potted';
      return {
        ...state,
        slots: { ...state.slots, [slotId]: createEmptySlot(slotId, room, type, true) },
      };
    }

    case 'WATER_PLANT': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot || !slot.flowerKey) return state;
      return { ...state, slots: { ...state.slots, [slotId]: waterPlant(slot) } };
    }

    case 'HARVEST_PLANT': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot) return state;
      const { flowerKey, amount, slot: clearedSlot } = harvestPlant(slot);
      if (!flowerKey || amount <= 0) return state; // not harvestable
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      harvested[flowerKey] = (harvested[flowerKey] ?? 0) + amount;
      return {
        ...state,
        slots: { ...state.slots, [slotId]: { ...clearedSlot, hasPot: slot.hasPot } },
        player: {
          ...state.player,
          harvestedFlowers: harvested,
          harvestCount: (state.player.harvestCount ?? 0) + 1,
        },
      };
    }

    // Trade harvested flowers for coins at the market.
    // action: { flowerKey, qty, unitPrice }
    case 'TRADE_FLOWERS': {
      const { flowerKey, qty, unitPrice } = action;
      const have = state.player.harvestedFlowers?.[flowerKey] ?? 0;
      const n = Math.min(qty, have);
      if (n <= 0) return state;
      const harvested = { ...(state.player.harvestedFlowers ?? {}) };
      harvested[flowerKey] = have - n;
      if (harvested[flowerKey] <= 0) delete harvested[flowerKey];
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + n * unitPrice,
          harvestedFlowers: harvested,
        },
      };
    }

    case 'REMOVE_PLANT': {
      const { slotId, deletePot } = action;
      const slot = state.slots[slotId];
      if (!slot) return state;
      // deletePot (room 2) or potted: remove the pot too. For hanging slots that
      // are auto-created by INIT_SLOTS, reset to hasPot:false instead of deleting
      // so the empty rod hook (drag target) reappears.
      if (slot.type === 'potted') {
        const { [slotId]: _, ...rest } = state.slots;
        return { ...state, slots: rest };
      }
      if (deletePot) {
        return {
          ...state,
          slots: { ...state.slots, [slotId]: createEmptySlot(slotId, slot.room, slot.type, false) },
        };
      }
      // Hanging default: clear the plant but preserve hasPot so the empty pot stays
      return {
        ...state,
        slots: { ...state.slots, [slotId]: createEmptySlot(slotId, slot.room, slot.type, true) },
      };
    }

    case 'BUY_PAINTING': {
      const { paintingKey, price } = action;
      if (state.player.coins < price) return state;
      if ((state.player.ownedPaintings ?? []).includes(paintingKey)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedPaintings: [...(state.player.ownedPaintings ?? []), paintingKey],
        },
      };
    }

    case 'BUY_PET': {
      const { petKey, price } = action;
      if (state.player.coins < price) return state;
      if ((state.player.ownedPets ?? []).includes(petKey)) return state;
      // Adopt and auto-place in the current room (user can reassign later).
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedPets: [...(state.player.ownedPets ?? []), petKey],
          petPlacements: { ...(state.player.petPlacements ?? {}), [petKey]: state.player.currentRoom },
        },
      };
    }

    // Assign an owned pet to a room (room = number, or null to hide it).
    case 'PLACE_PET': {
      const { petKey, room } = action;
      if (!(state.player.ownedPets ?? []).includes(petKey)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          petPlacements: { ...(state.player.petPlacements ?? {}), [petKey]: room },
        },
      };
    }

    // Put a pet up for adoption: remove it from the collection + refund coins.
    case 'GIVE_UP_PET': {
      const { petKey, refund = 0 } = action;
      if (!(state.player.ownedPets ?? []).includes(petKey)) return state;
      const placements = { ...(state.player.petPlacements ?? {}) };
      delete placements[petKey];
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins + refund,
          ownedPets: state.player.ownedPets.filter((k) => k !== petKey),
          petPlacements: placements,
        },
      };
    }

    case 'PLACE_DECOR': {
      const { room, slot: decorSlot, value } = action;
      const placedDecor = { ...state.player.placedDecor };
      placedDecor[`room${room}`] = { ...(placedDecor[`room${room}`] ?? {}), [decorSlot]: value };
      return { ...state, player: { ...state.player, placedDecor } };
    }

    case 'SET_ROOM': {
      return { ...state, player: { ...state.player, currentRoom: action.room } };
    }

    case 'SET_WALL_COLOR': {
      const { room, color } = action;
      return {
        ...state,
        player: {
          ...state.player,
          wallColor: { ...state.player.wallColor, [`room${room}`]: color },
        },
      };
    }

    case 'UNLOCK_ROOM': {
      const { room } = action;
      const cost = ROOM_UNLOCK_COSTS[room];
      if (state.player.coins < cost) return state;
      if (state.player.unlockedRooms.includes(room)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - cost,
          unlockedRooms: [...state.player.unlockedRooms, room],
        },
      };
    }

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // Migrate old sill/floor storage into the shared inventory (one-time).
          const legacyBags = [...(saved.windowSill ?? []), ...(saved.windowSill2 ?? [])];
          if (legacyBags.length && !saved.inventory) {
            saved.inventory = legacyBags.map((b) => ({
              id: b.id ?? `inv_${Math.random().toString(36).slice(2)}`,
              flowerKey: b.flowerKey,
            }));
          }
          delete saved.windowSill;
          delete saved.windowSill2;
          // Migrate old potted slots: only mark hasPot:true if they have/had a plant
          if (saved.slots) {
            Object.values(saved.slots).forEach((s) => {
              if (s.type === 'potted' && s.hasPot === undefined) {
                s.hasPot = !!(s.flowerKey || s.plantedAt);
              }
              // Empty hanging slots must not claim a pot — the pot is drag-placed.
              // Fixes stale dev saves where hanging slots got hasPot:true with no plant.
              if (s.type === 'hanging' && s.hasPot && !s.flowerKey && !s.plantedAt) {
                s.hasPot = false;
              }
            });
          }
          // TEMP TESTING: force coins on every load so we don't have to clear
          // storage. REMOVE this line when done testing.
          saved.player = { ...saved.player, coins: 50000 };
          dispatch({ type: 'LOAD', payload: { ...initialState, ...saved, initialized: true } });
        } else {
          dispatch({ type: 'LOAD', payload: { ...initialState, initialized: true } });
        }
      } catch {
        dispatch({ type: 'LOAD', payload: { ...initialState, initialized: true } });
      }
    })();
  }, []);

  const saveState = async (s) => {
    try {
      const toSave = { player: s.player, slots: s.slots, inventory: s.inventory, lastPassiveTick: s.lastPassiveTick };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  };

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
      saveState(stateRef.current);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state.initialized) saveState(state);
  }, [state.player, state.slots, state.inventory]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
