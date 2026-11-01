// Who is at the river: your own character, up to six other players who have reached the Jordan as people who have come out
// to be baptized, and John, who baptizes them. Jesus is not shown: he is a light that comes down to the water.
import { STOPS } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";

export const JORDAN_DAY = STOPS.find(s => s.place === "River Jordan").day;

export const NPC = {
  // John in his coat of camel's hair, with a leather girdle, long hair and a long beard
  baptist: {
    name: "John",
    look: {
      g: "m",
      skin: 4,
      hair: 1,
      hairColor: 3,
      beard: 4,
      tunic: 1,
      sash: 0,
      mantle: 1,
      cover: 0,
      hem: 0,
      face: 2
    }
  }
};

export const MIN_TOWN = 5;
export const MAX_REAL = 6;

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= JORDAN_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const town = [...real];
  for (let i = 0; town.length < MIN_TOWN; i++) {
    town.push({
      id: `town-${i}`,
      kind: "guest",
      name: "A pilgrim",
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
          n: me.s ? me.s.n : JORDAN_DAY,
          real: true
        }
      : null,
    town,
    baptist: {
      id: "baptist",
      kind: "baptist",
      name: NPC.baptist.name,
      look: NPC.baptist.look,
      n: 70,
      real: false,
      speed: 1.2
    }
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town, c.baptist];
