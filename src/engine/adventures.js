import { POTTED_FLOWERS, HANGING_PLANTS, ADVENTURE, RARE_KEYS } from '../constants/gameData';

// A pet can go on an adventure: it leaves its rooms for ADVENTURE.hours and comes back
// with the cardboard box. A pet that is fed when it leaves brings back twice as much.
// Everything is rolled from a seed given by the action, so it is testable.

// [{ type: 'coins', amount } | { type: 'seed', flowerKey } | { type: 'flower', flowerKey, amount }]
export function rollRewards(fed, rand) {
  const rolls = fed ? ADVENTURE.fedRolls : ADVENTURE.rolls;
  const out = [];
  const seeds = [...Object.keys(POTTED_FLOWERS).filter((k) => !POTTED_FLOWERS[k].rare), ...Object.keys(HANGING_PLANTS)];
  const flowers = Object.keys(POTTED_FLOWERS).filter((k) => !POTTED_FLOWERS[k].rare);
  const pick = (list) => list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
  for (let i = 0; i < rolls; i++) {
    const r = rand();
    if (r < ADVENTURE.odds.coins) {
      const [lo, hi] = ADVENTURE.coins;
      out.push({ type: 'coins', amount: lo + Math.floor(rand() * (hi - lo + 1)) });
    } else if (r < ADVENTURE.odds.coins + ADVENTURE.odds.seed) {
      // some seeds are rare ones (a fed pet finds them more often)
      out.push({ type: 'seed', flowerKey: rand() < (fed ? ADVENTURE.fedRareSeed : ADVENTURE.rareSeed) ? pick(RARE_KEYS) : pick(seeds) });
    } else {
      out.push({ type: 'flower', flowerKey: pick(flowers), amount: 1 + (rand() < 0.3 ? 1 : 0) });
    }
  }
  return out;
}

// Pets that are away right now (sent out and not yet collected).
export const isAway = (player, key) => !!player.adventures?.[key];
export const adventureLeftMs = (player, key, now) => Math.max(0, (player.adventures?.[key]?.endsAt ?? 0) - now);
