// Who is in the field and at the stable: your own character, up to six other players who have reached Bethlehem as
// fellow shepherds, and the people of the story: three shepherds, Mary and Joseph. The angel and the babe are not shown:
// they are a light over the field and a glow in the manger.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook, NPC as CANA } from "../cana/cast.js";

export const BETHLEHEM_DAY = STOPS.find(s => s.place === "Bethlehem").day;
// the shepherd's staff, which the shepherds carry, and the Bethlehem star (the keepsake of this stop)
export const STAFF = UNLOCK.item.findIndex(e => e[1] === "staff");
export const STAR = UNLOCK.item.findIndex(e => e[1] === "star");

export const NPC = {
  // the oldest: grey hair and beard
  shepherd0: {
    name: "A shepherd",
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
      face: 3,
      item: STAFF
    }
  },
  shepherd1: {
    name: "A shepherd",
    look: {
      g: "m",
      skin: 2,
      hair: 3,
      hairColor: 1,
      beard: 3,
      tunic: 1,
      sash: 1,
      mantle: 2,
      cover: 0,
      hem: 1,
      face: 1,
      item: STAFF
    }
  },
  // the youngest: no beard yet
  shepherd2: {
    name: "A shepherd",
    look: {
      g: "m",
      skin: 4,
      hair: 5,
      hairColor: 0,
      beard: 0,
      tunic: 8,
      sash: 2,
      mantle: 3,
      cover: 0,
      hem: 0,
      face: 4,
      item: STAFF
    }
  },
  mary: { ...CANA.mary, name: "Mary" },
  joseph: {
    name: "Joseph",
    look: {
      g: "m",
      skin: 1,
      hair: 0,
      hairColor: 0,
      beard: 2,
      tunic: 2,
      sash: 1,
      mantle: 1,
      cover: 1,
      hem: 0,
      face: 2
    }
  }
};

export const MIN_TOWN = 4;
export const MAX_REAL = 6;
export const SHEPHERDS = ["shepherd0", "shepherd1", "shepherd2"];

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= BETHLEHEM_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const town = [...real];
  for (let i = 0; town.length < MIN_TOWN; i++) {
    town.push({
      id: `town-${i}`,
      kind: "guest",
      name: "A shepherd",
      look: guestLook(i + 3),
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
    speed: 1.1
  });
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : BETHLEHEM_DAY,
          real: true
        }
      : null,
    town,
    shepherds: SHEPHERDS.map(id => npc(id, "shepherd")),
    mary: npc("mary"),
    joseph: npc("joseph")
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town, ...c.shepherds, c.mary, c.joseph];
