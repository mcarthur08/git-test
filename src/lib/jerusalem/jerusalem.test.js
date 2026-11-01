import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import {
  buildCast,
  everyone,
  JERUSALEM_DAY,
  CUP,
  LOAVES,
  JAR,
  MIN_TOWN,
  MAX_REAL,
  DISCIPLE_IDS
} from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// Luke 22 of the Bible text the app ships, which the story is taken from
const LUKE22 = JSON.parse(readFileSync(resolve(process.cwd(), "public/kjv/Luke.json"), "utf8"))[21];
const verse = ref => LUKE22[+ref.split(":")[1] - 1];
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s upper room", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    seats: L.SEATS,
    entry: L.ENTRY,
    wait: L.WAIT,
    goodman: [L.GOODMAN],
    door: [L.DOOR],
    wander: L.WANDER_SPOTS,
    // beside each place, where you stand to hand someone the cup or the bread
    beside: L.SEATS.map(s => ({ x: s.x - 26, y: s.y + 3 }))
  });

  it("is walled round the edge, blocks the back wall, the table and the jar", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.WALL_Y - 20 })).toBe(false);
    expect(free({ x: L.TABLE.x + L.TABLE.w / 2, y: L.TABLE.y + L.TABLE.h / 2 })).toBe(false);
    expect(free({ x: L.JAR.x + L.JAR.w / 2, y: L.JAR.y + L.JAR.h / 2 })).toBe(false);
  });

  it("lays eight places on the table, four down each side, with the plate on the cloth", () => {
    expect(L.SEATS.length).toBe(8);
    const t = L.TABLE;
    L.SEATS.forEach((s, i) => {
      expect(s.px, `plate ${i}`).toBeGreaterThan(t.x);
      expect(s.px, `plate ${i}`).toBeLessThan(t.x + t.w);
      expect(s.py, `plate ${i}`).toBeGreaterThan(t.y);
      expect(s.py, `plate ${i}`).toBeLessThan(t.y + t.h);
      expect([1, -1]).toContain(s.face);
    });
    const spots = new Set(L.SEATS.map(s => `${s.x},${s.y}`));
    expect(spots.size).toBe(8);
  });

  it("brings the light in at the door and to the head of the table, nearer the first places than the last", () => {
    const [door, head] = L.LIGHT_PATH;
    expect(door.y).toBeLessThan(head.y + 60);
    const d = s => Math.hypot(s.x - head.x, s.y - head.y);
    expect(d(L.SEATS[0])).toBeLessThan(d(L.SEATS[7]));
    expect(d(L.SEATS[1])).toBeLessThan(d(L.SEATS[6]));
  });

  it("keeps every place someone is meant to stand on free floor inside the room", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.WALL_Y);
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
    // Peter and John from the door to a place, and the others from where they wait
    expect(find(L.ENTRY[0], L.SEATS[7])).not.toBeNull();
    expect(find(L.WAIT[0], L.SEATS[0])).not.toBeNull();
  });
});

describe("choosing a room", () => {
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

describe("the story of the passover", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["prepare", "gather", "cup", "bread", "supper"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(STORY[p].quotes.map(q => q[1]).join(" ").length).toBeGreaterThan(20);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Luke 22 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^Luke 22:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells the room made ready, the supper and the cup and bread, in the order of the verses", () => {
    const verses = PARTS.flatMap(p => STORY[p].quotes.map(q => +q[0].split(":")[1]));
    expect(verses).toEqual([8, 12, 14, 15, 17, 19, 20]);
    expect(verses).toEqual([...verses].sort((a, b) => a - b));
  });

  it("says the words of the passage word for word", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        LUKE22.some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // anything said that is long enough to be a quotation is one of those
    Object.keys(LINES).forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          const bare = l.replace(/[.!?]$/, "");
          if (LUKE22.some(v => v.includes(bare))) {
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
    expect(dir.getSnapshot().value).toBe("prepare");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("supper");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("prepare");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("supper");
    dir.stop();
  });
});

describe("the cast in the upper room", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds Jerusalem as the stop of the passover, with the cup, the loaves and the jar in the items", () => {
    const stop = STOPS.find(s => s.place === "Jerusalem");
    expect(stop.title).toBe("The Passover");
    expect(JERUSALEM_DAY).toBe(70);
    expect(UNLOCK.item[CUP][1]).toBe("cup");
    expect(UNLOCK.item[LOAVES][1]).toBe("loaves");
    expect(UNLOCK.item[JAR][1]).toBe("jar");
  });

  it("brings in the other players who have reached Jerusalem, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 70), player("b", 71), player("c", 69), player("d", 3), me]
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

  it("makes fellow disciples, caps the real people, and picks the same ones every time", () => {
    expect(buildCast({ me, others: [] }).town.length).toBe(MIN_TOWN);
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 70));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.town.filter(g => g.real).length).toBe(MAX_REAL);
    expect(a.town.map(g => g.id)).toEqual(b.town.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a place at the table for every disciple and every guest, and no more", () => {
    [[], Array.from({ length: 20 }, (_, i) => player(`p${i}`, 70))].forEach(others => {
      const cast = buildCast({ me, others });
      expect(cast.town.length + cast.disciples.length).toBe(PORTRAIT.SEATS.length);
      expect(cast.town.length + cast.disciples.length).toBe(LANDSCAPE.SEATS.length);
    });
  });

  it("has Peter, John, Andrew and James, and the goodman of the house, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.disciples.map(d => d.name)).toEqual(["John", "Peter", "Andrew", "James"]);
    expect(cast.disciples.map(d => d.kind)).toEqual(DISCIPLE_IDS);
    expect(cast.goodman).toMatchObject({ kind: "goodman", name: "The goodman" });
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid", () => {
    const cast = buildCast({ me, others: [player("a", 70)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
  });

  it("draws everyone, holding the cup, the bread and the jar too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      [CUP, LOAVES, JAR].forEach(item => {
        const holding = fullSVG({ ...c.look, item }, 70);
        expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
        expect(strip(holding), c.name).not.toBe(strip(plain));
      });
    });
  });
});

describe("what people say in the upper room", () => {
  const roles = ["guest", "peter", "john", "andrew", "james", "goodman"];

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

  it("varies what the guests say, and copes with an unknown role or part", () => {
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "gather", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("peter", "bread", -5)).toBeTruthy();
  });
});

describe("the sound in the upper room", () => {
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
    // it slows as the cup and the bread come, and is stillest at the end
    expect(MOODS.cup.bpm).toBeLessThan(MOODS.prepare.bpm);
    expect(MOODS.supper.bpm).toBeLessThanOrEqual(MOODS.bread.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["place", "pour", "brake", "arrive", "remember"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["place", "pour", "brake", "arrive", "remember", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});
