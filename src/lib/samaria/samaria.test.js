import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import { buildCast, everyone, SAMARIA_DAY, BUCKET, JAR, MIN_TOWN, MAX_REAL } from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { SCENES, sceneOf, partText } from "../play/registry.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// The Bible text the app ships, which the story is taken from
const book = name =>
  JSON.parse(readFileSync(resolve(process.cwd(), `public/kjv/${name}.json`), "utf8"));
const LUKE9 = book("Luke")[8];
const JOHN4 = book("John")[3];
const verse = ref => {
  const [name, cv] = ref.split(/ (?=\d)/);
  return (name === "Luke" ? LUKE9 : JOHN4)[+cv.split(":")[1] - 1];
};
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s plain", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    draw: L.DRAW_SPOTS,
    woman: [L.WOMAN_SPOT],
    gate: [L.GATE],
    light: L.LIGHT_PATH,
    gather: L.GATHER_SPOTS,
    wander: L.WANDER_SPOTS,
    // the sixth and later share a place, a little behind
    behind: L.GATHER_SPOTS.map(g => ({ x: g.x + 20, y: g.y + 14 }))
  });

  it("is walled round the edge, blocks the far hills and the well, and leaves the plain open", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.SKY_Y - 20 })).toBe(false);
    expect(free({ x: L.WELL.x + L.WELL.w / 2, y: L.WELL.y + L.WELL.h / 2 })).toBe(false);
    expect(free({ x: L.SPAWN.x, y: L.SPAWN.y })).toBe(true);
  });

  it("has four places to draw water from, all beside the well, and the woman's place near it", () => {
    expect(L.DRAW_SPOTS.length).toBe(4);
    const cx = L.WELL.x + L.WELL.w / 2;
    const cy = L.WELL.y + L.WELL.h / 2;
    [...L.DRAW_SPOTS, L.WOMAN_SPOT].forEach(s => {
      expect(Math.hypot(s.x - cx, s.y - cy)).toBeLessThan(130);
    });
    // the woman's waterpot is left beside her
    expect(L.WOMAN_SPOT.x - 14).toBeGreaterThan(L.WELL.x + L.WELL.w);
  });

  it("brings the light in from the left, to the well, and out to a crowd of five places", () => {
    expect(L.LIGHT_PATH.length).toBe(3);
    expect(L.LIGHT_PATH[0].x).toBeLessThan(L.LIGHT_PATH[1].x);
    L.LIGHT_PATH.forEach(p => expect(p.y).toBeGreaterThan(L.SKY_Y));
    expect(L.GATHER_SPOTS.length).toBe(5);
    expect(L.GATE.y).toBeGreaterThan(L.SKY_Y);
    expect(L.GATE.y).toBeLessThan(L.SKY_Y + 60);
  });

  it("keeps every place someone is meant to stand on free floor inside the plain", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.SKY_Y);
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
    // the woman from the gate to the well, and back to the gate from the well
    expect(find(L.GATE, L.WOMAN_SPOT)).not.toBeNull();
    expect(find(L.WOMAN_SPOT, L.GATE)).not.toBeNull();
  });
});

describe("choosing a plain", () => {
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

describe("the story at Jacob's well", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["road", "well", "living", "tell", "believe"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(partText("samaria", p).length).toBeGreaterThan(20);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Luke 9:51 and John 4 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^(Luke 9:51|John 4:\d+)$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells Luke 9:51 first and then the verses of John 4 in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual([
      "Luke 9:51",
      ...[4, 6, 7, 10, 14, 15, 28, 29, 30, 39].map(v => `John 4:${v}`)
    ]);
  });

  it("says the words of the passage word for word", () => {
    const all = [...LUKE9, ...JOHN4];
    SCRIPTURE_LINES.forEach(line => {
      expect(
        all.some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // anything said that is long enough to be a quotation is one of those
    Object.keys(LINES).forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          const bare = l.replace(/[.!?]$/, "");
          if (all.some(v => v.includes(bare))) {
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
    expect(dir.getSnapshot().value).toBe("road");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("believe");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("road");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("believe");
    dir.stop();
  });
});

describe("the cast at the well", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds Samaria as the stop of the well, with the well bucket and the water jar in the items", () => {
    const stop = STOPS.find(s => s.scene === "samaria");
    expect(stop.place).toBe("Samaria");
    expect(SAMARIA_DAY).toBe(54);
    expect(stop.keepsake).toBe("bucket");
    expect(UNLOCK.item[BUCKET][1]).toBe("bucket");
    expect(UNLOCK.item[JAR][1]).toBe("jar");
  });

  it("brings in the other players who have reached Samaria, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 60), player("b", 54), player("c", 53), player("d", 3), me]
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

  it("has the woman of Samaria, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.woman).toMatchObject({ id: "woman", kind: "woman" });
    expect(cast.woman.name).toMatch(/woman of Samaria/);
    expect(cast.woman.look.g).toBe("f");
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
  });

  it("draws everyone, holding the bucket and the jar too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      [BUCKET, JAR].forEach(item => {
        const holding = fullSVG({ ...c.look, item }, 70);
        expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
        expect(strip(holding), c.name).not.toBe(strip(plain));
      });
    });
  });
});

describe("what people say at the well", () => {
  const roles = ["guest", "woman"];

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
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "road", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("woman", "well", -5)).toBeTruthy();
  });
});

describe("the sound at the well", () => {
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
    // the living water is the stillest part, and the woman running to the town the liveliest
    expect(MOODS.living.bpm).toBeLessThan(MOODS.well.bpm);
    expect(MOODS.tell.bpm).toBeGreaterThan(MOODS.road.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["draw", "pour", "living", "setDown"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["draw", "pour", "living", "setDown", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});

describe("the scene as the map sees it", () => {
  it("is found from its stop and described for the screen", () => {
    const stop = STOPS.find(s => s.scene === "samaria");
    const def = sceneOf(stop);
    expect(def).toBe(SCENES.samaria);
    expect(def.title).toBe("Living water");
    expect(def.parts).toEqual(PARTS);
    PARTS.forEach(p => expect(def.steps[p], p).toBeTruthy());
    expect(def.actions.map(a => a.run)).toEqual([
      "drawWater",
      "giveDrink",
      "goTell",
      "greetNearest"
    ]);
    expect(def.enter).toMatch(/well/);
  });
});
