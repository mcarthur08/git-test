// Role presets: a ready-made outfit and item for a Bible-time job. A preset only dresses the character, so the face,
// hair, skin and name are left alone. A role has an outfit for the genders that did the work in Bible times (m, f, or
// both), and the editor only offers a character the roles that fit. Each field lists indexes in order of preference: the
// first one the reader has unlocked is worn, so a preset still works on day 0 and gets closer to the real thing as they
// read. `hem: 1` is a work tunic, hitched up so the legs show.
import { UNLOCK, allowedFor } from "./data.js";

const GATED = ["tunic", "sash", "hat", "item"];
const FIELDS = [...GATED, "mantle", "cover", "jewel", "hem"];

export const ROLES = [
  {
    id: "shepherd",
    name: "Shepherd",
    blurb: "David kept his father's sheep. Plain brown wool, a hitched-up tunic and a staff.",
    m: { tunic: [1], sash: [1], hat: [0], item: [1, 3, 0], mantle: [1], cover: [1], hem: [1] },
    f: {
      name: "Shepherdess",
      blurb: "Rachel kept her father's sheep. A linen dress, a headscarf and a staff.",
      tunic: [6],
      sash: [1],
      hat: [0],
      item: [1, 0],
      mantle: [3],
      cover: [3],
      jewel: [0],
      hem: [1]
    }
  },
  {
    id: "tentmaker",
    name: "Tentmaker",
    blurb:
      "Paul, Aquila and Priscilla made tents from goat-hair cloth. Dark wool and a roll of cloth.",
    m: { tunic: [1], sash: [0], hat: [2, 1], item: [12, 0], mantle: [4], cover: [0], hem: [1] },
    f: {
      tunic: [7],
      sash: [0],
      hat: [0],
      item: [12, 0],
      mantle: [2],
      cover: [3],
      jewel: [0],
      hem: [1]
    }
  },
  // ---- men ----
  {
    id: "prophet",
    name: "Prophet",
    blurb: "Elijah and John wore rough wool cloaks and leather belts. Isaiah's scroll in hand.",
    m: { tunic: [1], sash: [0], hat: [0], item: [2, 0], mantle: [1], cover: [0], hem: [1] }
  },
  {
    id: "scribe",
    name: "Scribe",
    blurb: "Ezra copied the Law. A long linen robe, a dark mantle, a turban and a scroll.",
    m: { tunic: [6], sash: [0], hat: [0], item: [2, 0], mantle: [2], cover: [2], hem: [0] }
  },
  {
    id: "psalmist",
    name: "Psalmist",
    blurb: "David praised God with music. A rich robe and a harp.",
    m: {
      tunic: [9, 8, 7],
      sash: [3, 2, 0],
      hat: [3, 1],
      item: [8, 0],
      mantle: [0],
      cover: [0],
      hem: [0]
    }
  },
  {
    id: "herald",
    name: "Herald",
    blurb: "The shofar called Israel to gather. A scarlet robe and a ram's horn.",
    m: { tunic: [8, 7], sash: [2, 0], hat: [1], item: [4, 0], mantle: [1], cover: [1], hem: [0] }
  },
  {
    id: "watchman",
    name: "Watchman",
    blurb: "Keeping watch through the night, wrapped in dark wool with a lamp.",
    m: { tunic: [12, 2], sash: [0], hat: [0], item: [5, 0], mantle: [2], cover: [1], hem: [0] }
  },
  {
    id: "builder",
    name: "Builder",
    blurb: "Nehemiah's wall went up with a tool in one hand. A plain work tunic and a hammer.",
    m: { tunic: [0], sash: [1], hat: [1], item: [9, 0], mantle: [3], cover: [1], hem: [1] }
  },
  {
    id: "carpenter",
    name: "Carpenter",
    blurb: "Joseph's trade, and Jesus' too. A short work tunic, a leather belt and a saw.",
    m: { tunic: [0], sash: [0], hat: [1], item: [13, 9, 0], mantle: [1], cover: [0], hem: [1] }
  },
  {
    id: "fisherman",
    name: "Fisherman",
    blurb: "Peter and Andrew fished Galilee. A short undyed tunic, a headcloth and a cast net.",
    m: { tunic: [0], sash: [1], hat: [0], item: [11, 0], mantle: [3], cover: [1], hem: [1] }
  },
  {
    id: "farmer",
    name: "Farmer",
    blurb: "The sower and the reaper. A short olive tunic, a sun wrap and a sickle.",
    m: { tunic: [7], sash: [1], hat: [2, 1], item: [14, 0], mantle: [3], cover: [1], hem: [1] }
  },
  {
    id: "taxcollector",
    name: "Tax collector",
    blurb: "Matthew and Zacchaeus collected taxes. Fine cloth, a gold girdle and a coin purse.",
    m: {
      tunic: [11, 9, 1],
      sash: [4, 3, 0],
      hat: [0],
      item: [15, 0],
      mantle: [4],
      cover: [0],
      hem: [0]
    }
  },
  {
    id: "priest",
    name: "Priest",
    blurb:
      "Zechariah served at the temple. A white linen robe, a blue girdle, a turban and a censer.",
    m: { tunic: [13, 6], sash: [3, 0], hat: [0], item: [16, 0], mantle: [3], cover: [2], hem: [0] }
  },
  {
    id: "warrior",
    name: "Warrior",
    blurb: "Joshua's army: a short scarlet tunic, a leather belt, a helmet and a spear.",
    m: {
      tunic: [8, 2],
      sash: [0],
      hat: [4, 1],
      item: [10, 7, 3, 0],
      mantle: [2],
      cover: [0],
      hem: [1]
    }
  },
  {
    id: "defender",
    name: "Defender",
    blurb: "The shield of faith and the belt of truth.",
    m: {
      tunic: [10, 6],
      sash: [4, 3, 0],
      hat: [4, 3, 1],
      item: [6, 0],
      mantle: [4],
      cover: [0],
      hem: [1]
    }
  },
  // ---- women ----
  {
    id: "prophetess",
    name: "Prophetess",
    blurb: "Deborah, Huldah and Anna spoke for God. Deep indigo, a veil and the scroll of the Law.",
    f: {
      tunic: [3],
      sash: [0],
      hat: [0],
      item: [2, 0],
      mantle: [0],
      cover: [1],
      jewel: [0],
      hem: [0]
    }
  },
  {
    id: "midwife",
    name: "Midwife",
    blurb:
      "Shiphrah and Puah served the Hebrew mothers. A linen dress, a rope belt and a water basin.",
    f: {
      tunic: [6],
      sash: [1],
      hat: [0],
      item: [19, 0],
      mantle: [3],
      cover: [3],
      jewel: [0],
      hem: [0]
    }
  },
  {
    id: "nurse",
    name: "Nurse",
    blurb:
      "Jochebed nursed baby Moses. A plain olive dress, a veil and a child in swaddling cloth.",
    f: {
      tunic: [7],
      sash: [1],
      hat: [0],
      item: [18, 0],
      mantle: [3],
      cover: [1],
      jewel: [0],
      hem: [0]
    }
  },
  {
    id: "merchant",
    name: "Merchant",
    blurb: "Lydia sold purple cloth. Fine dye, jewelry, a coin headdress and a set of scales.",
    f: {
      tunic: [9, 8, 4],
      sash: [4, 3, 0],
      hat: [0],
      item: [21, 0],
      mantle: [4],
      cover: [2],
      jewel: [2],
      hem: [0]
    }
  },
  {
    id: "weaver",
    name: "Weaver",
    blurb: "Dorcas made robes, and the wise woman of Proverbs 31 spun wool and flax.",
    f: {
      tunic: [4],
      sash: [1],
      hat: [0],
      item: [22, 0],
      mantle: [4],
      cover: [3],
      jewel: [0],
      hem: [0]
    }
  },
  {
    id: "gleaner",
    name: "Farm laborer",
    blurb:
      "Ruth gleaned barley behind the reapers. A hitched-up work dress, a sun scarf and a sheaf.",
    f: {
      tunic: [7],
      sash: [1],
      hat: [0],
      item: [23, 0],
      mantle: [3],
      cover: [3],
      jewel: [0],
      hem: [1]
    }
  },
  {
    id: "waterbearer",
    name: "Water-bearer",
    blurb: "Rebekah and the woman at the well drew water every day. Indigo, a veil and a jar.",
    f: {
      tunic: [3],
      sash: [0],
      hat: [0],
      item: [20, 0],
      mantle: [1],
      cover: [1],
      jewel: [0],
      hem: [0]
    }
  },
  {
    id: "singer",
    name: "Singer",
    blurb: "Miriam led the women in song with a timbrel. Madder red, beads and a coin headdress.",
    f: {
      tunic: [4],
      sash: [2, 1],
      hat: [0],
      item: [17, 0],
      mantle: [2],
      cover: [2],
      jewel: [2],
      hem: [0]
    }
  }
];

const genderOf = look => (look.g === "f" ? "f" : "m");

// The roles that fit a man or a woman, and what each is called for them.
export const rolesFor = g => ROLES.filter(r => r[g]);
export const roleName = (role, g) => role[g]?.name || role.name;
export const roleBlurb = (role, g) => role[g]?.blurb || role.blurb;

// The look the reader gets from wearing a role, and what they have not unlocked yet.
// `locked` lists the pieces the role wants that need more days: [{ key, label, need }].
export function applyRole(look, role, n) {
  const g = genderOf(look);
  const want = role[g];
  const out = { ...look };
  const locked = [];
  if (!want) {
    return { look: out, locked };
  }
  FIELDS.forEach(k => {
    const prefs = want[k] || (k === "hem" ? [0] : null);
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
  const asks = role[genderOf(look)];
  if (!asks) {
    return false;
  }
  const { look: want } = applyRole(look, role, n);
  return FIELDS.every(k =>
    k === "hem" ? (look.hem || 0) === want.hem : !asks[k] || look[k] === want[k]
  );
};
