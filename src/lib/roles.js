// Role presets: a ready-made outfit and item for a Bible role. A preset only dresses the character, so the face,
// hair, skin and name are left alone. Each field lists indexes in order of preference: the first one the reader has
// unlocked is worn, so a preset still works on day 0 and gets closer to the real thing as they read.
import { UNLOCK, allowedFor } from "./data.js";

const GATED = ["tunic", "sash", "hat", "item"];
const FIELDS = [...GATED, "mantle", "cover", "jewel"];

export const ROLES = [
  {
    id: "shepherd",
    name: "Shepherd",
    blurb: "David's first job: a staff, plain wool and a headcloth.",
    m: { tunic: [1], sash: [0], hat: [1], item: [1, 3, 0], mantle: [3], cover: [1] },
    f: { tunic: [7], sash: [1], hat: [0], item: [1, 0], mantle: [3], cover: [3], jewel: [0] }
  },
  {
    id: "scribe",
    name: "Scribe",
    blurb: "Ezra copied the Law. Dark wool, a scroll and a plain band.",
    m: { tunic: [2], sash: [0], hat: [1], item: [2, 0], mantle: [2], cover: [2] },
    f: { tunic: [3], sash: [0], hat: [0], item: [2, 0], mantle: [0], cover: [1], jewel: [0] }
  },
  {
    id: "psalmist",
    name: "Psalmist",
    blurb: "Miriam and David praised God with music. Rich colour and a harp.",
    m: { tunic: [9, 8, 7], sash: [3, 2, 0], hat: [3, 1], item: [8, 0], mantle: [0], cover: [0] },
    f: {
      tunic: [9, 8, 4],
      sash: [3, 2, 0],
      hat: [3, 0],
      item: [8, 0],
      mantle: [4],
      cover: [2],
      jewel: [2]
    }
  },
  {
    id: "herald",
    name: "Herald",
    blurb: "The shofar called Israel to gather. Scarlet and a ram's horn.",
    m: { tunic: [8, 7], sash: [2, 0], hat: [1], item: [4, 0], mantle: [1], cover: [1] },
    f: { tunic: [8, 4], sash: [2, 0], hat: [0], item: [4, 0], mantle: [1], cover: [3], jewel: [1] }
  },
  {
    id: "watchman",
    name: "Watchman",
    blurb: "Keeping watch through the night with a lamp.",
    m: { tunic: [12, 2], sash: [0], hat: [0], item: [5, 0], mantle: [2], cover: [1] },
    f: { tunic: [12, 3], sash: [0], hat: [0], item: [5, 0], mantle: [0], cover: [1], jewel: [0] }
  },
  {
    id: "builder",
    name: "Builder",
    blurb: "Nehemiah's wall went up with a tool in one hand. Work clothes and a hammer.",
    m: { tunic: [0], sash: [1], hat: [1], item: [9, 0], mantle: [1], cover: [1] },
    f: { tunic: [7], sash: [1], hat: [0], item: [9, 0], mantle: [2], cover: [3], jewel: [0] }
  },
  {
    id: "warrior",
    name: "Warrior",
    blurb: "Joshua's army: a spear, a helmet and a crimson girdle.",
    m: { tunic: [8, 2], sash: [2, 0], hat: [4, 1], item: [10, 7, 3, 0], mantle: [2], cover: [0] },
    f: {
      tunic: [8, 4],
      sash: [2, 0],
      hat: [4, 0],
      item: [10, 7, 3, 0],
      mantle: [1],
      cover: [0],
      jewel: [0]
    }
  },
  {
    id: "defender",
    name: "Defender",
    blurb: "The shield of faith and the belt of truth.",
    m: { tunic: [10, 6], sash: [4, 3, 0], hat: [4, 3, 1], item: [6, 0], mantle: [4], cover: [0] },
    f: {
      tunic: [10, 6],
      sash: [4, 3, 0],
      hat: [4, 3, 0],
      item: [6, 0],
      mantle: [0],
      cover: [0],
      jewel: [0]
    }
  },
  {
    id: "fisherman",
    name: "Fisherman",
    blurb: "Peter and Andrew fished Galilee. Blue wool and a cast net.",
    m: { tunic: [10, 0], sash: [1], hat: [1], item: [11, 0], mantle: [3], cover: [0] },
    f: { tunic: [10, 3], sash: [1], hat: [0], item: [11, 0], mantle: [0], cover: [3], jewel: [0] }
  },
  {
    id: "tentmaker",
    name: "Tentmaker",
    blurb: "Paul, Aquila and Priscilla made tents from goat-hair cloth.",
    m: { tunic: [1], sash: [0], hat: [2, 1], item: [12, 0], mantle: [4], cover: [0] },
    f: { tunic: [5], sash: [0], hat: [0], item: [12, 0], mantle: [2], cover: [3], jewel: [0] }
  },
  {
    id: "carpenter",
    name: "Carpenter",
    blurb: "Joseph's trade, and Jesus' too. Linen, a leather girdle and a saw.",
    m: { tunic: [6, 0], sash: [0], hat: [0], item: [13, 0], mantle: [3], cover: [0] },
    f: { tunic: [6, 3], sash: [0], hat: [0], item: [13, 0], mantle: [3], cover: [1], jewel: [0] }
  },
  {
    id: "farmer",
    name: "Farmer",
    blurb: "The sower and the reaper. Olive wool, rope and a sickle.",
    m: { tunic: [7], sash: [1], hat: [2, 1], item: [14, 0], mantle: [0], cover: [1] },
    f: { tunic: [7], sash: [1], hat: [0], item: [14, 0], mantle: [2], cover: [3], jewel: [0] }
  },
  {
    id: "taxcollector",
    name: "Tax collector",
    blurb: "Matthew and Zacchaeus collected taxes. Fine cloth, a gold girdle and a coin purse.",
    m: { tunic: [11, 9, 1], sash: [4, 3, 0], hat: [0], item: [15, 0], mantle: [4], cover: [0] },
    f: {
      tunic: [11, 9, 4],
      sash: [4, 3, 0],
      hat: [0],
      item: [15, 0],
      mantle: [4],
      cover: [2],
      jewel: [2]
    }
  },
  {
    id: "priest",
    name: "Priest",
    blurb: "Zechariah served at the temple. A white robe, a blue girdle and a censer of incense.",
    m: { tunic: [13, 6], sash: [3, 0], hat: [0], item: [16, 0], mantle: [3], cover: [2] },
    f: {
      tunic: [13, 6],
      sash: [3, 0],
      hat: [0],
      item: [16, 0],
      mantle: [3],
      cover: [1],
      jewel: [0]
    }
  }
];

