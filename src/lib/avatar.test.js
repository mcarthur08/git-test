import { describe, it, expect } from "vitest";
import { normLook, mixHex, avatarSVG, portraitSVG, figureSVG } from "./avatar.js";
import {
  UNLOCK,
  allowedFor,
  SKINS,
  HAIRS,
  HAIRC,
  BEARDS,
  FACES,
  EYES,
  EYEC,
  BROWS,
  MOUTHS,
  COVERS,
  MANTLES,
  JEWELS,
  DAYS
} from "./data.js";

const allowedNow = (key, g, n) =>
  allowedFor(key, g)
    .filter(([e]) => e[2] <= n)
    .map(([, i]) => i);
const ri = n => Math.floor(Math.random() * n);
const randomLook = () => ({
  g: Math.random() < 0.5 ? "m" : "f",
  skin: ri(8),
  hair: ri(10),
  hairColor: ri(8),
  beard: Math.random() < 0.1 ? true : ri(8),
  tunic: ri(20),
  sash: ri(8),
  hat: ri(8),
  item: ri(10),
  face: ri(8),
  eyes: ri(8),
  eyeColor: ri(8),
  brows: ri(8),
  mouth: ri(8),
  cover: ri(8),
  mantle: ri(8),
  jewel: ri(8)
});

describe("normLook", () => {
  it("builds a complete look from nothing", () => {
    [null, undefined, "x", 5].forEach(l => {
      const out = normLook(l, 0);
      expect(out.g).toBe("m");
      expect(Object.keys(out).sort()).toEqual(Object.keys(randomLook()).sort());
      Object.entries(out).forEach(([k, val]) => {
        if (k !== "g") {
          expect(Number.isInteger(val), k).toBe(true);
        }
      });
    });
  });

  it("only accepts 'f' as female", () => {
    expect(normLook({ g: "f" }, 0).g).toBe("f");
    expect(normLook({ g: "x" }, 0).g).toBe("m");
  });

  it("keeps in-range choices and resets out-of-range or non-integer ones to 0", () => {
    expect(normLook({ skin: 3 }, 0).skin).toBe(3);
    expect(normLook({ skin: SKINS.length }, 0).skin).toBe(0);
    expect(normLook({ skin: -1 }, 0).skin).toBe(0);
    expect(normLook({ skin: 1.5 }, 0).skin).toBe(0);
    expect(normLook({ skin: "2" }, 0).skin).toBe(0);
    expect(normLook({ hair: HAIRS.length - 1 }, 0).hair).toBe(HAIRS.length - 1);
  });

  it("treats the old beard:true as beard style 3 for men and ignores beards for women", () => {
    expect(normLook({ g: "m", beard: true }, 0).beard).toBe(3);
    expect(normLook({ g: "m", beard: 2 }, 0).beard).toBe(2);
    expect(normLook({ g: "f", beard: 2 }, 0).beard).toBe(0);
    expect(normLook({ g: "f", beard: true }, 0).beard).toBe(0);
  });

  it("gives jewels to women only", () => {
    expect(normLook({ g: "f", jewel: 1 }, 0).jewel).toBe(1);
    expect(normLook({ g: "m", jewel: 1 }, 0).jewel).toBe(0);
  });

  it("uses the gender's own cover and mantle lists", () => {
    expect(normLook({ g: "m", cover: COVERS.m.length }, 0).cover).toBe(0);
    expect(normLook({ g: "f", cover: COVERS.f.length - 1 }, 0).cover).toBe(COVERS.f.length - 1);
    expect(normLook({ g: "m", mantle: MANTLES.m.length - 1 }, 0).mantle).toBe(MANTLES.m.length - 1);
  });

  it("locks items until enough days are done", () => {
    const whiteRobe = UNLOCK.tunic.findIndex(e => e[0] === "White robe");
    const needs = UNLOCK.tunic[whiteRobe][2];
    expect(normLook({ tunic: whiteRobe }, needs - 1).tunic).not.toBe(whiteRobe);
    expect(normLook({ tunic: whiteRobe }, needs).tunic).toBe(whiteRobe);

    const crown = UNLOCK.hat.findIndex(e => e[1] === "crown");
    expect(normLook({ hat: crown }, DAYS - 1).hat).toBe(0);
    expect(normLook({ hat: crown }, DAYS).hat).toBe(crown);
  });

  it("falls back to the first allowed choice when a locked or wrong-gender item is picked", () => {
    const womensTunic = UNLOCK.tunic.findIndex(e => e[3] === "f");
    const mensTunic = UNLOCK.tunic.findIndex(e => e[3] === "m");
    expect(normLook({ g: "m", tunic: womensTunic }, 70).tunic).toBe(
      allowedNow("tunic", "m", 70)[0]
    );
    expect(normLook({ g: "f", tunic: mensTunic }, 70).tunic).toBe(allowedNow("tunic", "f", 70)[0]);
  });

  it("always gives a usable robe, sash, hat and item, at any day count and for either gender", () => {
    for (let n = 0; n <= DAYS; n++) {
      ["m", "f"].forEach(g => {
        const out = normLook({ g }, n);
        ["tunic", "sash", "hat", "item"].forEach(key => {
          expect(allowedNow(key, g, n), `${key} ${g} day ${n}`).toContain(out[key]);
        });
      });
    }
  });

  it("keeps every field in range for random input", () => {
    for (let i = 0; i < 500; i++) {
      const l = randomLook();
      const n = ri(DAYS + 1);
      const out = normLook(l, n);
      const lim = (v, arr) => expect(v >= 0 && v < arr.length).toBe(true);
      lim(out.skin, SKINS);
      lim(out.hair, HAIRS);
      lim(out.hairColor, HAIRC);
      lim(out.beard, BEARDS);
      lim(out.face, FACES);
      lim(out.eyes, EYES);
      lim(out.eyeColor, EYEC);
      lim(out.brows, BROWS);
      lim(out.mouth, MOUTHS);
      lim(out.cover, COVERS[out.g]);
      lim(out.mantle, MANTLES[out.g]);
      lim(out.jewel, JEWELS);
      ["tunic", "sash", "hat", "item"].forEach(key =>
        expect(allowedNow(key, out.g, n)).toContain(out[key])
      );
    }
  });

  it("is idempotent", () => {
    for (let i = 0; i < 200; i++) {
      const n = ri(DAYS + 1);
      const once = normLook(randomLook(), n);
      expect(normLook(once, n)).toEqual(once);
    }
  });

  it("does not change its input", () => {
    const l = { g: "f", tunic: 99, beard: true };
    const copy = { ...l };
    normLook(l, 0);
    expect(l).toEqual(copy);
  });
});

