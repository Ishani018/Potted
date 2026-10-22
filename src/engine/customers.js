import { picturesFor } from './bouquetPics';
import {
  CUSTOMERS, CUSTOMERS_PER_DAY, POTTED_FLOWERS, HANGING_PLANTS, TRADE_FLOWERS,
  BOUQUET_FLOWERS, SEED_UNLOCK_LEVEL, seedType, seedUnlockLevel, BOUQUET_PAPERS, RIBBON_KEYS, RIBBON_NAMES,
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

// "2 Roses and Marigold" for a bouquet order with a fixed set of flowers
export function comboText(order) {
  if (!order.combo) return null;
  const n = {};
  order.combo.forEach((k) => { n[k] = (n[k] || 0) + 1; });
  const plural = (w) => (/[^aeiou]y$/i.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);
  const parts = Object.keys(n).map((k) => (n[k] > 1 ? `${n[k]} ${plural(flowerName(k))}` : flowerName(k)));
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
}

export function customerLine(order, which = 'ask') {
  const c = CUSTOMERS[order.customer];
  if (which === 'thanks') return c.thanks;
  const qty = order.qty;
  const name = flowerName(order.flowerKey);
  const plural = qty > 1 ? (/[^aeiou]y$/i.test(name) ? `${name.slice(0, -1)}ies` : `${name}s`) : name;
  const template = order.type === 'flowers' ? c.askFlowers : c.askBouquet;
  const line = template
    .replace('{qty}', String(qty))
    .replace('{flower}', order.type === 'flowers' ? plural : comboText(order) ?? name);
  // a bouquet order also names the paper and the ribbon
  if (which !== 'short' && order.type === 'bouquet' && order.paper && order.ribbon) {
    return `${line} In ${BOUQUET_PAPERS[order.paper]?.name ?? 'kraft'} paper with a ${RIBBON_NAMES[order.ribbon] ?? 'red'} ribbon, please.`;
  }
  return line;
}

// rand: () => [0,1). level: the player's level (keeps orders fulfillable).
export function rollCustomerOrders(day, level, rand) {
  // Customers who like something the player can already get (or is one level
  // from) come first, so people ask for what they'd really want. Shuffle each
  // group, then take the first few.
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const all = Object.keys(CUSTOMERS);
  const canAsk = (k) => CUSTOMERS[k].likes.some((f) => seedUnlockLevel(f) <= level + 1);
  const keys = [...shuffle(all.filter(canAsk)), ...shuffle(all.filter((k) => !canAsk(k)))];
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  return keys.slice(0, CUSTOMERS_PER_DAY).map((customer, i) => {
    const c = CUSTOMERS[customer];
    // Only ask for flowers the player can already get (or is one level away).
    const reach = (k) => seedUnlockLevel(k) <= level + 1;
    const papers = Object.values(BOUQUET_PAPERS).filter((p) => p.level <= level);
    const paperPool = papers.length ? papers : [BOUQUET_PAPERS.plain];
    let type = rand() < 0.6 ? 'flowers' : 'bouquet';
    // a bouquet order only asks for what there is a bouquet picture of, on the paper it names
    let paper = null; let flowerKey; let combo = null; let pic = null;
    if (type === 'bouquet') {
      const tryPapers = shuffle(paperPool.map((p) => p.id));
      for (const id of tryPapers) {
        // bouquets whose flowers can all be had by now
        const ok = picturesFor(id).filter((p) => p.flowers.every((k) => BOUQUET_FLOWERS.includes(k) && reach(k)));
        const liked = ok.filter((p) => p.flowers.some((k) => c.likes.includes(k)));
        const pool = liked.length ? liked : ok;
        if (pool.length) {
          const chosen = pick(pool);
          paper = id; pic = chosen.id; combo = [...chosen.flowers];
          // the flower the order is "about": the one used most
          flowerKey = [...combo].sort((x, y) => combo.filter((k) => k === y).length - combo.filter((k) => k === x).length)[0];
          break;
        }
      }
      if (!paper) type = 'flowers';
    }
    if (type === 'flowers') {
      const reachable = c.likes.filter(reach);
      flowerKey = pick(reachable.length ? reachable : ['daisy']);
    }
    const base = TRADE_FLOWERS[flowerKey]?.base ?? 10;
    // Hanging plants only give 1 flower per harvest, so ask for fewer.
    const maxQty = seedType(flowerKey) === 'hanging' ? 2 : 3;
    const qty = type === 'flowers' ? 1 + Math.floor(rand() * maxQty) : 1;

    // Sometimes a customer thanks you with a seed from a level or two ahead.
    const ahead = Object.keys(SEED_UNLOCK_LEVEL).filter((k) => {
      const lv = seedUnlockLevel(k);
      return lv > level && lv <= level + 2;
    });
    const seed = ahead.length && rand() < 0.3 ? pick(ahead) : null;
    // bouquets are placed like a shop order: the paper (one you have unlocked) and a ribbon
    const ribbon = type === 'bouquet' ? pick(RIBBON_KEYS) : null;

    return {
      id: `${day}_${i}`,
      customer,
      type,
      flowerKey,
      qty,
      paper,
      combo,
      pic,
      ribbon,
      coins: type === 'flowers' ? Math.round(base * qty * 1.5) : 0,
      tip: type === 'bouquet' ? Math.round(10 + base * 1.2) : 0,
      xp: type === 'flowers' ? Math.round((base * qty) / 2) : 15,
      seed,
      done: false,
    };
  });
}

// Orders still waiting, oldest first. Orders from a customer that no longer
// exists (an older roster saved in the player's data) are ignored.
export function openOrders(player) {
  return (player.customers?.list ?? []).filter((o) => !o.done && CUSTOMERS[o.customer]);
}

// True if saved orders are for today but name customers we don't have any more.
export function hasStaleOrders(customers) {
  return !!customers?.list?.some((o) => !CUSTOMERS[o.customer]);
}

// Does a tied bouquet (array of flower keys) satisfy this order?
export function bouquetFillsOrder(order, flowers) {
  if (order.type === 'bouquet' && !order.done && order.combo) {
    return flowers.length === order.combo.length && [...flowers].sort().join() === [...order.combo].sort().join();
  }
  return order.type === 'bouquet' && !order.done && (flowers.includes(order.flowerKey) || !BOUQUET_FLOWERS.includes(order.flowerKey));   // an old order for a flower that no longer goes in bouquets takes any bouquet
}

export { flowerName };
