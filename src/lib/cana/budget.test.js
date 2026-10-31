import { describe, it, expect } from "vitest";
import {
  FIG,
  UNIT,
  BASIC,
  CARRYING,
  MAX_PIXELS,
  resolutionFor,
  densityFor,
  textureBytes
} from "./budget.js";
import { POSES } from "../full.js";

describe("the scene's budget", () => {
  it("draws every pose that is asked for, and only those", () => {
    [...BASIC, ...CARRYING].forEach(v => {
      expect(v === "idle" || v === "jar" || v === "cup" || POSES[v], v).toBeTruthy();
    });
    expect(new Set(BASIC).size).toBe(BASIC.length);
    expect(BASIC[0]).toBe("idle");
    expect(CARRYING).toEqual([...BASIC, "jar", "cup"]);
    // a wave goes between the raised arm and standing, a dance between the two raised poses
    expect(BASIC).toEqual(expect.arrayContaining(["wave", "up", "up2"]));
  });

  it("makes a figure about 76 hall units tall and about 65 wide", () => {
    expect(UNIT).toBeCloseTo(0.19, 6);
    expect(FIG.h).toBeGreaterThan(80);
    expect(FIG.w).toBeGreaterThan(60);
    expect(FIG.anchorY).toBeGreaterThan(0.9);
    expect(FIG.anchorY).toBeLessThan(1);
  });

  it("never makes the drawing surface sharper than the screen, or more than double", () => {
    expect(resolutionFor(1, 900, 650)).toBe(1);
    expect(resolutionFor(2, 390, 500)).toBe(2);
    expect(resolutionFor(3, 390, 500)).toBe(2);
    expect(resolutionFor(undefined, 390, 500)).toBe(1);
    expect(resolutionFor(0, 390, 500)).toBe(1);
  });

  it("keeps the drawing surface within its pixel budget on a big screen", () => {
    [
      [2, 1024, 768],
      [2, 1400, 900],
      [3, 1366, 1024],
      [2, 390, 700],
      [1, 1920, 1080]
    ].forEach(([dpr, w, h]) => {
      const r = resolutionFor(dpr, w, h);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(2);
      // a box already bigger than the budget at one pixel per pixel cannot be made smaller than that
      expect(w * h * r * r <= MAX_PIXELS * 1.0001 || r === 1).toBe(true);
    });
  });

  it("makes the character pictures as sharp as the screen shows them, within limits", () => {
    expect(densityFor(2, 1)).toBe(2);
    expect(densityFor(1, 1)).toBe(1);
    expect(densityFor(2, 1.3)).toBe(2.4);
    expect(densityFor(2, 0.3)).toBeCloseTo(1.6, 5);
    expect(densityFor(0.5, 0.5)).toBe(1);
    for (let r = 1; r <= 2; r += 0.25) {
      for (let s = 0.3; s <= 2; s += 0.3) {
        const d = densityFor(r, s);
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(2.4);
      }
    }
  });

  it("keeps the pictures of a full courtyard small enough for a phone", () => {
    // you, three servants, four of the wedding party, two musicians and fifteen guests, on a sharp phone screen
    const kinds = [
      ...Array(4).fill("carrying"),
      ...Array(4).fill("basic"),
      ...Array(2).fill("musician"),
      ...Array(15).fill("basic")
    ];
    const density = densityFor(resolutionFor(3, 390, 560), Math.min(390 / 360, 560 / 540));
    const mb = textureBytes(kinds, density) / 1048576;
    expect(mb).toBeLessThan(25);
    // and well under what the first version used: five poses each at 2.6 pixels a unit
    const before =
      (kinds.length * 5 * Math.round(FIG.w * 2.6) * Math.round(FIG.h * 2.6) * 4 * 2) / 1048576;
    expect(mb).toBeLessThan(before * 0.6);
  });
});
