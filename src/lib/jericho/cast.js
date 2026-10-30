// Who is in the street: your own character, the other players who have reached Jericho, enough made-up people to make a
// crowd, Zacchaeus (small, with a rich robe and a purse), and four of the poor of the town. Jesus is not shown: he is a
// light that passes along the road.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";

export const JERICHO_DAY = STOPS.find(s => s.scene === "jericho").day;
// the coin purse, which Zacchaeus carries to give to the poor
export const PURSE = UNLOCK.item.findIndex(e => e[1] === "purse");

export const NPC = {
  // "little of stature" (Luke 19:3): smaller than the grown-ups, with a beard and a rich robe
  zacchaeus: {
    name: "Zacchaeus",
    look: {
      g: "m",
      skin: 2,
      hair: 2,
      hairColor: 2,
      beard: 3,
      tunic: 3,
      sash: 1,
      mantle: 2,
      cover: 1,
      hem: 1,
      face: 2
    }
  }
};

export const MIN_CROWD = 14;
export const MAX_REAL = 10;
export const POOR_COUNT = 4;

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= JERICHO_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const crowd = [...real];
  for (let i = 0; crowd.length < MIN_CROWD; i++) {
    crowd.push({
      id: `crowd-${i}`,
      kind: "guest",
      name: "A visitor",
      look: guestLook(i + 1),
      n: 70,
      real: false
    });
  }
  const poor = Array.from({ length: POOR_COUNT }, (_, i) => ({
    id: `poor-${i}`,
    kind: "poor",
    name: "A poor man",
    look: { ...guestLook(40 + i), cover: 1 },
    n: 70,
    real: false
  }));
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : JERICHO_DAY,
          real: true
        }
      : null,
    crowd,
    poor,
    zacchaeus: {
      id: "zacchaeus",
      kind: "zacchaeus",
      name: NPC.zacchaeus.name,
      look: NPC.zacchaeus.look,
      n: 70,
      real: false,
      speed: 1.4,
      scale: 0.8
    }
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.crowd, ...c.poor, c.zacchaeus];
