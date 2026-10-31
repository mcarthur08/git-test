// Who is at the well: your own character, up to six other players who have reached Samaria as people of Sychar, and the
// woman of Samaria who comes to draw water. Jesus is not shown: he is a light that sits on the edge of the well.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";

export const SAMARIA_DAY = STOPS.find(s => s.scene === "samaria").day;
// the well bucket (the keepsake of this stop), and the water jar the woman carries
export const BUCKET = UNLOCK.item.findIndex(e => e[1] === "bucket");
export const JAR = UNLOCK.item.findIndex(e => e[1] === "jar");

export const NPC = {
  woman: {
    name: "The woman of Samaria",
    look: {
      g: "f",
      skin: 2,
      hair: 2,
      hairColor: 0,
      tunic: 9,
      sash: 2,
      mantle: 2,
      cover: 1,
      face: 2,
      mouth: 1
    }
  }
};

export const MIN_TOWN = 5;
export const MAX_REAL = 6;

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= SAMARIA_DAY && (!me || p.id !== me.id))
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
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : SAMARIA_DAY,
          real: true
        }
      : null,
    town,
    woman: {
      id: "woman",
      kind: "woman",
      name: NPC.woman.name,
      look: NPC.woman.look,
      n: 70,
      real: false,
      speed: 1.1
    }
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town, c.woman];
