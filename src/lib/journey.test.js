import { describe, it, expect } from "vitest";
import {
  segCtrl,
  journeyPos,
  routePath,
  fullRoute,
  placeAvatar,
  miniViewBox,
  buildCrowd,
  buildMe,
  MAP_W,
  MAP_H,
  MAP_BASE
} from "./journey.js";
import { STOPS, DAYS } from "./data.js";

const person = (id, alias, n, look = { g: "m" }) => ({ id, alias, look, s: { n } });

describe("journeyPos", () => {
  it("starts on the first stop", () => {
    expect(journeyPos(0)).toMatchObject({ k: 0, t: 0, x: STOPS[0].x, y: STOPS[0].y });
  });

  it("ends on the last stop at day 70", () => {
    const last = STOPS[STOPS.length - 1];
    expect(journeyPos(DAYS)).toMatchObject({ k: STOPS.length - 1, x: last.x, y: last.y });
  });

  it("clamps days outside 0-70", () => {
    expect(journeyPos(-5)).toEqual(journeyPos(0));
    expect(journeyPos(DAYS + 30)).toEqual(journeyPos(DAYS));
  });

  it("is exactly on each stop on that stop's day", () => {
    STOPS.forEach(s => {
      const p = journeyPos(s.day);
      expect(p.x).toBeCloseTo(s.x, 6);
      expect(p.y).toBeCloseTo(s.y, 6);
    });
  });

  it("moves between stops along their segment", () => {
    for (let k = 0; k < STOPS.length - 1; k++) {
      const mid = Math.floor((STOPS[k].day + STOPS[k + 1].day) / 2);
      if (mid > STOPS[k].day) {
        expect(journeyPos(mid)).toMatchObject({ k });
        expect(journeyPos(mid).t).toBeGreaterThan(0);
        expect(journeyPos(mid).t).toBeLessThan(1);
      }
    }
  });

  it("never jumps more than a stop-to-stop distance between consecutive days", () => {
    for (let n = 0; n < DAYS; n++) {
      const a = journeyPos(n);
      const b = journeyPos(n + 1);
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(120);
    }
  });

  it("stays on the map for every day", () => {
    for (let n = 0; n <= DAYS; n++) {
      const p = journeyPos(n);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(MAP_W);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(MAP_H);
    }
  });
});

describe("segCtrl", () => {
  it("bends the road at most 28 units off the straight line, alternating sides", () => {
    for (let k = 0; k < STOPS.length - 1; k++) {
      const a = STOPS[k];
      const b = STOPS[k + 1];
      const c = segCtrl(k);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      expect(Math.hypot(c.x - mid.x, c.y - mid.y)).toBeLessThanOrEqual(28 + 1e-9);
    }
  });
});

describe("routePath", () => {
  it("is just the starting point at day 0", () => {
    expect(routePath(0)).toBe(`M${STOPS[0].x} ${STOPS[0].y}`);
  });

  it("has one curve per finished segment at day 70", () => {
    expect(fullRoute().match(/Q/g)).toHaveLength(STOPS.length - 1);
    expect(fullRoute()).toBe(routePath(DAYS));
  });

  it("adds a partial curve part-way along a segment", () => {
    const n = Math.floor((STOPS[1].day + STOPS[2].day) / 2);
    expect(routePath(n).match(/Q/g)).toHaveLength(2);
  });

  it("grows by one curve each time a stop is reached", () => {
    STOPS.forEach((s, k) => {
      if (k > 0) {
        expect(routePath(s.day).match(/Q/g)).toHaveLength(k);
      }
    });
  });

  it("never prints NaN", () => {
    for (let n = -3; n <= DAYS + 3; n++) {
      expect(routePath(n)).not.toMatch(/NaN|undefined/);
    }
  });
});

describe("placeAvatar", () => {
  it("anchors the figure's feet on the point", () => {
    expect(placeAvatar("<svg viewBox='0 0 3 4'></svg>", 100, 200, 30)).toBe(
      '<svg x="85.0" y="163.0" width="30" height="40.0" viewBox=\'0 0 3 4\'></svg>'
    );
  });
});

describe("miniViewBox", () => {
  it("is always a 170 x 120 window inside the map", () => {
    for (let n = 0; n <= DAYS; n++) {
      const [x, y, w, h] = miniViewBox(n).split(" ").map(Number);
      expect([w, h]).toEqual([170, 120]);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(MAP_W);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + h).toBeLessThanOrEqual(MAP_H);
    }
  });
});

describe("MAP_BASE", () => {
  it("contains the dotted road and no unfilled template values", () => {
    expect(MAP_BASE).toContain(fullRoute());
    expect(MAP_BASE).not.toMatch(/undefined|NaN|\[object/);
  });
});

describe("buildCrowd", () => {
  it("is empty with nobody on the road", () => {
    expect(buildCrowd([], "me", false)).toBe("");
  });

  it("leaves out the player themselves", () => {
    const html = buildCrowd([person("me", "Me Myself", 3), person("b", "Bea", 3)], "me", false);
    expect(html).not.toContain("Me Myself");
    expect(html).toContain("Bea");
  });

  it("shows up to five per spot zoomed out and counts the rest", () => {
    const crowd = Array.from({ length: 8 }, (_, i) => person("p" + i, "P" + i, 10));
    const html = buildCrowd(crowd, null, false);
    expect(html.match(/class="m-person"/g)).toHaveLength(5);
    expect(html).toContain(">+3<");
  });

  it("shows everyone, with names, zoomed in", () => {
    const crowd = Array.from({ length: 8 }, (_, i) => person("p" + i, "Pat" + i, 10));
    const html = buildCrowd(crowd, null, true);
    expect(html.match(/class="m-person"/g)).toHaveLength(8);
    expect(html.match(/class="m-name"/g)).toHaveLength(8);
    expect(html).not.toContain("m-more");
  });

  it("puts people at different days in different places", () => {
    const html = buildCrowd([person("a", "Ann", 5), person("b", "Bo", 40)], null, false);
    expect(html.match(/<svg x="([\d.-]+)"/g)).toHaveLength(2);
    const [xa, xb] = [...html.matchAll(/<svg x="([\d.-]+)" y="([\d.-]+)"/g)].map(
      m => m[1] + "," + m[2]
    );
    expect(xa).not.toBe(xb);
  });

  it("escapes names so they can't inject markup", () => {
    const html = buildCrowd([person("a", `<img src=x onerror="alert(1)"> Bob`, 4)], null, true);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("shortens long first names on the map label", () => {
    const html = buildCrowd([person("a", "Bartholomewson Smith", 4)], null, true);
    expect(html).toContain(">Bartholom…<");
  });

  it("copes with an alias that has no first word to split off", () => {
    expect(() => buildCrowd([person("a", "", 4)], null, true)).not.toThrow();
  });
});

describe("buildMe", () => {
  it("draws the player with a You tag at their position", () => {
    const html = buildMe({ g: "m" }, 12, false);
    expect(html).toContain(">You<");
    expect(html).toContain('class="m-me"');
    expect(html).not.toMatch(/NaN|undefined/);
  });
});
