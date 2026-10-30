import { describe, it, expect } from "vitest";
import { ROLES, rolesFor, roleName, roleBlurb, applyRole, wearsRole } from "./roles.js";
import { UNLOCK, COVERS, MANTLES, JEWELS, allowedFor, DAYS } from "./data.js";
import { fullSVG } from "./avatar.js";

const base = g => ({ g, skin: 2, hair: 1, face: 1 });
const NEW_PROPS = [
  "harp",
  "hammer",
  "spear",
  "net",
  "cloth",
  "saw",
  "sickle",
  "purse",
  "censer",
  "timbrel",
  "infant",
  "basin",
  "jar",
  "scales",
  "spindle",
  "sheaf"
];

describe("role presets", () => {
  it("have a unique id, a name and a blurb, and fit at least one gender", () => {
    expect(new Set(ROLES.map(r => r.id)).size).toBe(ROLES.length);
    ROLES.forEach(r => {
      expect(r.name && r.blurb, r.id).toBeTruthy();
      expect(r.m || r.f, r.id).toBeTruthy();
    });
  });

  it("offer women only the jobs women did in Bible times", () => {
    const women = rolesFor("f").map(r => r.id);
    [
      "prophetess",
      "midwife",
      "nurse",
      "merchant",
      "tentmaker",
      "weaver",
      "gleaner",
      "shepherd",
      "waterbearer",
      "singer"
    ].forEach(id => expect(women, id).toContain(id));
    // priests, soldiers, scribes and the like were men's work
    [
      "priest",
      "warrior",
      "defender",
      "scribe",
      "fisherman",
      "carpenter",
      "builder",
      "farmer",
      "taxcollector",
      "watchman",
      "herald",
      "prophet",
      "psalmist"
    ].forEach(id => expect(women, id).not.toContain(id));
  });

  it("offer men the men's roles and no women's-only role", () => {
    const men = rolesFor("m").map(r => r.id);
    ["shepherd", "tentmaker", "priest", "fisherman", "warrior"].forEach(id =>
      expect(men).toContain(id)
    );
    ["prophetess", "midwife", "nurse", "merchant", "weaver", "waterbearer", "singer"].forEach(id =>
      expect(men).not.toContain(id)
    );
  });

  it("name shared roles for each gender", () => {
    const shepherd = ROLES.find(r => r.id === "shepherd");
    expect(roleName(shepherd, "m")).toBe("Shepherd");
    expect(roleName(shepherd, "f")).toBe("Shepherdess");
    expect(roleBlurb(shepherd, "f")).toMatch(/Rachel/);
    expect(roleBlurb(shepherd, "m")).toMatch(/David/);
  });

  it.each(["m", "f"])("only ask for pieces that exist for %s", g => {
    rolesFor(g).forEach(r => {
      const w = r[g];
      ["tunic", "sash", "hat", "item"].forEach(k => {
        const ok = allowedFor(k, g).map(([, i]) => i);
        w[k].forEach(i => expect(ok, `${r.id} ${k} ${i}`).toContain(i));
      });
      w.mantle.forEach(i => expect(i).toBeLessThan(MANTLES[g].length));
      w.cover.forEach(i => expect(i).toBeLessThan(COVERS[g].length));
      (w.jewel || []).forEach(i => expect(i).toBeLessThan(JEWELS.length));
      w.hem.forEach(i => expect([0, 1]).toContain(i));
    });
  });

  it.each(["m", "f"])("never put on something unearned, whatever the day (%s)", g => {
    rolesFor(g).forEach(r => {
      for (const n of [0, 3, 14, 30, 50, DAYS]) {
        const { look } = applyRole(base(g), r, n);
        ["tunic", "sash", "hat", "item"].forEach(k =>
          expect(UNLOCK[k][look[k]][2], `${r.id} ${k} day ${n}`).toBeLessThanOrEqual(n)
        );
      }
    });
  });

  it.each(["m", "f"])("give the full outfit once everything is unlocked (%s)", g => {
    rolesFor(g).forEach(r => {
      const { look, locked } = applyRole(base(g), r, DAYS);
      expect(locked, r.id).toEqual([]);
      expect(look.item).toBe(r[g].item[0]);
      expect(look.tunic).toBe(r[g].tunic[0]);
      expect(look.hem).toBe(r[g].hem[0]);
    });
  });

  it("falls back to a free piece on day 0 and says what is still locked", () => {
    const warrior = ROLES.find(r => r.id === "warrior");
    const { look, locked } = applyRole(base("m"), warrior, 0);
    expect(look.item).toBe(0);
    expect(locked.find(l => l.key === "item")).toMatchObject({ label: "Spear", need: 49 });
    // a day-14 reader gets the sling instead
    expect(UNLOCK.item[applyRole(base("m"), warrior, 14).look.item][1]).toBe("sling");
  });

  it("dresses working roles in a work tunic and the rest in a full-length robe", () => {
    const hem = (id, g) =>
      applyRole(
        base(g),
        ROLES.find(r => r.id === id),
        DAYS
      ).look.hem;
    ["fisherman", "carpenter", "farmer", "builder", "warrior", "shepherd"].forEach(id =>
      expect(hem(id, "m"), id).toBe(1)
    );
    ["priest", "scribe", "taxcollector"].forEach(id => expect(hem(id, "m"), id).toBe(0));
    expect(hem("gleaner", "f")).toBe(1);
    ["prophetess", "merchant", "midwife", "nurse", "weaver"].forEach(id =>
      expect(hem(id, "f"), id).toBe(0)
    );
  });

  it("switches back to a full-length robe when a long role follows a short one", () => {
    const by = id => ROLES.find(r => r.id === id);
    const short = applyRole(base("m"), by("fisherman"), DAYS).look;
    expect(short.hem).toBe(1);
    expect(applyRole(short, by("priest"), DAYS).look.hem).toBe(0);
  });

  it("leaves the face, hair, skin and gender alone", () => {
    const start = { ...base("f"), skin: 4, hair: 3, hairColor: 2, eyes: 2, brows: 1, mouth: 3 };
    rolesFor("f").forEach(r => {
      const { look } = applyRole(start, r, DAYS);
      Object.keys(start).forEach(k => expect(look[k], `${r.id} ${k}`).toBe(start[k]));
    });
  });

  it("does nothing for a gender the role has no outfit for", () => {
    const priest = ROLES.find(r => r.id === "priest");
    const start = base("f");
    expect(applyRole(start, priest, DAYS)).toEqual({ look: start, locked: [] });
    expect(wearsRole(start, priest, DAYS)).toBe(false);
  });

  it("is recognised as worn after applying it, and not before", () => {
    ["m", "f"].forEach(g =>
      rolesFor(g).forEach(r => {
        const dressed = applyRole(base(g), r, 20).look;
        expect(wearsRole(dressed, r, 20), `${r.id} ${g}`).toBe(true);
      })
    );
    const [first, second] = rolesFor("m");
    expect(wearsRole(applyRole(base("m"), first, DAYS).look, second, DAYS)).toBe(false);
  });

  it("draws every role as a full-body character", () => {
    ["m", "f"].forEach(g =>
      rolesFor(g).forEach(r => {
        const svg = fullSVG(applyRole(base(g), r, DAYS).look, DAYS);
        expect(svg, `${r.id} ${g}`).not.toMatch(/undefined|NaN|\[object|null/);
      })
    );
  });
});

describe("the work tunic", () => {
  it("is drawn shorter, with the legs showing, for both genders", () => {
    ["m", "f"].forEach(g => {
      const long = fullSVG({ g, hem: 0 }, DAYS);
      const short = fullSVG({ g, hem: 1 }, DAYS);
      expect(short, g).not.toBe(long);
      expect(short, g).not.toMatch(/undefined|NaN|\[object|null/);
    });
  });

  it("works with every item and mantle", () => {
    ["m", "f"].forEach(g =>
      UNLOCK.item.forEach((_, item) =>
        MANTLES[g].forEach((_m, mantle) =>
          expect(fullSVG({ g, hem: 1, item, mantle }, DAYS)).not.toMatch(
            /undefined|NaN|\[object|null/
          )
        )
      )
    );
  });
});

describe("the props the roles use", () => {
  it("were added after the old items, so saved looks keep their item", () => {
    expect(UNLOCK.item.slice(0, 8).map(e => e[1])).toEqual([
      "none",
      "staff",
      "scroll",
      "sling",
      "shofar",
      "lamp",
      "shield",
      "sword"
    ]);
    NEW_PROPS.forEach(v =>
      expect(
        UNLOCK.item.some(e => e[1] === v),
        v
      ).toBe(true)
    );
  });

  it("each draw something on the full-body figure", () => {
    NEW_PROPS.forEach(v => {
      const item = UNLOCK.item.findIndex(e => e[1] === v);
      const g = UNLOCK.item[item][3] || "m";
      expect(fullSVG({ g, item }, DAYS), v).not.toBe(fullSVG({ g, item: 0 }, DAYS));
    });
  });

  it("keep women's-only props off the men's item list", () => {
    ["infant", "basin", "spindle"].forEach(v => {
      const names = allowedFor("item", "m").map(([e]) => e[1]);
      expect(names, v).not.toContain(v);
      expect(allowedFor("item", "f").map(([e]) => e[1])).toContain(v);
    });
  });
});
