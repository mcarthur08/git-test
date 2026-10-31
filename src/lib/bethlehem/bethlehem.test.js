import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import {
  buildCast,
  everyone,
  BETHLEHEM_DAY,
  STAFF,
  STAR,
  MIN_TOWN,
  MAX_REAL,
  SHEPHERDS
} from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { SCENES, sceneOf } from "../play/registry.js";
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
])("the %s field", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    holy: L.HOLY,
    shepherds: L.SHEPHERD_SPOTS,
    visit: L.VISIT_SPOTS,
    sheep: L.SHEEP_SPOTS,
    flock: L.FLOCK_SPOTS,
    wander: L.WANDER_SPOTS
  });

  it("is walled round the edge, blocks the sky and hills, the stable and the fire", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.HILL_Y - 20 })).toBe(false);
    expect(free({ x: L.STABLE.x + L.STABLE.w / 2, y: L.STABLE.y + L.STABLE.h / 2 })).toBe(false);
    expect(free({ x: L.FIRE.x + L.FIRE.w / 2, y: L.FIRE.y + L.FIRE.h / 2 })).toBe(false);
  });

  it("puts the field below the hills, the manger in the stable, and the light over the field and then the stable", () => {
    expect(L.STABLE.y).toBeGreaterThan(L.HILL_Y);
    expect(L.MANGER.x).toBeGreaterThan(L.STABLE.x);
    expect(L.MANGER.x).toBeLessThan(L.STABLE.x + L.STABLE.w);
    expect(L.MANGER.y).toBeGreaterThan(L.STABLE.y);
    expect(L.MANGER.y).toBeLessThanOrEqual(L.STABLE.y + L.STABLE.h);
    // the stable is on the other side of the field from the fire
    expect(L.STABLE.x).toBeGreaterThan(L.FIRE.x + L.FIRE.w);
    expect(L.GLORY.length).toBe(3);
    expect(L.GLORY[0].y).toBeLessThan(L.HILL_Y);
    expect(L.GLORY[2].x).toBeGreaterThan(L.STABLE.x);
    expect(L.GLORY[2].x).toBeLessThan(L.STABLE.x + L.STABLE.w);
    expect(L.GLORY[2].y).toBeLessThan(L.STABLE.y);
  });

  it("has a place for each shepherd, Mary and Joseph, four to visit from, and a place in the flock for every sheep", () => {
    expect(L.SHEPHERD_SPOTS.length).toBe(SHEPHERDS.length);
    expect(L.HOLY.length).toBe(2);
    expect(L.VISIT_SPOTS.length).toBe(SHEPHERDS.length + 1);
    expect(L.SHEEP_SPOTS.length).toBe(4);
    expect(L.FLOCK_SPOTS.length).toBe(L.SHEEP_SPOTS.length);
    L.VISIT_SPOTS.forEach(p => expect(p.y).toBeGreaterThan(L.STABLE.y + L.STABLE.h));
  });

  it("keeps every place someone is meant to stand on free floor inside the field", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.HILL_Y);
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
    // the shepherds from the fire to the stable, and back to the neighbours
    L.SHEPHERD_SPOTS.forEach((s, i) => {
      expect(find(s, L.VISIT_SPOTS[i]), `shepherd ${i} to the stable`).not.toBeNull();
      expect(find(L.VISIT_SPOTS[i], s), `shepherd ${i} back`).not.toBeNull();
    });
  });
});

describe("choosing a field", () => {
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

describe("the story of the shepherds", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["field", "angel", "host", "haste", "return"]);
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

  it("tells every verse of the passage, 8 to 20, in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual(Array.from({ length: 13 }, (_, i) => `Luke 2:${i + 8}`));
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
    expect(dir.getSnapshot().value).toBe("field");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("return");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("field");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("return");
    dir.stop();
  });
});

