// Who is at Bethany: your own character, up to six other players who have reached Bethany as friends of the family, and
// the people of the story: Mary, Martha and their brother Lazarus. Jesus is not shown: he is a light that walks from the
// road to the grave and then to the table.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";

export const BETHANY_DAY = STOPS.find(s => s.place === "Bethany").day;
// the alabaster jar of ointment (the keepsake of this stop)
export const ALABASTER = UNLOCK.item.findIndex(e => e[1] === "alabaster");

export const NPC = {
  mary: {
    name: "Mary",
    look: {
      g: "f",
      skin: 2,
      hair: 2,
      hairColor: 1,
      beard: 0,
      tunic: 3,
      sash: 2,
      mantle: 4,
      cover: 2,
      hem: 2,
      face: 2
    }
  },
  martha: {
    name: "Martha",
    look: {
      g: "f",
      skin: 3,
      hair: 1,
      hairColor: 2,
      beard: 0,
      tunic: 1,
      sash: 0,
      mantle: 1,
      cover: 1,
      hem: 1,
      face: 3
    }
  },
  lazarus: {
    name: "Lazarus",
    look: {
      g: "m",
      skin: 1,
      hair: 2,
      hairColor: 2,
      beard: 2,
      tunic: 0,
      sash: 1,
      mantle: 0,
      cover: 0,
      hem: 0,
      face: 1
    }
  }
};

export const MIN_TOWN = 5;
export const MAX_REAL = 6;
export const FAMILY = ["mary", "martha", "lazarus"];

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= BETHANY_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const town = [...real];
  for (let i = 0; town.length < MIN_TOWN; i++) {
    town.push({
      id: `town-${i}`,
      kind: "guest",
      name: "A neighbour",
      look: guestLook(i + 4),
      n: 70,
      real: false
    });
  }
  const npc = id => ({
    id,
    kind: id,
    name: NPC[id].name,
    look: NPC[id].look,
    n: 70,
    real: false,
    speed: 1.1
  });
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : BETHANY_DAY,
          real: true
        }
      : null,
    town,
    family: FAMILY.map(npc)
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town, ...c.family];
