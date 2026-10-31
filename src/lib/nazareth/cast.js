// Who is in Nazareth: your own character, up to six other players who have reached Nazareth as people of the town, and the
// people of the story: Joseph the carpenter, Mary, and two teachers who sit in the temple court. Jesus is not shown: he is a
// light that stands at the workshop, goes up to Jerusalem, and sits among the teachers.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook, NPC as CANA } from "../cana/cast.js";

export const NAZARETH_DAY = STOPS.find(s => s.place === "Nazareth").day;
// the carpenter's square and hammer, the traveller's staff, and the teachers' scroll
const itemOf = key => UNLOCK.item.findIndex(e => e[1] === key);
export const SQUARE = itemOf("square");
export const HAMMER = itemOf("hammer");
export const STAFF = itemOf("staff");
export const SCROLL = itemOf("scroll");

export const NPC = {
  // the carpenter, with his square in his hand
  joseph: {
    name: "Joseph",
    look: {
      g: "m",
      skin: 2,
      hair: 0,
      hairColor: 1,
      beard: 3,
      tunic: 8,
      sash: 1,
      mantle: 0,
      cover: 0,
      hem: 1,
      face: 1,
      item: SQUARE
    }
  },
  mary: CANA.mary,
  // two teachers of the law: older, with grey hair and beards
  teacher0: {
    name: "A teacher",
    look: {
      g: "m",
      skin: 3,
      hair: 0,
      hairColor: 5,
      beard: 4,
      tunic: 4,
      sash: 0,
      mantle: 1,
      cover: 1,
      hem: 1,
      face: 3
    }
  },
  teacher1: {
    name: "A teacher",
    look: {
      g: "m",
      skin: 1,
      hair: 3,
      hairColor: 5,
      beard: 2,
      tunic: 2,
      sash: 2,
      mantle: 1,
      cover: 2,
      hem: 0,
      face: 2
    }
  }
};

export const MIN_TOWN = 5;
export const MAX_REAL = 6;
export const TEACHERS = ["teacher0", "teacher1"];

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= NAZARETH_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const town = [...real];
  for (let i = 0; town.length < MIN_TOWN; i++) {
    town.push({
      id: `town-${i}`,
      kind: "guest",
      name: "A neighbour",
      look: guestLook(i + 5),
      n: 70,
      real: false
    });
  }
  const npc = (id, kind = id) => ({
    id,
    kind,
    name: NPC[id].name,
    look: NPC[id].look,
    n: 70,
    real: false,
    speed: 1.2
  });
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : NAZARETH_DAY,
          real: true
        }
      : null,
    town,
    joseph: npc("joseph"),
    mary: npc("mary"),
    teachers: TEACHERS.map(id => npc(id, "teacher"))
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town, c.joseph, c.mary, ...c.teachers];
