import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import {
  buildCast,
  everyone,
  JERICHO_DAY,
  PURSE,
  MIN_CROWD,
  MAX_REAL,
  POOR_COUNT
} from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { SCENES, sceneOf, partText } from "../play/registry.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// Luke 19 of the Bible text the app ships, which the story is taken from
const LUKE19 = JSON.parse(readFileSync(resolve(process.cwd(), "public/kjv/Luke.json"), "utf8"))[18];
const verse = ref => LUKE19[+ref.split(":")[1] - 1];
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s street", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const doorStep = { x: L.HOUSE_DOOR.x, y: L.HOUSE_DOOR.y + 26 };
  const places = () => ({
    spawn: [L.SPAWN],
    zacchaeus: [L.ZACCHAEUS_SPOT],
    doorStep: [doorStep],
    crowd: L.CROWD_SPOTS,
    poor: L.POOR_SPOTS,
    receive: L.RECEIVE_SPOTS,
    light: L.LIGHT_PATH,
    wander: L.WANDER_SPOTS,
    tree: [L.TREE.base, L.TREE.seat]
  });

  it("is walled round the edge, with the houses along the back and the trunk of the sycamore blocked", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.WALL_Y - 20 })).toBe(false);
    const t = L.TREE.trunk;
    expect(free({ x: t.x + t.w / 2, y: t.y + t.h / 2 })).toBe(false);
  });

  it("puts the sycamore on the far side of the road, and the road across the middle", () => {
    expect(L.ROAD.y).toBeGreaterThan(L.WALL_Y);
    expect(L.ROAD.y + L.ROAD.h).toBeLessThan(L.WORLD.h);
    expect(L.TREE.base.y).toBeGreaterThan(L.TREE.trunk.y);
    expect(L.TREE.lift).toBeGreaterThan(20);
    // the light comes in from the left and goes right, ending beside the tree
    const xs = L.LIGHT_PATH.map(p => p.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    expect(Math.abs(L.LIGHT_PATH[3].x - L.TREE.base.x)).toBeLessThan(40);
    L.LIGHT_PATH.forEach(p => {
      expect(p.y).toBeGreaterThan(L.ROAD.y);
      expect(p.y).toBeLessThan(L.ROAD.y + L.ROAD.h);
    });
  });

  it("has places for a crowd, four poor people and four who gather to be given to", () => {
    expect(L.CROWD_SPOTS.length).toBeGreaterThanOrEqual(MIN_CROWD);
    expect(L.POOR_SPOTS.length).toBe(POOR_COUNT);
    expect(L.RECEIVE_SPOTS.length).toBe(POOR_COUNT);
    expect(new Set(L.CROWD_SPOTS.map(p => `${p.x},${p.y}`)).size).toBe(L.CROWD_SPOTS.length);
  });

  it("keeps every place someone is meant to stand on free floor inside the street", () => {
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
    // Zacchaeus to the tree, and from the tree to his door
    expect(find(L.ZACCHAEUS_SPOT, L.TREE.base)).not.toBeNull();
    expect(find(L.TREE.base, doorStep)).not.toBeNull();
    expect(find(doorStep, L.POOR_SPOTS[0])).not.toBeNull();
  });
});

describe("choosing a street", () => {
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

describe("the story of Zacchaeus", () => {
  it("has the six parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["street", "press", "climb", "called", "murmur", "restore"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(partText("jericho", p).length).toBeGreaterThan(20);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Luke 19 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^Luke 19:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells every verse of the passage, 1 to 10, in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual(Array.from({ length: 10 }, (_, i) => `Luke 19:${i + 1}`));
  });

  it("says the words of the passage word for word", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        LUKE19.some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // anything said that is long enough to be a quotation is one of those
    ["zacchaeus", "crowd", "poor"].forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          const bare = l.replace(/[.!?]$/, "");
          if (LUKE19.some(v => v.includes(bare))) {
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
    expect(dir.getSnapshot().value).toBe("street");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("restore");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("street");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("restore");
    dir.stop();
  });
});

describe("the cast in the street", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 70 } };

  it("finds Jericho as the stop of Zacchaeus, with the purse in the items", () => {
    const stop = STOPS.find(s => s.scene === "jericho");
    expect(stop.place).toBe("Jericho");
    expect(JERICHO_DAY).toBe(60);
    expect(UNLOCK.item[PURSE][1]).toBe("purse");
  });

  it("brings in the other players who have reached Jericho, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 65), player("b", 60), player("c", 59), player("d", 3), me]
    });
    expect(
      cast.crowd
        .filter(g => g.real)
        .map(g => g.id)
        .sort()
    ).toEqual(["a", "b"]);
    expect(cast.me).toMatchObject({ id: "me", kind: "me" });
    expect(cast.crowd.find(g => g.id === "me")).toBeUndefined();
  });

  it("makes a crowd of at least fourteen, caps the real people, and has four poor", () => {
    expect(buildCast({ me, others: [] }).crowd.length).toBe(MIN_CROWD);
    const many = Array.from({ length: 40 }, (_, i) => player(`p${i}`, 70));
    const cast = buildCast({ me, others: many });
    expect(cast.crowd.filter(g => g.real).length).toBe(MAX_REAL);
    expect(cast.poor.length).toBe(POOR_COUNT);
  });

  it("picks the same people every time, with a different id for each", () => {
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 70));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.crowd.map(g => g.id)).toEqual(b.crowd.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has Zacchaeus small and quick, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.zacchaeus).toMatchObject({ kind: "zacchaeus", name: "Zacchaeus" });
    expect(cast.zacchaeus.scale).toBeLessThan(1);
    expect(cast.zacchaeus.speed).toBeGreaterThan(1);
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid", () => {
    const cast = buildCast({ me, others: [player("a", 70)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
  });

  it("draws everyone, holding the purse too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      const holding = fullSVG({ ...c.look, item: PURSE }, 70);
      expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
      expect(strip(holding), c.name).not.toBe(strip(plain));
    });
  });
});

describe("what people say in the street", () => {
  const roles = ["guest", "zacchaeus", "poor"];

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

  it("varies what the crowd says, and copes with an unknown role or part", () => {
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "press", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("zacchaeus", "press", -5)).toBeTruthy();
  });

  it("has Zacchaeus say what the passage says he said, and the crowd murmur as it says they did", () => {
    expect(lineFor("zacchaeus", "restore")).toMatch(/^Behold, Lord, the half of my goods/);
    expect(LINES.crowd.murmur[0]).toMatch(
      /^That he was gone to be guest with a man that is a sinner/
    );
  });
});

describe("the sound in the street", () => {
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
    // the crowd is hushed and the music slowest when he is called
    expect(MURMUR.called).toBeLessThan(MURMUR.street);
    expect(MOODS.called.bpm).toBeLessThan(MOODS.street.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["rustle", "call", "coin"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["rustle", "call", "coin", "phase"].forEach(n => expect(() => quiet[n]()).not.toThrow());
  });
});

describe("the scene as the map sees it", () => {
  it("is found from its stop and described for the screen", () => {
    const stop = STOPS.find(s => s.scene === "jericho");
    const def = sceneOf(stop);
    expect(def).toBe(SCENES.jericho);
    expect(def.title).toBe("Zacchaeus in the sycamore");
    expect(def.parts).toEqual(PARTS);
    PARTS.forEach(p => expect(def.steps[p], p).toBeTruthy());
    expect(def.actions.map(a => a.run)).toEqual([
      "climbTree",
      "giveCoin",
      "welcome",
      "greetNearest"
    ]);
    expect(def.enter).toMatch(/street/);
  });
});
