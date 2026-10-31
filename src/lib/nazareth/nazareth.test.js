import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import {
  buildCast,
  everyone,
  NAZARETH_DAY,
  SQUARE,
  HAMMER,
  STAFF,
  SCROLL,
  MIN_TOWN,
  MAX_REAL
} from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// Luke 2 of the Bible text the app ships, which the story is taken from
const LUKE2 = JSON.parse(readFileSync(resolve(process.cwd(), "public/kjv/Luke.json"), "utf8"))[1];
const verse = ref => LUKE2[+ref.split(":")[1] - 1];
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s village", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    boards: L.BOARD_SPOTS,
    bundles: L.BUNDLE_SPOTS,
    seek: L.SEEK_SPOTS,
    teachers: L.TEACHER_SPOTS,
    visit: L.VISIT_SPOTS,
    far: [L.ROAD_FAR, { x: L.ROAD_FAR.x - 28, y: L.ROAD_FAR.y }],
    light: L.LIGHT_PATH,
    wander: L.WANDER_SPOTS,
    home: [0, 1].map(i => ({ x: L.LIGHT_PATH[3].x - 26 + i * 26, y: L.LIGHT_PATH[3].y + 26 }))
  });

  it("is walled round the edge and blocks the hills, the house, the workshop and the court", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.TOP_Y - 20 })).toBe(false);
    [L.HOUSE, L.SHOP, L.COURT].forEach(r =>
      expect(free({ x: r.x + r.w / 2, y: r.y + r.h / 2 })).toBe(false)
    );
  });

  it("puts the house and the workshop at the left and the court at the right", () => {
    expect(L.HOUSE.y).toBeLessThan(L.SHOP.y);
    expect(L.HOUSE.x + L.HOUSE.w).toBeLessThan(L.COURT.x);
    expect(L.SHOP.x + L.SHOP.w).toBeLessThan(L.COURT.x);
    L.BOARD_SPOTS.forEach(s => expect(s.y).toBeGreaterThan(L.SHOP.y));
    L.BUNDLE_SPOTS.forEach(s => expect(s.y).toBeGreaterThan(L.HOUSE.y));
    L.TEACHER_SPOTS.forEach(s => expect(s.y).toBeGreaterThan(L.COURT.y + L.COURT.h));
  });

  it("has four boards, four bundles, four places to search, two teachers and two to visit them", () => {
    expect(L.BOARD_SPOTS.length).toBe(4);
    expect(L.BUNDLE_SPOTS.length).toBe(4);
    expect(L.SEEK_SPOTS.length).toBe(4);
    expect(L.TEACHER_SPOTS.length).toBe(2);
    expect(L.VISIT_SPOTS.length).toBe(2);
    // the light goes from the workshop to the house, on to the court, and home again
    expect(L.LIGHT_PATH.length).toBe(4);
    expect(L.LIGHT_PATH[2].x).toBeGreaterThan(L.LIGHT_PATH[1].x);
    expect(L.LIGHT_PATH[3].x).toBeLessThan(L.LIGHT_PATH[2].x);
  });

  it("keeps every place someone is meant to stand on free floor inside the village", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.TOP_Y);
        expect(p.y).toBeLessThan(L.WORLD.h);
      })
    );
  });

  it("lets everyone walk from the entrance to every place and back", () => {
    const find = L.makeFinder(grid);
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        const there = find(L.SPAWN, p);
        expect(there, `${group} ${i}`).not.toBeNull();
        expect(there[there.length - 1]).toEqual({ x: p.x, y: p.y });
        expect(find(p, L.SPAWN), `${group} ${i} back`).not.toBeNull();
      })
    );
    // the family from the workshop to the court, and from the court to the end of the road
    expect(find(L.BOARD_SPOTS[0], L.VISIT_SPOTS[0])).not.toBeNull();
    expect(find(L.VISIT_SPOTS[1], L.ROAD_FAR)).not.toBeNull();
  });
});

describe("choosing a village", () => {
  it("has a tall one and a wide one", () => {
    expect(Object.keys(LAYOUTS)).toEqual(["portrait", "landscape"]);
    expect(PORTRAIT.WORLD.h).toBeGreaterThan(PORTRAIT.WORLD.w);
    expect(LANDSCAPE.WORLD.w).toBeGreaterThan(LANDSCAPE.WORLD.h);
  });

  it("picks the wide one for a clearly wide box, the tall one otherwise", () => {
    expect(layoutFor(1280, 640).kind).toBe("landscape");
    expect(layoutFor(844, 340).kind).toBe("landscape");
    expect(layoutFor(390, 600).kind).toBe("portrait");
    expect(layoutFor(700, 700).kind).toBe("portrait");
    expect(layoutFor(0, 0).kind).toBe("portrait");
  });
});

