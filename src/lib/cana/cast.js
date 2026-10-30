// Who is at the wedding: your own character, the other players who have reached Cana, enough made-up guests to fill
// the courtyard, and the people of the story (the bridegroom and bride, the governor of the feast, servants,
// musicians and Mary). Jesus is not shown.
import { UNLOCK, STOPS } from "../data.js";

export const CANA_DAY = STOPS.find(s => s.scene === "cana").day;
const itemIdx = v => UNLOCK.item.findIndex(e => e[1] === v);
export const ITEM = {
  jar: itemIdx("jar"),
  cup: itemIdx("cup"),
  harp: itemIdx("harp"),
  timbrel: itemIdx("timbrel")
};

// The people of the story. Their looks use everything a character can wear, so `n` is the full 70 days.
export const NPC = {
  groom: {
    name: "The bridegroom",
    look: {
      g: "m",
      skin: 1,
      hair: 0,
      hairColor: 1,
      beard: 2,
      tunic: 11,
      sash: 4,
      mantle: 4,
      hat: 3,
      face: 1,
      mouth: 1
    }
  },
  bride: {
    name: "The bride",
    look: {
      g: "f",
      skin: 0,
      hair: 1,
      hairColor: 2,
      tunic: 13,
      sash: 3,
      mantle: 3,
      cover: 1,
      jewel: 2,
      face: 3,
      mouth: 1
    }
  },
  master: {
    name: "The governor of the feast",
    look: {
      g: "m",
      skin: 2,
      hair: 5,
      hairColor: 5,
      beard: 3,
      tunic: 9,
      sash: 2,
      mantle: 1,
      cover: 2,
      face: 2,
      brows: 2,
      mouth: 2
    }
  },
  mary: {
    name: "Mary",
    look: {
      g: "f",
      skin: 1,
      hair: 2,
      hairColor: 1,
      tunic: 10,
      sash: 1,
      mantle: 0,
      cover: 1,
      face: 1,
      mouth: 0
    }
  },
  servants: [
    {
      name: "A servant",
      look: {
        g: "m",
        skin: 3,
        hair: 3,
        hairColor: 0,
        beard: 1,
        tunic: 0,
        sash: 1,
        mantle: 1,
        hem: 1,
        face: 0
      }
    },
    {
      name: "A servant",
      look: {
        g: "m",
        skin: 4,
        hair: 5,
        hairColor: 1,
        beard: 2,
        tunic: 7,
        sash: 1,
        mantle: 3,
        hem: 1,
        face: 2
      }
    },
    {
      name: "A servant",
      look: {
        g: "f",
        skin: 2,
        hair: 2,
        hairColor: 0,
        tunic: 6,
        sash: 1,
        mantle: 3,
        cover: 3,
        hem: 1,
        face: 3
      }
    }
  ],
  musicians: [
    {
      name: "A musician",
      look: {
        g: "m",
        skin: 2,
        hair: 3,
        hairColor: 2,
        beard: 4,
        tunic: 10,
        sash: 3,
        mantle: 0,
        item: ITEM.harp,
        face: 4
      }
    },
    {
      name: "A musician",
      look: {
        g: "f",
        skin: 3,
        hair: 4,
        hairColor: 0,
        tunic: 4,
        sash: 2,
        mantle: 4,
        cover: 2,
        jewel: 2,
        item: ITEM.timbrel,
        face: 1
      }
    }
  ]
};

// A small stable number from a name, so the same player always sits and strolls the same way.
export const hash = str => {
  let h = 2166136261;
  for (const c of String(str)) {
    h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  }
  return h >>> 0;
};

// A made-up guest, different from the next, used when few real players have reached Cana yet.
export function guestLook(i) {
  const f = i % 2 === 1;
  return {
    g: f ? "f" : "m",
    skin: (i * 2 + 1) % 6,
    hair: f ? [1, 4, 2, 3][i % 4] : [0, 3, 5, 0][i % 4],
    hairColor: i % 4,
    beard: f ? 0 : [2, 3, 1, 4][i % 4],
    tunic: f ? [3, 4, 5, 7, 9][i % 5] : [0, 1, 2, 8, 10][i % 5],
    sash: i % 3,
    mantle: i % 4,
    cover: f ? 1 + (i % 3) : i % 3 === 2 ? 1 : 0,
    jewel: f ? 1 + (i % 3) : 0,
    face: i % 5,
    eyes: i % 5,
    mouth: i % 6
  };
}

const MAX_REAL_GUESTS = 9;
const MIN_GUESTS = 6;

// everyone in the scene, in the order they are brought in. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= CANA_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL_GUESTS)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const guests = [...real];
  for (let i = 0; guests.length < MIN_GUESTS; i++) {
    guests.push({
      id: `guest-${i}`,
      kind: "guest",
      name: "A guest",
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
    ...extra
  });
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : CANA_DAY,
          real: true
        }
      : null,
    guests,
    party: [
      npc("groom", "groom", NPC.groom),
      npc("bride", "bride", NPC.bride),
      npc("master", "master", NPC.master),
      npc("mary", "mary", NPC.mary)
    ],
    servants: NPC.servants.map((d, i) => npc(`servant-${i}`, "servant", d)),
    musicians: NPC.musicians.map((d, i) => npc(`musician-${i}`, "musician", d))
  };
}

export const everyone = c => [
  ...(c.me ? [c.me] : []),
  ...c.guests,
  ...c.party,
  ...c.servants,
  ...c.musicians
];
