import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import {
  buildCast,
  everyone,
  CAESAREA_DAY,
  STONE,
  KEYS,
  MIN_TOWN,
  MAX_REAL,
  DISCIPLES
} from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// Matthew 16 of the Bible text the app ships, which the story is taken from
const MATT16 = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/kjv/Matthew.json"), "utf8")
)[15];
const verse = ref => MATT16[+ref.split(":")[1] - 1];
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s foot of the cliffs", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    drink: L.SPRING_SPOTS,
    stones: L.STONE_SPOTS,
    build: L.BUILD_SPOTS,
    group: L.GROUP_SPOTS,
    peter: [L.PETER_SPOT],
    wander: L.WANDER_SPOTS
  });

  it("is walled round the edge, and blocks the cliff, the pool and the rock", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.CLIFF_Y - 20 })).toBe(false);
    expect(free({ x: L.SPRING.x + L.SPRING.w / 2, y: L.SPRING.y + L.SPRING.h / 2 })).toBe(false);
    expect(free({ x: L.ROCK.x + L.ROCK.w / 2, y: L.ROCK.y + L.ROCK.h / 2 })).toBe(false);
  });

  it("has the pool at the foot of the cliff and the rock out on the open ground", () => {
    expect(L.SPRING.y).toBeGreaterThan(L.CLIFF_Y);
    expect(L.ROCK.y).toBeGreaterThan(L.SPRING.y + L.SPRING.h);
    L.SPRING_SPOTS.forEach(s => expect(s.y).toBeGreaterThan(L.SPRING.y + L.SPRING.h));
    L.BUILD_SPOTS.forEach(s => expect(s.y).toBeGreaterThan(L.ROCK.y + L.ROCK.h));
  });

  it("has three places to drink, four stones with four places to lay them, and a place for each disciple", () => {
    expect(L.SPRING_SPOTS.length).toBe(3);
    expect(L.STONE_SPOTS.length).toBe(4);
    expect(L.BUILD_SPOTS.length).toBe(4);
    expect(L.GROUP_SPOTS.length).toBe(DISCIPLES.length);
    // the light comes in from the left and ends at the right, always on the ground below the cliff
    expect(L.LIGHT_PATH[0].x).toBeLessThan(L.LIGHT_PATH[1].x);
    expect(L.LIGHT_PATH[3].x).toBeGreaterThan(L.LIGHT_PATH[2].x);
    L.LIGHT_PATH.forEach(p => expect(p.y).toBeGreaterThan(L.CLIFF_Y));
  });

  it("keeps every place someone is meant to stand on free floor inside the picture", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.CLIFF_Y);
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
    // a stone from where it lies to where it is laid, and the disciples to Peter
    L.STONE_SPOTS.forEach((s, i) => expect(find(s, L.BUILD_SPOTS[i])).not.toBeNull());
    expect(find(L.GROUP_SPOTS[0], L.PETER_SPOT)).not.toBeNull();
  });
});

describe("choosing a place", () => {
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

describe("the story of the confession", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["ask", "say", "confess", "rock", "keys"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(STORY[p].quotes.map(q => q[1]).join(" ").length).toBeGreaterThan(20);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Matthew 16 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^Matthew 16:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells every verse of the passage, 13 to 20, in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual([13, 14, 15, 16, 17, 18, 19, 20].map(v => `Matthew 16:${v}`));
  });

  it("says the words of the passage word for word", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        MATT16.some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // anything said that is long enough to be a quotation is one of those
    Object.keys(LINES).forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          const bare = l.replace(/[.!?]$/, "");
          if (MATT16.some(v => v.includes(bare))) {
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
    expect(dir.getSnapshot().value).toBe("ask");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("keys");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("ask");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("keys");
    dir.stop();
  });
});

describe("the cast at the foot of the cliffs", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds Caesarea Philippi as the stop of the confession, with the stone and the keys in the items", () => {
    const stop = STOPS.find(s => s.place === "Caesarea Philippi");
    expect(CAESAREA_DAY).toBe(48);
    expect(stop.keepsake).toBe("keys");
    expect(UNLOCK.item[STONE][1]).toBe("stone");
    expect(UNLOCK.item[KEYS][1]).toBe("keys");
  });

  it("brings in the other players who have reached Caesarea Philippi, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 60), player("b", 48), player("c", 47), player("d", 3), me]
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

  it("makes a few travellers, caps the real people, and picks the same ones every time", () => {
    expect(buildCast({ me, others: [] }).town.length).toBe(MIN_TOWN);
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 60));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.town.filter(g => g.real).length).toBe(MAX_REAL);
    expect(a.town.map(g => g.id)).toEqual(b.town.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has Peter, Andrew, James and John, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.disciples.map(d => d.name)).toEqual(["Peter", "Andrew", "James", "John"]);
    expect(cast.disciples.map(d => d.kind)).toEqual(DISCIPLES);
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
  });

  it("draws everyone, holding the stone and the keys too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      [STONE, KEYS].forEach(item => {
        const holding = fullSVG({ ...c.look, item }, 70);
        expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
        expect(strip(holding), c.name).not.toBe(strip(plain));
      });
    });
  });
});

describe("what people say at the foot of the cliffs", () => {
  const roles = ["guest", "peter", "andrew", "james", "john"];

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
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "ask", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("peter", "rock", -5)).toBeTruthy();
  });
});

describe("the sound at the foot of the cliffs", () => {
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
    // the question is the stillest part, and the giving of the keys the liveliest
    expect(MOODS.confess.bpm).toBeLessThan(MOODS.ask.bpm);
    expect(MOODS.keys.bpm).toBeGreaterThan(MOODS.ask.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["drink", "stone", "confess", "keys"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["drink", "stone", "confess", "keys", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});