// The look the reader gets from wearing a role, and what they have not unlocked yet.
// `locked` lists the pieces the role wants that need more days: [{ key, label, need }].
export function applyRole(look, role, n) {
  const g = look.g === "f" ? "f" : "m";
  const want = role[g];
  const out = { ...look };
  const locked = [];
  FIELDS.forEach(k => {
    const prefs = want[k];
    if (!prefs) {
      return;
    }
    if (!GATED.includes(k)) {
      out[k] = prefs[0];
      return;
    }
    const ok = new Set(allowedFor(k, g).map(([, i]) => i));
    const pick = prefs.find(i => ok.has(i) && UNLOCK[k][i][2] <= n);
    out[k] = pick ?? allowedFor(k, g).find(([e]) => e[2] === 0)[1];
    const best = prefs.find(i => ok.has(i));
    if (best !== undefined && UNLOCK[k][best][2] > n) {
      locked.push({ key: k, label: UNLOCK[k][best][0], need: UNLOCK[k][best][2] });
    }
  });
  return { look: out, locked };
}

// Whether the character is wearing everything a role asks for, as far as they have unlocked it.
export const wearsRole = (look, role, n) => {
  const { look: want } = applyRole(look, role, n);
  const asks = role[look.g === "f" ? "f" : "m"];
  return FIELDS.every(k => !asks[k] || look[k] === want[k]);
};
