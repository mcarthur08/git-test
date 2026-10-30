import { describe, it, expect } from "vitest";
import { ROLES, applyRole, wearsRole } from "./roles.js";
import { UNLOCK, COVERS, MANTLES, JEWELS, allowedFor, DAYS } from "./data.js";
import { fullSVG } from "./avatar.js";

const base = g => ({ g, skin: 2, hair: 1, face: 1 });

describe("role presets", () => {
  it("have a unique id and a name, a blurb and an outfit for both genders", () => {
    expect(new Set(ROLES.map(r => r.id)).size).toBe(ROLES.length);
    ROLES.forEach(r => {
      expect(r.name && r.blurb).toBeTruthy();
      ["m", "f"].forEach(g => expect(Object.keys(r[g]).length).toBeGreaterThan(3));
    });
  });

  it.each(["m", "f"])("only ask for pieces that exist for %s", g => {
    ROLES.forEach(r => {
      const w = r[g];
      ["tunic", "sash", "hat", "item"].forEach(k => {
        const ok = allowedFor(k, g).map(([, i]) => i);
        w[k].forEach(i => expect(ok, `${r.id} ${k} ${i}`).toContain(i));
      });
      w.mantle.forEach(i => expect(i).toBeLessThan(MANTLES[g].length));
      w.cover.forEach(i => expect(i).toBeLessThan(COVERS[g].length));
      (w.jewel || []).forEach(i => expect(i).toBeLessThan(JEWELS.length));
    });
  });

  it.each(["m", "f"])("never put on something unearned, whatever the day (%s)", g => {
    ROLES.forEach(r => {
      for (const n of [0, 3, 14, 30, 50, DAYS]) {
        const { look } = applyRole(base(g), r, n);
        ["tunic", "sash", "hat", "item"].forEach(k =>
          expect(UNLOCK[k][look[k]][2], `${r.id} ${k} day ${n}`).toBeLessThanOrEqual(n)
        );
      }
    });
  });

  it("gives the full outfit once everything is unlocked, and reports nothing locked", () => {
    ROLES.forEach(r => {
      const { look, locked } = applyRole(base("m"), r, DAYS);
      expect(locked).toEqual([]);
      expect(look.item).toBe(r.m.item[0]);
      expect(look.tunic).toBe(r.m.tunic[0]);
    });
  });

  it("falls back to a free piece on day 0 and says what is still locked", () => {
    const warrior = ROLES.find(r => r.id === "warrior");
    const { look, locked } = applyRole(base("m"), warrior, 0);
    expect(look.item).toBe(0);
    expect(locked.map(l => l.key)).toContain("item");
    expect(locked.find(l => l.key === "item")).toMatchObject({ label: "Spear", need: 49 });
    // a day-14 reader gets the sling instead
    expect(UNLOCK.item[applyRole(base("m"), warrior, 14).look.item][1]).toBe("sling");
  });

  it("leaves the face, hair, skin and gender alone", () => {
    const start = { ...base("f"), skin: 4, hair: 3, hairColor: 2, eyes: 2, brows: 1, mouth: 3 };
    ROLES.forEach(r => {
      const { look } = applyRole(start, r, DAYS);
      Object.keys(start).forEach(k => expect(look[k], `${r.id} ${k}`).toBe(start[k]));
    });
  });

  it("is recognised as worn after applying it, and not before", () => {
    ROLES.forEach(r => {
      const dressed = applyRole(base("f"), r, 20).look;
      expect(wearsRole(dressed, r, 20)).toBe(true);
    });
    const shepherd = ROLES[0];
    expect(wearsRole(applyRole(base("m"), shepherd, DAYS).look, ROLES[1], DAYS)).toBe(false);
  });

  it("draws every role as a full-body character for both genders", () => {
    ["m", "f"].forEach(g =>
      ROLES.forEach(r => {
        const svg = fullSVG(applyRole(base(g), r, DAYS).look, DAYS);
        expect(svg, `${r.id} ${g}`).not.toMatch(/undefined|NaN|\[object|null/);
      })
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
    ["harp", "hammer", "spear", "net", "cloth", "saw", "sickle", "purse", "censer"].forEach(v =>
      expect(UNLOCK.item.some(e => e[1] === v)).toBe(true)
    );
  });

  it("each draw something on the full-body figure", () => {
    const none = fullSVG({ g: "m", item: 0 }, DAYS);
    ["harp", "hammer", "spear", "net", "cloth", "saw", "sickle", "purse", "censer"].forEach(v => {
      const item = UNLOCK.item.findIndex(e => e[1] === v);
      expect(fullSVG({ g: "m", item }, DAYS), v).not.toBe(none);
    });
  });
});
