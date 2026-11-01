import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import { buildCast, everyone, BETHSAIDA_DAY, LOAVES, MIN_CROWD, MAX_REAL } from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { SCENES, sceneOf, partText } from "../play/registry.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// the chapters of the Bible text the app ships that the story is taken from
const book = name =>
  JSON.parse(readFileSync(resolve(process.cwd(), "public/kjv", name + ".json"), "utf8"));
const LUKE9 = book("Luke")[8];
const JOHN6 = book("John")[5];
const verse = ref => {
  const [b, cv] = ref.split(" ");
  const [, v] = cv.split(":");
  return (b === "Luke" ? LUKE9 : JOHN6)[+v - 1];
};
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s hillside", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    seats: L.SEATS,
    store: L.STORE,
    leftovers: L.LEFTOVERS,
    wander: L.WANDER_SPOTS,
    disciples: L.DISCIPLE_SPOTS,
    lad: [L.LAD_SPOT],
    rockUse: [L.ROCK_USE]
  });

  it("is walled round the edge and blocks the hill, the rock and the trees", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.ROCK.x + L.ROCK.w / 2, y: L.ROCK.y + L.ROCK.h / 2 })).toBe(false);
    L.TREES.forEach(t => expect(free({ x: t.x + t.w / 2, y: t.y + t.h / 2 })).toBe(false));
    expect(free({ x: L.WORLD.w / 2, y: L.HILL_Y - 20 })).toBe(false);
  });

  it("has five companies, each a ring of eight seats", () => {
    expect(L.GROUPS.length).toBe(5);
    expect(L.SEATS.length).toBe(40);
    L.GROUPS.forEach(g => expect(L.SEATS.filter(s => s.group === g.id).length).toBe(8));
    expect(new Set(L.SEATS.map(s => s.id)).size).toBe(40);
    // the seats of one company are all near it, and the companies do not run into each other
    L.SEATS.forEach(s => {
      const g = L.GROUPS[s.group];
      expect(Math.hypot((s.x - g.x) / g.rx, (s.y - g.y) / g.ry)).toBeLessThan(1.1);
    });
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        const a = L.GROUPS[i];
        const b = L.GROUPS[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y), `${i}/${j}`).toBeGreaterThan(a.rx * 1.6);
      }
    }
  });

  it("has baskets to set out for the feeding, and twelve places for the fragments", () => {
    expect(L.STORE.length).toBe(10);
    expect(L.LEFTOVERS.length).toBe(12);
    expect(L.DISCIPLE_SPOTS.length).toBe(4);
  });

  it("keeps every place someone is meant to stand on free floor inside the hillside", () => {
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
    // from a seat to the store and to a heap of fragments, as the disciples do
    expect(find(L.SEATS[0], L.STORE[0])).not.toBeNull();
    expect(find(L.STORE[0], L.GROUPS[4])).not.toBeNull();
    expect(find(L.LEFTOVERS[0], L.LEFTOVERS[11])).not.toBeNull();
  });

  it("keeps the store, the rock and the companies in a sensible order down the hill", () => {
    L.GROUPS.forEach(g => expect(g.y).toBeLessThan(L.ROCK.y));
    L.STORE.forEach(s => expect(s.y).toBeGreaterThan(L.ROCK.y - 20));
  });
});

describe("choosing a hillside", () => {
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

describe("the story at Bethsaida", () => {
  it("has the six parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["day", "give", "sit", "bless", "feed", "gather"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(partText("bethsaida", p).length).toBeGreaterThan(20);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Luke 9 and John 6 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^(Luke 9|John 6):\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("says the words of the passages word for word", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        [...LUKE9, ...JOHN6].some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // anything said that is long enough to be a quotation is one of those
    ["andrew", "philip", "disciple", "lad"].forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          if ([...LUKE9, ...JOHN6].some(v => v.includes(l))) {
            expect(
              SCRIPTURE_LINES.some(s => s.includes(l)),
              l
            ).toBe(true);
          }
        })
      )
    );
  });

  it("runs the parts in order on its own, and moves on as soon as every company is fed", () => {
    vi.useFakeTimers();
    const dir = createActor(directorMachine).start();
    expect(dir.getSnapshot().value).toBe("day");
    ["give", "sit", "bless", "feed"].forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "ALL_SERVED" });
    expect(dir.getSnapshot().value).toBe("gather");
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("gather");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("day");
    dir.stop();
  });

  it("moves on by itself if nobody finishes feeding, and can be skipped or replayed", () => {
    vi.useFakeTimers();
    const dir = createActor(directorMachine).start();
    vi.advanceTimersByTime(MS.day + MS.give + MS.sit + MS.bless);
    expect(dir.getSnapshot().value).toBe("feed");
    vi.advanceTimersByTime(MS.feed);
    expect(dir.getSnapshot().value).toBe("gather");
    dir.send({ type: "REPLAY" });
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("gather");
    dir.stop();
  });
});