describe("the story of the boy in Nazareth and at the feast", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["home", "feast", "lost", "found", "grow"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(STORY[p].quotes.map(q => q[1]).join(" ").length).toBeGreaterThan(20);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Luke 2 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^Luke 2:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells every verse of the passage, 39 to 52, in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual(Array.from({ length: 14 }, (_, i) => `Luke 2:${39 + i}`));
  });

  it("says the words of the passage word for word", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        LUKE2.some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // anything said that is long enough to be a quotation is one of those
    Object.keys(LINES).forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          const bare = l.replace(/[.!?]$/, "");
          if (LUKE2.some(v => v.includes(bare))) {
            expect(
              SCRIPTURE_LINES.some(s => s.includes(bare)),
              l
            ).toBe(true);
          }
        })
      )
    );
  });

  it("runs the parts in order on its own and stays on the last, and can be skipped or replayed", () => {
    vi.useFakeTimers();
    const dir = createActor(directorMachine).start();
    expect(dir.getSnapshot().value).toBe("home");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("grow");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("home");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("grow");
    dir.stop();
  });
});

describe("the cast in Nazareth", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds Nazareth as the stop of the boy growing up, with the carpenter's square as its keepsake", () => {
    const stop = STOPS.find(s => s.place === "Nazareth");
    expect(NAZARETH_DAY).toBe(6);
    expect(stop.keepsake).toBe("square");
    expect(UNLOCK.item[SQUARE][1]).toBe("square");
    expect(UNLOCK.item[HAMMER][1]).toBe("hammer");
    expect(UNLOCK.item[STAFF][1]).toBe("staff");
    expect(UNLOCK.item[SCROLL][1]).toBe("scroll");
  });

  it("brings in the other players who have reached Nazareth, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 60), player("b", 6), player("c", 5), player("d", 1), me]
    });
    expect(
      cast.town
        .filter(g => g.real)
        .map(g => g.id)
        .sort()
    ).toEqual(["a", "b"]);
    expect(cast.me).toMatchObject({ id: "me", kind: "me" });
    expect(cast.town.find(g => g.id === "me")).toBeUndefined();
  });

  it("makes a few neighbours, caps the real people, and picks the same ones every time", () => {
    expect(buildCast({ me, others: [] }).town.length).toBe(MIN_TOWN);
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 60));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.town.filter(g => g.real).length).toBe(MAX_REAL);
    expect(a.town.map(g => g.id)).toEqual(b.town.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has Joseph, Mary and two teachers, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.joseph).toMatchObject({ kind: "joseph", name: "Joseph" });
    expect(cast.mary).toMatchObject({ kind: "mary", name: "Mary" });
    expect(cast.teachers.map(t => t.kind)).toEqual(["teacher", "teacher"]);
    expect(new Set(cast.teachers.map(t => t.id)).size).toBe(2);
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid, Joseph his square, and the teachers grey beards", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
    expect(normLook(cast.joseph.look, 70).item).toBe(SQUARE);
    cast.teachers.forEach(t => {
      expect(normLook(t.look, 70).hairColor).toBe(5);
      expect(normLook(t.look, 70).beard).toBeGreaterThan(0);
    });
  });

  it("draws everyone, holding the hammer, the staff and the scroll too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG({ ...c.look, item: 0 }, 70);
      [HAMMER, STAFF, SCROLL].forEach(item => {
        const holding = fullSVG({ ...c.look, item }, 70);
        expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
        expect(holding).not.toMatch(/undefined|NaN|\[object|null/);
        expect(strip(holding), c.name).not.toBe(strip(plain));
      });
    });
  });
});

describe("what people say in Nazareth", () => {
  const roles = ["guest", "joseph", "mary", "teacher"];

  it("has something to say for every role in every part", () => {
    roles.forEach(r =>
      PARTS.forEach(p => {
        for (let seed = 0; seed < 8; seed++) {
          const line = lineFor(r, p, seed);
          expect(line, `${r} ${p}`).toBeTruthy();
          expect(line).not.toMatch(/undefined|NaN|null/);
        }
      })
    );
  });

  it("varies what the town says, and copes with an unknown role or part", () => {
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "home", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("mary", "lost", -5)).toBeTruthy();
  });
});

describe("the sound in Nazareth", () => {
  it("has a mood and a murmur for every part of the story", () => {
    PARTS.forEach(p => {
      const m = MOODS[p];
      expect(m, p).toBeTruthy();
      expect(m.bpm).toBeGreaterThan(40);
      expect(m.bpm).toBeLessThan(160);
      expect(m.density).toBeGreaterThan(0);
      expect(m.low).toBeLessThan(m.high);
      expect(m.timbrel).toBe(false);
      expect(MURMUR[p], p).toBeGreaterThan(0);
    });
    // the court is the stillest part, and the journey the liveliest
    expect(MOODS.found.bpm).toBeLessThan(MOODS.home.bpm);
    expect(MOODS.feast.bpm).toBeGreaterThan(MOODS.home.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["plane", "tie", "calling", "found"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["plane", "tie", "calling", "found", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});
