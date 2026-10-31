import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import { buildCast, everyone, JORDAN_DAY, MIN_TOWN, MAX_REAL } from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { SCENES, sceneOf, partText } from "../play/registry.js";
import { STOPS } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// Matthew 3 of the Bible text the app ships, which the story is taken from
const MATT3 = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/kjv/Matthew.json"), "utf8")
)[2];
const verse = ref => MATT3[+ref.split(":")[1] - 1];

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s river", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    john: [L.JOHN],
    wade: L.WADE_SPOTS,
    listen: L.LISTEN_SPOTS,
    look: L.LOOK_SPOTS,
    wander: L.WANDER_SPOTS
  });

  it("is walled round the edge, blocks the deep water and the willow, and lets people wade in the shallows", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.RIVER_Y - 20 })).toBe(false);
    expect(free({ x: L.TREE.x + L.TREE.w / 2, y: L.TREE.y + L.TREE.h / 2 })).toBe(false);
    expect(free({ x: L.WORLD.w / 2, y: (L.RIVER_Y + L.BANK_Y) / 2 })).toBe(true);
  });

  it("puts the shallows between the river and the bank, with John and the places to wade in them", () => {
    expect(L.RIVER_Y).toBeLessThan(L.BANK_Y);
    expect(L.JOHN.y).toBeGreaterThan(L.RIVER_Y);
    expect(L.JOHN.y).toBeLessThan(L.BANK_Y);
    L.WADE_SPOTS.forEach(s => {
      expect(s.y).toBeGreaterThan(L.RIVER_Y);
      expect(s.y).toBeLessThan(L.BANK_Y);
    });
    L.LISTEN_SPOTS.forEach(s => expect(s.y).toBeGreaterThan(L.BANK_Y));
    L.LOOK_SPOTS.forEach(s => expect(s.y).toBeGreaterThan(L.BANK_Y));
  });

  it("has four places to wade, and a way for the light that comes in from the left, into the water, and out", () => {
    expect(L.WADE_SPOTS.length).toBe(4);
    expect(L.LIGHT_PATH.length).toBe(4);
    expect(L.LIGHT_PATH[0].x).toBeLessThan(L.LIGHT_PATH[1].x);
    // it goes into the shallows beside John, and comes out on to the bank
    expect(L.LIGHT_PATH[2].y).toBeGreaterThan(L.RIVER_Y);
    expect(L.LIGHT_PATH[2].y).toBeLessThan(L.BANK_Y);
    expect(Math.abs(L.LIGHT_PATH[2].x - L.JOHN.x)).toBeLessThan(L.WORLD.w / 3);
    expect(L.LIGHT_PATH[0].y).toBeGreaterThan(L.BANK_Y);
    expect(L.LIGHT_PATH[1].y).toBeGreaterThan(L.BANK_Y);
    expect(L.LIGHT_PATH[3].y).toBeGreaterThan(L.BANK_Y);
  });

  it("keeps every place someone is meant to stand on free floor inside the picture", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.RIVER_Y);
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
    // from the bank to the water by John
    expect(find(L.LISTEN_SPOTS[0], L.WADE_SPOTS[0])).not.toBeNull();
  });
});

describe("choosing a river", () => {
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

describe("the story of the baptism", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["come", "forbid", "baptized", "opened", "voice"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(STORY[p].ref, p).toMatch(/^Matthew 3:/);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Matthew 3 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^Matthew 3:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells every verse of the passage, 13 to 17, in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual([13, 14, 15, 16, 16, 17].map(v => `Matthew 3:${v}`));
  });

  it("says the words of the passage word for word", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        MATT3.some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // anything said that is long enough to be a quotation is one of those
    Object.keys(LINES).forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          const bare = l.replace(/[.!?]$/, "");
          if (MATT3.some(v => v.includes(bare))) {
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
    expect(dir.getSnapshot().value).toBe("come");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("voice");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("come");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("voice");
    dir.stop();
  });
});

describe("the cast at the river", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds the River Jordan as the stop of the baptism, with the dove as its keepsake", () => {
    const stop = STOPS.find(s => s.place === "River Jordan");
    expect(stop.title).toBe("Baptized in the Jordan");
    expect(JORDAN_DAY).toBe(12);
    expect(stop.keepsake).toBe("dove");
  });

  it("brings in the other players who have reached the Jordan, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 60), player("b", 12), player("c", 11), player("d", 3), me]
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

  it("makes a few pilgrims, caps the real people, and picks the same ones every time", () => {
    expect(buildCast({ me, others: [] }).town.length).toBe(MIN_TOWN);
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 60));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.town.filter(g => g.real).length).toBe(MAX_REAL);
    expect(a.town.map(g => g.id)).toEqual(b.town.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has John who baptizes, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.baptist).toMatchObject({ kind: "baptist", name: "John" });
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid, and John long hair and a long beard", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
    expect(normLook(cast.baptist.look, 70).hair).toBe(1);
    expect(normLook(cast.baptist.look, 70).beard).toBe(4);
  });

  it("draws everyone without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c =>
      expect(fullSVG(c.look, 70), c.name).not.toMatch(/undefined|NaN|\[object|null/)
    );
  });
});

describe("what people say at the river", () => {
  const roles = ["guest", "baptist"];

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

  it("varies what the people say, and copes with an unknown role or part", () => {
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "come", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("baptist", "forbid", -5)).toBeTruthy();
  });
});

describe("the sound at the river", () => {
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
    // the baptism is the stillest part, and the opened heavens the liveliest
    expect(MOODS.baptized.bpm).toBeLessThan(MOODS.come.bpm);
    expect(MOODS.opened.bpm).toBeGreaterThan(MOODS.come.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["splash", "dip", "dove", "voice"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["splash", "dip", "dove", "voice", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});

describe("the scene as the map sees it", () => {
  it("is found from its stop and described for the screen", () => {
    const stop = STOPS.find(s => s.place === "River Jordan");
    const def = sceneOf(stop);
    expect(def).toBe(SCENES.jordan);
    expect(def.title).toBe("Baptized in the Jordan");
    expect(def.parts).toEqual(PARTS);
    PARTS.forEach(p => expect(def.steps[p], p).toBeTruthy());
    PARTS.forEach(p => expect(partText("jordan", p).length).toBeGreaterThan(20));
    expect(def.actions.map(a => a.run)).toEqual(["wade", "listen", "lookUp", "greetNearest"]);
    expect(def.enter).toMatch(/river|water|Jordan/i);
  });
});
