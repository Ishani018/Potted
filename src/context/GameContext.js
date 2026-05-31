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

// cart item: { id, flowerKey }
// slot: { slotId, room, type, flowerKey, stage, plantedAt, lastWatered, isDead, _budWatered }

const initialState = {
  player: INITIAL_PLAYER_STATE,
  slots: {},
  cart: [],            // seed items loaded in nursery
  windowSill: [],      // { id, flowerKey, sillSlotId } seeds stored on room 1 ledge
  windowSill2: [],     // { id, flowerKey, sillSlotId } seeds stored on room 2 floor
  cartInRoom: false,
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

    // Add a seed to cart (free, unlimited in nursery).
    // screenX/screenY = exact pixel position where user dropped it — stored as-is.
    case 'ADD_TO_CART': {
      if (state.cart.length >= 8) return state;
      const id = `cart_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return {
        ...state,
        cart: [...state.cart, {
          id,
          flowerKey: action.flowerKey,
          gridSlot: action.gridSlot ?? state.cart.length,
        }],
      };
    }

    case 'REMOVE_FROM_CART': {
      return { ...state, cart: state.cart.filter((i) => i.id !== action.id) };
    }

    case 'CLEAR_CART': {
      return { ...state, cart: [] };
    }

    case 'STORE_ON_SILL': {
      // sillSlotId prefix determines which sill: 'sill_*' = room 1, 'r2_sill_*' = room 2
      const { cartItemId, flowerKey, sillSlotId } = action;
      const isRoom2 = sillSlotId?.startsWith('r2_sill_');
      const sillKey = isRoom2 ? 'windowSill2' : 'windowSill';
      if (state[sillKey].some((i) => i.sillSlotId === sillSlotId)) return state;
      const id = `sillitem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return {
        ...state,
        cart: state.cart.filter((i) => i.id !== cartItemId),
        [sillKey]: [...state[sillKey], { id, flowerKey, sillSlotId }],
      };
    }

    case 'REMOVE_FROM_SILL': {
      const isRoom2 = state.windowSill2.some((i) => i.id === action.id);
      const sillKey = isRoom2 ? 'windowSill2' : 'windowSill';
      return { ...state, [sillKey]: state[sillKey].filter((i) => i.id !== action.id) };
    }

    case 'PLANT_FROM_SILL': {
      const { slotId, sillItemId, flowerKey } = action;
      const slot = state.slots[slotId];
      if (!slot || slot.flowerKey) return state;
      const isRoom2 = state.windowSill2.some((i) => i.id === sillItemId);
      const sillKey = isRoom2 ? 'windowSill2' : 'windowSill';
      return {
        ...state,
        slots: { ...state.slots, [slotId]: plantSeed(slot, flowerKey) },
        [sillKey]: state[sillKey].filter((i) => i.id !== sillItemId),
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

    case 'SET_CART_IN_ROOM': {
      return { ...state, cartInRoom: action.value };
    }

    // Drag seed from cart onto an empty snap point → plant directly
    case 'PLANT_FROM_CART': {
      const { slotId, cartItemId, flowerKey } = action;
      const slot = state.slots[slotId];
      if (!slot || slot.flowerKey) return state;
      return {
        ...state,
        slots: { ...state.slots, [slotId]: plantSeed(slot, flowerKey) },
        cart: state.cart.filter((i) => i.id !== cartItemId),
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
      const { coins, slot: clearedSlot } = harvestPlant(slot);
      return {
        ...state,
        slots: { ...state.slots, [slotId]: { ...clearedSlot, hasPot: slot.hasPot } },
        player: {
          ...state.player,
          coins: state.player.coins + coins,
          harvestCount: (state.player.harvestCount ?? 0) + (coins > 0 ? 1 : 0),
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
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedPets: [...(state.player.ownedPets ?? []), petKey],
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
          // Strip stale sill items that have no sillSlotId (from old save format)
          if (saved.windowSill) {
            saved.windowSill = saved.windowSill.filter((i) => i.sillSlotId && !i.sillSlotId.startsWith('r2_sill_'));
          }
          if (saved.windowSill2) {
            saved.windowSill2 = saved.windowSill2.filter((i) => i.sillSlotId?.startsWith('r2_sill_'));
          }
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
      const toSave = { player: s.player, slots: s.slots, windowSill: s.windowSill, windowSill2: s.windowSill2, lastPassiveTick: s.lastPassiveTick };
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
  }, [state.player, state.slots, state.windowSill, state.windowSill2]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
