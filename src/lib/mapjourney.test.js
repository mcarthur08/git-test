import { describe, it, expect } from "vitest";
import { STOPS, UNLOCK, DAYS } from "./data.js";
import { stopScene, SCENE_COUNT } from "./scenes.js";
import { LANDMARKS, landmarkFor } from "./landmarks.js";
import { seenKey, stopsCrossed, legMs, walkPlan, walkAt } from "./walk.js";
import { fullSVG } from "./avatar.js";
import { MAP_BASE } from "./journey.js";

// Every figure gets its own random element ids, so two drawings only match once those are left out.
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

const BAD = /undefined|NaN|\[object|null/;

describe("stop scenes", () => {
  it("has one scene for every stop, each described in words", () => {
    expect(SCENE_COUNT).toBe(STOPS.length);
    STOPS.forEach((s, i) => {
      const sc = stopScene(i);
      expect(sc.label.length, s.place).toBeGreaterThan(10);
      expect(["dawn", "day", "hot", "dusk", "night", "storm"]).toContain(sc.time);
    });
  });

  it("draws a clean svg for every stop, with every gradient it points at defined", () => {
    STOPS.forEach((s, i) => {
      const { svg } = stopScene(i);
      expect(svg, s.place).toMatch(/^<svg viewBox="0 0 360 120"/);
      expect(svg, s.place).not.toMatch(BAD);
      const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
      expect(new Set(ids).size).toBe(ids.length);
      [...svg.matchAll(/url\(#([^)]+)\)/g)].forEach(m => expect(ids, s.place).toContain(m[1]));
    });
  });

  it("gives each scene its own ids, so two on one page never clash", () => {
    const a = [...stopScene(0).svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    const b = [...stopScene(1).svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    expect(a.filter(id => b.includes(id))).toEqual([]);
  });

  it("makes each scene different, and matches the weather to the story", () => {
    const all = STOPS.map((_, i) => stopScene(i).svg);
    expect(new Set(all).size).toBe(all.length);
    const at = place => stopScene(STOPS.findIndex(s => s.place === place));
    // the storm on the Sea of Galilee has rain and lightning; the Passover night has a full moon
    expect(at("Sea of Galilee").time).toBe("storm");
    expect(at("Sea of Galilee").svg).toMatch(/sc-rain/);
    expect(at("Sea of Galilee").svg).toMatch(/sc-bolt/);
    expect(at("Jerusalem").time).toBe("night");
    expect(at("Bethlehem").time).toBe("night");
    expect(at("The Wilderness").time).toBe("hot");
    expect(at("Samaria").time).toBe("hot");
    expect(at("Bethlehem").svg).not.toMatch(/sc-rain/);
  });

  it("returns nothing for a stop that does not exist", () => {
    expect(stopScene(99).svg).toBe("");
    expect(stopScene(-1).svg).toBe("");
  });
});

describe("map landmarks", () => {
  it("has one for every stop, drawn without a missing value", () => {
    expect(LANDMARKS.length).toBe(STOPS.length);
    LANDMARKS.forEach((l, i) => {
      expect(l.svg, STOPS[i].place).not.toMatch(BAD);
      [l.dx, l.dy, l.s].forEach(v => expect(Number.isFinite(v)).toBe(true));
    });
    expect(landmarkFor(99)).toBeNull();
  });

  it("sits beside its own town and clear of every other town and landmark", () => {
    const spots = LANDMARKS.map((l, i) => ({ x: STOPS[i].x + l.dx, y: STOPS[i].y + l.dy }));
    spots.forEach((p, i) => {
      expect(Math.hypot(p.x - STOPS[i].x, p.y - STOPS[i].y), STOPS[i].place).toBeLessThan(26);
      STOPS.forEach((s, j) => {
        if (j !== i) {
          expect(
            Math.hypot(p.x - s.x, p.y - s.y),
            `${STOPS[i].place} / ${s.place}`
          ).toBeGreaterThan(10);
        }
      });
      spots.forEach((q, j) => {
        if (j > i) {
          expect(
            Math.hypot(p.x - q.x, p.y - q.y),
            `${STOPS[i].place} / ${STOPS[j].place}`
          ).toBeGreaterThan(14);
        }
      });
    });
  });

  it("adds terrain to the base map without a missing value", () => {
    expect(MAP_BASE).not.toMatch(BAD);
  });
});

describe("keepsakes", () => {
  const item = v => UNLOCK.item.findIndex(e => e[1] === v);

  it("gives every stop one item that unlocks on the day the character arrives", () => {
    const seen = new Set();
    STOPS.forEach(s => {
      expect(s.keepsake, s.place).toBeTruthy();
      expect(seen.has(s.keepsake)).toBe(false);
      seen.add(s.keepsake);
      const i = item(s.keepsake);
      expect(i, s.place).toBeGreaterThan(0);
      expect(UNLOCK.item[i][2], s.place).toBe(s.day);
      expect(UNLOCK.item[i][3], s.place).toBe("");
    });
  });

  it("draws each keepsake on both a man and a woman", () => {
    STOPS.forEach(s => {
      const i = item(s.keepsake);
      ["m", "f"].forEach(g => {
        const none = fullSVG({ g, item: 0 }, DAYS);
        const svg = fullSVG({ g, item: i }, DAYS);
        expect(strip(svg), `${s.place} ${g}`).not.toBe(strip(none));
        expect(svg, `${s.place} ${g}`).not.toMatch(BAD);
      });
    });
  });

  it("is only wearable once reached (a later keepsake is locked on day 0)", () => {
    expect(UNLOCK.item[item("star")][2]).toBe(0);
    expect(UNLOCK.item[item("palm")][2]).toBe(DAYS);
  });
});

describe("walking the road", () => {
  it("names the saved position per player", () => {
    expect(seenKey("abc")).toBe("nt70.walked.abc");
  });

  it("finds the stops reached between two points, a stop counting on its own day", () => {
    expect(stopsCrossed(0, 5)).toEqual([]);
    expect(stopsCrossed(5, 6)).toEqual([1]);
    expect(stopsCrossed(6, 12)).toEqual([2]);
    expect(stopsCrossed(0, DAYS)).toEqual(STOPS.map((_, i) => i).slice(1));
    expect(stopsCrossed(11, 11)).toEqual([]);
  });

  it("takes longer to walk a longer road, within limits", () => {
    for (let a = 0; a < DAYS; a += 5) {
      const ms = legMs(a, Math.min(DAYS, a + 6));
      expect(ms).toBeGreaterThanOrEqual(700);
      expect(ms).toBeLessThanOrEqual(2600);
    }
  });

  it("plans a continuous walk from where you were to where you are", () => {
    [
      [0, 3],
      [4, 13],
      [11, 12],
      [0, 70],
      [30, 66]
    ].forEach(([from, to]) => {
      const plan = walkPlan(from, to);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.steps[0].a).toBe(from);
      expect(plan.steps[plan.steps.length - 1].b).toBe(to);
      plan.steps.forEach((s, i) => {
        expect(s.t1).toBeGreaterThan(s.t0);
        if (i) {
          expect(s.t0).toBe(plan.steps[i - 1].t1);
          expect(s.a).toBe(plan.steps[i - 1].b);
        }
      });
      expect(plan.total).toBe(plan.steps[plan.steps.length - 1].t1);
    });
  });

  it("pauses at the last few stops reached, and never walks for long", () => {
    const short = walkPlan(5, 7);
    expect(short.steps.filter(s => s.stop !== undefined).map(s => s.stop)).toEqual([1]);
    const long = walkPlan(0, DAYS);
    const pauses = long.steps.filter(s => s.stop !== undefined).map(s => s.stop);
    expect(pauses).toEqual(STOPS.map((_, i) => i).slice(-3));
    expect(long.total).toBeLessThan(5500 + 3 * 1100 + 100);
    // a plain walk with no stop on the way has no pause
    expect(walkPlan(7, 10).steps.every(s => s.stop === undefined)).toBe(true);
  });

  it("moves forward only, from the start to the end, standing still at a stop", () => {
    const plan = walkPlan(0, 40);
    let last = 0;
    for (let e = 0; e <= plan.total + 50; e += 25) {
      const at = walkAt(plan, e);
      expect(at.n).toBeGreaterThanOrEqual(last - 1e-9);
      expect(at.n).toBeLessThanOrEqual(40 + 1e-9);
      last = at.n;
    }
    expect(walkAt(plan, 0).n).toBe(0);
    expect(walkAt(plan, plan.total + 1000).n).toBe(40);
    plan.steps
      .filter(s => s.stop !== undefined)
      .forEach(s => {
        const mid = walkAt(plan, (s.t0 + s.t1) / 2);
        expect(mid.stop).toBe(s.stop);
        expect(mid.n).toBe(STOPS[s.stop].day);
      });
  });

  it("copes with a walk of no distance", () => {
    expect(walkPlan(8, 8).steps).toEqual([]);
    expect(() => walkAt(walkPlan(8, 8), 0)).not.toThrow();
  });
});
