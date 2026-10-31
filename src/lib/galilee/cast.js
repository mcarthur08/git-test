// Who is in the boat: your own character, up to three other players who have reached the Sea of Galilee, and the
// fishermen among the twelve who took him across: Peter, Andrew, James and John. Jesus is not shown.
import { STOPS, UNLOCK } from "../data.js";
import { hash } from "../cana/cast.js";

export const GALILEE_DAY = STOPS.find(s => s.scene === "galilee").day;
// the oar (the keepsake of this stop), which the crew pull on
export const OAR = UNLOCK.item.findIndex(e => e[1] === "oar");

export const NPC = {
  peter: {
    name: "Peter",
    look: {
      g: "m",
      skin: 3,
      hair: 1,
      hairColor: 1,
      beard: 4,
      tunic: 5,
      sash: 1,
      mantle: 2,
      cover: 0,
      hem: 1,
      face: 3
    }
  },
  andrew: {
    name: "Andrew",
    look: {
      g: "m",
      skin: 2,
      hair: 3,
      hairColor: 1,
      beard: 3,
      tunic: 0,
      sash: 1,
      mantle: 3,
      cover: 1,
      hem: 1,
      face: 1
    }
  },
  james: {
    name: "James",
    look: {
      g: "m",
      skin: 4,
      hair: 5,
      hairColor: 0,
      beard: 2,
      tunic: 2,
      sash: 0,
      mantle: 1,
      hem: 1,
      face: 4
    }
  },
  john: {
    name: "John",
    look: {
      g: "m",
      skin: 1,
      hair: 2,
      hairColor: 2,
      beard: 0,
      tunic: 1,
      sash: 1,
      mantle: 3,
      hem: 1,
      face: 0
    }
  }
};

export const MAX_REAL = 3;

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const crew = others
    .filter(p => p.s.n >= GALILEE_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const npc = (id, def) => ({
    id,
    kind: id,
    name: def.name,
    look: def.look,
    n: 70,
    real: false,
    speed: 1.25
  });
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : GALILEE_DAY,
          real: true
        }
      : null,
    crew,
    disciples: ["peter", "andrew", "james", "john"].map(id => npc(id, NPC[id]))
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.crew, ...c.disciples];
