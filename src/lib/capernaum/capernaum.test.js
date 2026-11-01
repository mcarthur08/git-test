import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import {
  buildCast,
  everyone,
  CAPERNAUM_DAY,
  NET,
  FISH,
  MIN_TOWN,
  MAX_REAL,
  FOLLOWERS
} from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { SCENES, sceneOf, partText } from "../play/registry.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// Matthew 4 of the Bible text the app ships, which the story is taken from
const MATT4 = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/kjv/Matthew.json"), "utf8")
)[3];
const verse = ref => MATT4[+ref.split(":")[1] - 1];
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s shore", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    nets: L.NET_SPOTS,
    fishers: L.FISHERS,
    mend: L.MEND_SPOTS,
    follow: L.FOLLOW_SPOTS,
    wander: L.WANDER_SPOTS,
    trail: [2, 3].flatMap(i =>
      [0, 1, 2].map(j => ({
        x: L.LIGHT_PATH[i].x - 30 + j * 22,
        y: L.LIGHT_PATH[i].y + 30 + j * 10
      }))
    )
  });

  it("is walled round the edge, blocks the deep water and the boat, and lets people wade in the shallows", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.SEA_Y - 20 })).toBe(false);
    expect(free({ x: L.BOAT.x + L.BOAT.w / 2, y: L.BOAT.y + L.BOAT.h / 2 })).toBe(false);
    expect(free({ x: L.WORLD.w / 2, y: (L.SEA_Y + L.SAND_Y) / 2 })).toBe(true);
  });

  it("puts the shallows between the sea and the sand, with the boat on the sand", () => {
    expect(L.SEA_Y).toBeLessThan(L.SAND_Y);
    expect(L.BOAT.y).toBeGreaterThan(L.SAND_Y);
    L.NET_SPOTS.forEach(s => {
      expect(s.y).toBeGreaterThan(L.SEA_Y);
      expect(s.y).toBeLessThan(L.SAND_Y);
    });
    L.MEND_SPOTS.forEach(s => expect(s.y).toBeGreaterThan(L.SAND_Y));
  });

  it("has four places to cast from, two for the fishermen, four nets to mend and four to follow", () => {
    expect(L.NET_SPOTS.length).toBe(4);
    expect(L.FISHERS.length).toBe(2);
    expect(L.MEND_SPOTS.length).toBe(4);
    expect(L.FOLLOW_SPOTS.length).toBe(FOLLOWERS.length);
    // the light comes in from the left, goes to the fishers, the boat, and on to the right
    expect(L.LIGHT_PATH[0].x).toBeLessThan(L.LIGHT_PATH[1].x);
    expect(L.LIGHT_PATH[3].x).toBeGreaterThan(L.LIGHT_PATH[2].x);
    L.LIGHT_PATH.forEach(p => expect(p.y).toBeGreaterThan(L.SAND_Y));
  });

  it("keeps every place someone is meant to stand on free floor inside the shore", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.SEA_Y);
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
    // the fishermen from the water to the boat, and the boat to the end of the shore
    expect(find(L.FISHERS[0], L.MEND_SPOTS[0])).not.toBeNull();
    expect(find(L.MEND_SPOTS[0], L.FOLLOW_SPOTS[0])).not.toBeNull();
  });
});

describe("choosing a shore", () => {
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

describe("the story of the four fishermen", () => {
  it("has the four parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["shore", "call", "boat", "leave"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(partText("capernaum", p).length).toBeGreaterThan(20);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Matthew 4 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^Matthew 4:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells every verse of the passage, 18 to 22, in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual([18, 19, 20, 21, 22].map(v => `Matthew 4:${v}`));
  });

  it("says the words of the passage word for word", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        MATT4.some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // anything said that is long enough to be a quotation is one of those
    Object.keys(LINES).forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          const bare = l.replace(/[.!?]$/, "");
          if (MATT4.some(v => v.includes(bare))) {
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
    expect(dir.getSnapshot().value).toBe("shore");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("leave");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("shore");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("leave");
    dir.stop();
  });
});

describe("the cast on the shore", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds Capernaum as the stop of the call, with the net and the catch of fish in the items", () => {
    const stop = STOPS.find(s => s.scene === "capernaum");
    expect(stop.place).toBe("Capernaum");
    expect(CAPERNAUM_DAY).toBe(30);
    expect(stop.keepsake).toBe("fish");
    expect(UNLOCK.item[NET][1]).toBe("net");
    expect(UNLOCK.item[FISH][1]).toBe("fish");
  });

  it("brings in the other players who have reached Capernaum, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 60), player("b", 30), player("c", 29), player("d", 3), me]
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

  it("has Peter, Andrew, James and John, and their father Zebedee, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.fishers.map(d => d.name)).toEqual(["Peter", "Andrew", "James", "John"]);
    expect(cast.fishers.map(d => d.kind)).toEqual(FOLLOWERS);
    expect(cast.zebedee).toMatchObject({ kind: "zebedee", name: "Zebedee" });
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid, and Zebedee a grey beard", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
    expect(normLook(cast.zebedee.look, 70).hairColor).toBe(5);
    expect(normLook(cast.zebedee.look, 70).beard).toBeGreaterThan(0);
  });

  it("draws everyone, holding the net and the fish too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      [NET, FISH].forEach(item => {
        const holding = fullSVG({ ...c.look, item }, 70);
        expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
        expect(strip(holding), c.name).not.toBe(strip(plain));
      });
    });
  });
});

describe("what people say on the shore", () => {
  const roles = ["guest", "peter", "andrew", "james", "john", "zebedee"];

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
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "shore", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("peter", "boat", -5)).toBeTruthy();
  });
});

describe("the sound on the shore", () => {
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
    // the call is the stillest part, and the walking at the end the liveliest
    expect(MOODS.call.bpm).toBeLessThan(MOODS.shore.bpm);
    expect(MOODS.leave.bpm).toBeGreaterThan(MOODS.shore.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["cast", "catchFish", "mended", "follow"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["cast", "catchFish", "mended", "follow", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});

describe("the scene as the map sees it", () => {
  it("is found from its stop and described for the screen", () => {
    const stop = STOPS.find(s => s.scene === "capernaum");
    const def = sceneOf(stop);
    expect(def).toBe(SCENES.capernaum);
    expect(def.title).toBe("Fishers of men");
    expect(def.parts).toEqual(PARTS);
    PARTS.forEach(p => expect(def.steps[p], p).toBeTruthy());
    expect(def.actions.map(a => a.run)).toEqual(["castNet", "mendNet", "follow", "greetNearest"]);
    expect(def.enter).toMatch(/shore/);
  });
});
