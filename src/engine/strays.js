import { STRAY_KEYS, STRAYS, STRAY_MS, strayMax, openFosterSeats, CUSTOMERS } from '../constants/gameData';

// Customers bring strays to the foster corner. Called on every TICK: if there's a
// free seat in an open foster room, an unmet animal left, and STRAY_MS has passed since the last one (the
// very first arrives straight away), one turns up. Returns { player, notice } or
// null. `rand` returns 0..1.
export function maybeArriveStray(player, now, rand) {
  const present = player.strays ?? [];
  if (present.length >= strayMax(player)) return null;
  if (player.lastStrayAt != null && now - player.lastStrayAt < STRAY_MS) return null;

  const taken = new Set([...present.map((s) => s.key), ...(player.ownedPets ?? [])]);
  const keys = STRAY_KEYS.filter((k) => !taken.has(k));
  const seats = openFosterSeats(player).filter((seat) => !present.some((s) => s.seat === seat.id));
  if (keys.length === 0 || seats.length === 0) return null;

  const pick = (list) => list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
  const key = pick(keys);
  // someone you already know is likelier to be the finder
  const met = Object.keys(player.customerBook ?? {}).filter((c) => CUSTOMERS[c]);
  const finder = pick(met.length ? met : Object.keys(CUSTOMERS));
  const seat = pick(seats).id;
  const stray = { key, finder, seat, at: now };
  return {
    player: { ...player, strays: [...present, stray], lastStrayAt: now },
    notice: `${CUSTOMERS[finder].name} brought a stray to the foster corner: ${STRAYS[key].breed}!`,
  };
}
