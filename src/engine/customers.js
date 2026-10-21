import {
  CUSTOMERS, CUSTOMERS_PER_DAY, POTTED_FLOWERS, HANGING_PLANTS, TRADE_FLOWERS,
  SEED_UNLOCK_LEVEL, seedType, seedUnlockLevel,
} from '../constants/gameData';

// Daily florist orders. Rolled once per day (see TICK) and stored on the player
// so progress survives restarts. Each order:
//   { id, customer, type: 'flowers' | 'bouquet', flowerKey, qty, coins, tip, xp, seed, done }
// 'flowers': hand over qty of a harvested flower for `coins`.
// 'bouquet': tie a bouquet containing flowerKey at the bouquet table; the
//            customer pays the bouquet's price plus a `tip`.

// Tiny string → seed hash so a given day always rolls the same orders.
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function flowerName(key) {
  return POTTED_FLOWERS[key]?.name ?? HANGING_PLANTS[key]?.name ?? key;
}

export function customerLine(order, which = 'ask') {
  const c = CUSTOMERS[order.customer];
  if (which === 'thanks') return c.thanks;
  const qty = order.qty;
  const name = flowerName(order.flowerKey);
  const plural = qty > 1 ? `${name}s` : name;
  const template = order.type === 'flowers' ? c.askFlowers : c.askBouquet;
  return template
    .replace('{qty}', String(qty))
    .replace('{flower}', order.type === 'flowers' ? plural : `${name}`);
}

// rand: () => [0,1). level: the player's level (keeps orders fulfillable).
export function rollCustomerOrders(day, level, rand) {
  // Shuffle the roster, take the first few.
  const keys = Object.keys(CUSTOMERS);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  return keys.slice(0, CUSTOMERS_PER_DAY).map((customer, i) => {
    const c = CUSTOMERS[customer];
    // Only ask for flowers the player can already get (or is one level away).
    const reachable = c.likes.filter((k) => seedUnlockLevel(k) <= level + 1);
    const flowerKey = pick(reachable.length ? reachable : ['daisy']);
    const base = TRADE_FLOWERS[flowerKey]?.base ?? 10;
    const type = rand() < 0.6 ? 'flowers' : 'bouquet';
    // Hanging plants only give 1 flower per harvest, so ask for fewer.
    const maxQty = seedType(flowerKey) === 'hanging' ? 2 : 3;
    const qty = type === 'flowers' ? 1 + Math.floor(rand() * maxQty) : 1;

    // Sometimes a customer thanks you with a seed from a level or two ahead.
    const ahead = Object.keys(SEED_UNLOCK_LEVEL).filter((k) => {
      const lv = seedUnlockLevel(k);
      return lv > level && lv <= level + 2;
    });
    const seed = ahead.length && rand() < 0.3 ? pick(ahead) : null;

    return {
      id: `${day}_${i}`,
      customer,
      type,
      flowerKey,
      qty,
      coins: type === 'flowers' ? Math.round(base * qty * 1.5) : 0,
      tip: type === 'bouquet' ? Math.round(10 + base * 1.2) : 0,
      xp: type === 'flowers' ? Math.round((base * qty) / 2) : 15,
      seed,
      done: false,
    };
  });
}

// Orders still waiting, oldest first.
export function openOrders(player) {
  return (player.customers?.list ?? []).filter((o) => !o.done);
}

// Does a tied bouquet (array of flower keys) satisfy this order?
export function bouquetFillsOrder(order, flowers) {
  return order.type === 'bouquet' && !order.done && flowers.includes(order.flowerKey);
}

export { flowerName };
