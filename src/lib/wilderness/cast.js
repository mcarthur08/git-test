// Who is in the wilderness: your own character and up to six other players who have reached it as travellers crossing the
// desert. Jesus is not shown: he is a light that walks across the sand, and the tempter is only a shadow.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";

export const WILDERNESS_DAY = STOPS.find(s => s.place === "The Wilderness").day;
// the stone (the keepsake of this stop), picked up and carried to the cairn
export const STONE = UNLOCK.item.findIndex(e => e[1] === "stone");

export const MIN_TOWN = 4;
export const MAX_REAL = 6;

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= WILDERNESS_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const town = [...real];
  for (let i = 0; town.length < MIN_TOWN; i++) {
    town.push({
      id: `town-${i}`,
      kind: "guest",
      name: "A traveller",
      look: guestLook(i + 5),
      n: 70,
      real: false
    });
  }
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : WILDERNESS_DAY,
          real: true
        }
      : null,
    town
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town];
