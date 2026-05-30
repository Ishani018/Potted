import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
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

const STORAGE_KEY = '@potted_save_v3';
const TICK_INTERVAL_MS = 60_000;

// cart item: { id, flowerKey }
// slot: { slotId, room, type, flowerKey, stage, plantedAt, lastWatered, isDead, _budWatered }

const initialState = {
  player: INITIAL_PLAYER_STATE,
  slots: {},
  cart: [],            // seed items loaded in nursery
  windowSill: [],      // { id, flowerKey } seeds stored on room 1 ledge
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
        for (const type of ['potted', 'hanging']) {
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
          screenX: action.screenX ?? null,
          screenY: action.screenY ?? null,
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
      const { cartItemId, flowerKey } = action;
      if (state.windowSill.length >= 4) return state;
      const id = `sill_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return {
        ...state,
        cart: state.cart.filter((i) => i.id !== cartItemId),
        windowSill: [...state.windowSill, { id, flowerKey }],
      };
    }

    case 'REMOVE_FROM_SILL': {
      return { ...state, windowSill: state.windowSill.filter((i) => i.id !== action.id) };
    }

    case 'PLANT_FROM_SILL': {
      const { slotId, sillItemId, flowerKey } = action;
      const slot = state.slots[slotId];
      if (!slot || slot.flowerKey) return state;
      return {
        ...state,
        slots: { ...state.slots, [slotId]: plantSeed(slot, flowerKey) },
        windowSill: state.windowSill.filter((i) => i.id !== sillItemId),
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
        slots: { ...state.slots, [slotId]: clearedSlot },
        player: {
          ...state.player,
          coins: state.player.coins + coins,
          harvestCount: (state.player.harvestCount ?? 0) + (coins > 0 ? 1 : 0),
        },
      };
    }

    case 'REMOVE_PLANT': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot) return state;
      return {
        ...state,
        slots: { ...state.slots, [slotId]: createEmptySlot(slotId, slot.room, slot.type) },
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
      const toSave = { player: s.player, slots: s.slots, windowSill: s.windowSill, lastPassiveTick: s.lastPassiveTick };
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
  }, [state.player, state.slots]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