describe("the cast in the field", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds Bethlehem as the first stop, with the staff and the star in the items", () => {
    const stop = STOPS.find(s => s.place === "Bethlehem");
    expect(BETHLEHEM_DAY).toBe(0);
    expect(stop.keepsake).toBe("star");
    expect(UNLOCK.item[STAFF][1]).toBe("staff");
    expect(UNLOCK.item[STAR][1]).toBe("star");
  });

  it("brings in the other players as fellow shepherds, whatever day they are on, but not you twice", () => {
    const cast = buildCast({ me, others: [player("a", 60), player("b", 0), player("c", 3), me] });
    expect(
      cast.town
        .filter(g => g.real)
        .map(g => g.id)
        .sort()
    ).toEqual(["a", "b", "c"]);
    expect(cast.me).toMatchObject({ id: "me", kind: "me" });
    expect(cast.town.find(g => g.id === "me")).toBeUndefined();
  });

  it("makes a few more shepherds, caps the real people, and picks the same ones every time", () => {
    expect(buildCast({ me, others: [] }).town.length).toBe(MIN_TOWN);
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 60));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.town.filter(g => g.real).length).toBe(MAX_REAL);
    expect(a.town.map(g => g.id)).toEqual(b.town.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has three shepherds with staffs, Mary and Joseph, and draws no one as an angel or as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.shepherds.map(d => d.kind)).toEqual(["shepherd", "shepherd", "shepherd"]);
    expect(cast.shepherds.map(d => d.id)).toEqual(SHEPHERDS);
    cast.shepherds.forEach(d => expect(normLook(d.look, 70).item).toBe(STAFF));
    expect(cast.mary).toMatchObject({ kind: "mary", name: "Mary" });
    expect(cast.joseph).toMatchObject({ kind: "joseph", name: "Joseph" });
    expect(normLook(cast.mary.look, 70).g).toBe("f");
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus|angel/i));
  });

  it("gives everyone a look that is valid, and the oldest shepherd a grey beard", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
    expect(normLook(cast.shepherds[0].look, 70).hairColor).toBe(5);
    expect(normLook(cast.shepherds[0].look, 70).beard).toBeGreaterThan(0);
  });

  it("draws everyone, with and without the staff, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG({ ...c.look, item: 0 }, 70);
      const holding = fullSVG({ ...c.look, item: STAFF }, 70);
      expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
      expect(holding).not.toMatch(/undefined|NaN|\[object|null/);
      expect(strip(holding), c.name).not.toBe(strip(plain));
    });
  });
});

describe("what people say in the field", () => {
  const roles = ["guest", "shepherd", "mary", "joseph"];

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

  it("varies what the shepherds say, and copes with an unknown role or part", () => {
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "field", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("shepherd", "haste", -5)).toBeTruthy();
  });

  it("has the shepherds sing the song of the host and say where they will go", () => {
    expect(LINES.shepherd.host).toContain("Glory to God in the highest!");
    expect(LINES.shepherd.haste).toContain("Let us now go even unto Bethlehem");
  });
});

describe("the sound in the field", () => {
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
    // the night is the stillest part, and the road to the stable the liveliest
    expect(MOODS.field.bpm).toBeLessThan(MOODS.host.bpm);
    expect(MOODS.haste.bpm).toBeGreaterThan(MOODS.host.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["glory", "praise", "baa", "arrive"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["glory", "praise", "baa", "arrive", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});

describe("the scene as the map sees it", () => {
  it("is found from its stop and described for the screen", () => {
    const stop = STOPS.find(s => s.place === "Bethlehem");
    const def = sceneOf(stop);
    expect(def).toBe(SCENES.bethlehem);
    expect(def.title).toBe("Born in Bethlehem");
    expect(def.parts).toEqual(PARTS);
    PARTS.forEach(p => {
      expect(def.steps[p], p).toBeTruthy();
      expect(def.story[p], p).toBe(STORY[p]);
    });
    expect(def.actions.map(a => a.run)).toEqual(["gatherSheep", "sing", "visit", "greetNearest"]);
    expect(def.enter).toMatch(/field/);
  });
});
