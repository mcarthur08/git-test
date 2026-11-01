// Who is on the hillside: your own character, the other players who have reached Bethsaida, enough made-up people to
// make a crowd, and the people of the story: Andrew and Philip, two more of the twelve, and the lad with the five barley
// loaves and two small fishes (John 6:8–9). Jesus is not shown.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";

export const BETHSAIDA_DAY = STOPS.find(s => s.scene === "bethsaida").day;
// the basket of loaves (the keepsake of this stop), which the disciples carry round
export const LOAVES = UNLOCK.item.findIndex(e => e[1] === "loaves");

export const NPC = {
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
  philip: {
    name: "Philip",
    look: {
      g: "m",
      skin: 3,
      hair: 0,
      hairColor: 0,
      beard: 2,
      tunic: 7,
      sash: 1,
      mantle: 1,
      hem: 1,
      face: 2
    }
  },
  disciples: [
    {
      name: "A disciple",
      look: {
        g: "m",
        skin: 1,
        hair: 5,
        hairColor: 2,
        beard: 1,
        tunic: 1,
        sash: 0,
        mantle: 3,
        hem: 1,
        face: 0
      }
    },
    {
      name: "A disciple",
      look: {
        g: "m",
        skin: 4,
        hair: 3,
        hairColor: 0,
        beard: 4,
        tunic: 2,
        sash: 1,
        mantle: 1,
        hem: 1,
        face: 4
      }
    }
  ],
  // a boy: smaller than the grown-ups, with no beard
  lad: {
    name: "A lad",
    look: {
      g: "m",
      skin: 2,
      hair: 3,
      hairColor: 2,
      beard: 0,
      tunic: 0,
      sash: 1,
      mantle: 3,
      hem: 1,
      face: 0,
      mouth: 0
    }
  }
};

export const MIN_CROWD = 12;
export const MAX_REAL = 12;

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= BETHSAIDA_DAY && (!me || p.id !== me.id))
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
  const npc = (id, kind, def, extra = {}) => ({
    id,
    kind,
    name: def.name,
    look: def.look,
    n: 70,
    real: false,
    speed: 1.25,
    ...extra
  });
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : BETHSAIDA_DAY,
          real: true
        }
      : null,
    crowd,
    disciples: [
      npc("andrew", "andrew", NPC.andrew),
      npc("philip", "philip", NPC.philip),
      ...NPC.disciples.map((d, i) => npc(`disciple-${i}`, "disciple", d))
    ],
    lad: npc("lad", "lad", NPC.lad, { speed: 1, scale: 0.78 })
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.crowd, ...c.disciples, c.lad];
