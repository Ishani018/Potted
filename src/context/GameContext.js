import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_PLAYER_STATE,
  ACHIEVEMENTS,
  ROOM_UNLOCK_COSTS,
} from '../constants/gameData';
import {
  tickAllSlots,
  harvestPlant,
  waterPlant,
  plantSeed,
  createEmptySlot,
  calcHangingPassiveCoins,
  checkAllSlotsFilled,
  isNearDeath,
} from '../engine/gameEngine';
import { getSnapPoints } from '../engine/snapPoints';

const STORAGE_KEY = '@potted_save';
const TICK_INTERVAL_MS = 60_000;

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState = {
  player: INITIAL_PLAYER_STATE,
  slots: {},        // keyed by slotId
  initialized: false,
  lastPassiveTick: Date.now(),
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD': {
      return { ...state, ...action.payload, initialized: true };
    }

    case 'TICK': {
      const now = action.now;
      const updatedSlots = tickAllSlots(state.slots, now);

      // Passive hanging coins
      const passiveCoins = calcHangingPassiveCoins(state.slots, state.lastPassiveTick, now);

      // Check near-death achievement
      let savedFromDeath = state.player._savedFromDeath;
      for (const slot of Object.values(updatedSlots)) {
        const prev = state.slots[slot.slotId];
        if (prev && isNearDeath(prev, now) && !slot.isDead && slot.lastWatered > prev.lastWatered) {
          savedFromDeath = true;
        }
      }

      return {
        ...state,
        slots: updatedSlots,
        lastPassiveTick: now,
        player: {
          ...state.player,
          coins: state.player.coins + passiveCoins,
          _savedFromDeath: savedFromDeath,
        },
      };
    }

    case 'INIT_SLOTS': {
      // Called on first load with screen dimensions to build empty slots
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

    case 'PLANT_SEED': {
      const { slotId, flowerKey } = action;
      const slot = state.slots[slotId];
      if (!slot || slot.flowerKey) return state;

      const inv = { ...state.player.inventory };
      if (!inv[flowerKey] || inv[flowerKey] <= 0) return state;
      inv[flowerKey] = inv[flowerKey] - 1;
      if (inv[flowerKey] === 0) delete inv[flowerKey];

      return {
        ...state,
        slots: { ...state.slots, [slotId]: plantSeed(slot, flowerKey) },
        player: { ...state.player, inventory: inv },
      };
    }

    case 'WATER_PLANT': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot || !slot.flowerKey) return state;
      return {
        ...state,
        slots: { ...state.slots, [slotId]: waterPlant(slot) },
      };
    }

    case 'HARVEST_PLANT': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot) return state;
      const { coins, slot: clearedSlot } = harvestPlant(slot);
      const harvestCount = (state.player.harvestCount ?? 0) + (coins > 0 ? 1 : 0);
      const allFilled = checkAllSlotsFilled(state.slots, slot.room, slot.type);
      return {
        ...state,
        slots: { ...state.slots, [slotId]: clearedSlot },
        player: {
          ...state.player,
          coins: state.player.coins + coins,
          harvestCount,
          _allSlotsFilledOnce: state.player._allSlotsFilledOnce || allFilled,
        },
      };
    }

    case 'REMOVE_PLANT': {
      const { slotId } = action;
      const slot = state.slots[slotId];
      if (!slot) return state;
      return {
        ...state,
        slots: {
          ...state.slots,
          [slotId]: createEmptySlot(slotId, slot.room, slot.type),
        },
      };
    }

    case 'BUY_SEED': {
      const { flowerKey, price } = action;
      if (state.player.coins < price) return state;
      const inv = { ...state.player.inventory };
      inv[flowerKey] = (inv[flowerKey] ?? 0) + 1;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          inventory: inv,
        },
      };
    }

    case 'BUY_PAINTING': {
      const { paintingKey, price } = action;
      if (state.player.coins < price) return state;
      if (state.player.ownedPaintings.includes(paintingKey)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedPaintings: [...state.player.ownedPaintings, paintingKey],
        },
      };
    }

    case 'BUY_PET': {
      const { petKey, price } = action;
      if (state.player.coins < price) return state;
      if (state.player.ownedPets.includes(petKey)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          coins: state.player.coins - price,
          ownedPets: [...state.player.ownedPets, petKey],
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

    case 'GRANT_ACHIEVEMENT': {
      const { id } = action;
      if (state.player.achievements.includes(id)) return state;
      return {
        ...state,
        player: {
          ...state.player,
          achievements: [...state.player.achievements, id],
        },
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load from storage
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

  // Save to storage whenever state changes (debounced via tick)
  const saveState = async (s) => {
    try {
      const toSave = { player: s.player, slots: s.slots, lastPassiveTick: s.lastPassiveTick };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  };

  // Growth tick every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      dispatch({ type: 'TICK', now });
      // check achievements
      const s = stateRef.current;
      for (const ach of ACHIEVEMENTS) {
        if (!s.player.achievements.includes(ach.id) && ach.check(s.player)) {
          dispatch({ type: 'GRANT_ACHIEVEMENT', id: ach.id });
        }
      }
      saveState(stateRef.current);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Also save on player/slots state change
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