describe("the cast at Bethsaida", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds Bethsaida as the stop of the feeding, with the basket of loaves as its keepsake", () => {
    const stop = STOPS.find(s => s.scene === "bethsaida");
    expect(stop.place).toBe("Bethsaida");
    expect(BETHSAIDA_DAY).toBe(42);
    expect(stop.keepsake).toBe("loaves");
    expect(UNLOCK.item[LOAVES][1]).toBe("loaves");
  });

  it("brings in the other players who have reached Bethsaida, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 60), player("b", 42), player("c", 41), player("d", 3), me]
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

  it("makes a crowd of at least a dozen, and caps the real people", () => {
    expect(buildCast({ me, others: [] }).crowd.length).toBe(MIN_CROWD);
    const many = Array.from({ length: 40 }, (_, i) => player(`p${i}`, 60));
    const cast = buildCast({ me, others: many });
    expect(cast.crowd.filter(g => g.real).length).toBe(MAX_REAL);
    expect(cast.crowd.length).toBe(MAX_REAL);
  });

  it("picks the same people every time, with a different id for each", () => {
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 60));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.crowd.map(g => g.id)).toEqual(b.crowd.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has Andrew, Philip, two more disciples and a lad, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.disciples.map(d => d.kind)).toEqual(["andrew", "philip", "disciple", "disciple"]);
    expect(cast.disciples.map(d => d.name).slice(0, 2)).toEqual(["Andrew", "Philip"]);
    expect(cast.lad.kind).toBe("lad");
    expect(cast.lad.scale).toBeLessThan(1);
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid, and the lad no beard", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
    expect(normLook(cast.lad.look, 70).beard).toBe(0);
  });

  it("draws everyone, holding the basket of loaves too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      const holding = fullSVG({ ...c.look, item: LOAVES }, 70);
      expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
      expect(strip(holding), c.name).not.toBe(strip(plain));
    });
  });
});

describe("what people say at Bethsaida", () => {
  const roles = ["guest", "andrew", "philip", "disciple", "lad"];

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
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "feed", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("andrew", "day", -5)).toBeTruthy();
  });

  it("has Philip and Andrew say what the passage says they said", () => {
    expect(lineFor("philip", "day")).toMatch(/^Two hundred pennyworth/);
    expect(lineFor("andrew", "give")).toMatch(/^There is a lad here/);
  });
});

describe("the sound at Bethsaida", () => {
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
    // hushed for the blessing, slowest of the music
    expect(MURMUR.bless).toBeLessThan(MURMUR.day);
    expect(MOODS.bless.bpm).toBeLessThan(MOODS.day.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["bless", "breadBreak", "thud", "pickUp"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["bless", "breadBreak", "thud", "pickUp", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});

describe("the scene as the map sees it", () => {
  it("is found from its stop and described for the screen", () => {
    const stop = STOPS.find(s => s.scene === "bethsaida");
    const def = sceneOf(stop);
    expect(def).toBe(SCENES.bethsaida);
    expect(def.title).toBe("Feeding the five thousand");
    expect(def.parts).toEqual(PARTS);
    PARTS.forEach(p => expect(def.steps[p], p).toBeTruthy());
    expect(def.actions.map(a => a.run)).toEqual([
      "sitDown",
      "passBread",
      "gatherBasket",
      "greetNearest"
    ]);
    expect(def.enter).toMatch(/hillside/);
    expect(sceneOf({ place: "Nowhere" })).toBeNull();
  });
});