describe("mixHex", () => {
  it("returns the first colour at 0 and the second at 1", () => {
    expect(mixHex("#102030", "#a0b0c0", 0)).toBe("#102030");
    expect(mixHex("#102030", "#a0b0c0", 1)).toBe("#a0b0c0");
  });

  it("blends channel by channel", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixHex("#ff0000", "#0000ff", 0.5)).toBe("#800080");
  });
});

describe("avatar drawing", () => {
  const BAD = /undefined|NaN|\[object|null/;

  it("returns an svg for the figure, the portrait and the cached avatarSVG", () => {
    const look = { g: "m" };
    [
      figureSVG(look, 5),
      portraitSVG(look, 5),
      avatarSVG(look, 5),
      avatarSVG(look, 5, { portrait: true })
    ].forEach(svg => {
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.trim().endsWith("</svg>")).toBe(true);
    });
  });

  it("draws every hat and item for both genders without a missing value", () => {
    ["m", "f"].forEach(g => {
      UNLOCK.hat.forEach((_, hat) =>
        UNLOCK.item.forEach((__, item) => {
          const look = { g, hat, item, tunic: 6, sash: 4 };
          expect(figureSVG(look, DAYS), `${g} figure hat ${hat} item ${item}`).not.toMatch(BAD);
          expect(portraitSVG(look, DAYS), `${g} portrait hat ${hat} item ${item}`).not.toMatch(BAD);
        })
      );
    });
  });

  it("draws random looks without a missing value", () => {
    for (let i = 0; i < 100; i++) {
      const look = randomLook();
      const n = ri(DAYS + 1);
      expect(figureSVG(look, n)).not.toMatch(BAD);
      expect(portraitSVG(look, n)).not.toMatch(BAD);
    }
  });

  it("caches still avatars by their cleaned-up look", () => {
    const a = avatarSVG({ g: "m", skin: 2 }, 0);
    expect(avatarSVG({ g: "m", skin: 2, bogus: 1 }, 0)).toBe(a);
    expect(avatarSVG({ g: "m", skin: 3 }, 0)).not.toBe(a);
  });

  it("caches the portrait separately from the figure", () => {
    expect(avatarSVG({ g: "m" }, 0, { portrait: true })).not.toBe(avatarSVG({ g: "m" }, 0));
  });

  it("gives each portrait its own element ids so two on one page do not share gradients", () => {
    const ids = svg => [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    const a = ids(portraitSVG({ g: "m" }, 3));
    const b = ids(portraitSVG({ g: "m" }, 3));
    expect(a.length).toBeGreaterThan(0);
    expect(a.filter(id => b.includes(id))).toEqual([]);
  });

  it("does not repeat an id within one portrait", () => {
    const svg = portraitSVG({ g: "f" }, DAYS);
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
