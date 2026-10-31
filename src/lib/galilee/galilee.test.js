import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import { buildCast, everyone, GALILEE_DAY, OAR, MAX_REAL } from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { SCENES, sceneOf, partText } from "../play/registry.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// Mark 4 of the Bible text the app ships, which the story is taken from
const MARK4 = JSON.parse(readFileSync(resolve(process.cwd(), "public/kjv/Mark.json"), "utf8"))[3];
const MATT8 = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/kjv/Matthew.json"), "utf8")
)[7];
const verse = ref => MARK4[+ref.split(":")[1] - 1];
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s boat", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const onDeck = p =>
    p.x > L.DECK.x && p.x < L.DECK.x + L.DECK.w && p.y > L.DECK.y && p.y < L.DECK.y + L.DECK.h;
  const places = () => ({
    spawn: [L.SPAWN],
    crew: L.CREW_SPOTS,
    wake: L.WAKE_SPOTS,
    puddles: L.PUDDLES,
    wander: L.WANDER_SPOTS
  });

  it("is walled round the deck, and blocks the mast and the pillow", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.MAST.x + L.MAST.w / 2, y: L.MAST.y + L.MAST.h / 2 })).toBe(false);
    expect(free({ x: L.PILLOW.x + L.PILLOW.w / 2, y: L.PILLOW.y + L.PILLOW.h / 2 })).toBe(false);
    expect(free({ x: L.DECK.x - 20, y: L.DECK.y + L.DECK.h / 2 })).toBe(false);
  });

  it("keeps the deck inside the picture, with the pillow and mast on it", () => {
    const { DECK, WORLD } = L;
    expect(DECK.x).toBeGreaterThan(0);
    expect(DECK.y).toBeGreaterThan(0);
    expect(DECK.x + DECK.w).toBeLessThan(WORLD.w);
    expect(DECK.y + DECK.h).toBeLessThan(WORLD.h);
    [L.MAST, L.PILLOW].forEach(r => {
      expect(onDeck({ x: r.x + r.w / 2, y: r.y + r.h / 2 })).toBe(true);
    });
  });

  it("has a place for four crew, three at the pillow and twelve puddles", () => {
    expect(L.CREW_SPOTS.length).toBe(4);
    expect(L.WAKE_SPOTS.length).toBe(3);
    expect(L.PUDDLES.length).toBe(12);
    expect(L.LITTLE_SHIPS.length).toBeGreaterThan(1);
    // the other little ships are out on the water, not on the boat
    L.LITTLE_SHIPS.forEach(s => expect(onDeck(s)).toBe(false));
  });

  it("keeps every place someone is meant to stand on free floor on the deck", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(onDeck(p), `${group} ${i} on deck`).toBe(true);
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
    // from one end of the boat to the other, and from the crew to the pillow
    expect(find(L.CREW_SPOTS[0], L.PUDDLES[11])).not.toBeNull();
    expect(find(L.PUDDLES[0], L.WAKE_SPOTS[2])).not.toBeNull();
  });
});

describe("choosing a boat", () => {
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

describe("the story of the storm", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["evening", "storm", "fear", "calm", "marvel"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(partText("galilee", p).length).toBeGreaterThan(20);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes Mark 4 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^Mark 4:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells every verse of the passage, 35 to 41, in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual([35, 36, 37, 38, 39, 40, 41].map(v => `Mark 4:${v}`));
  });

  it("says the words of the passages word for word", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        [...MARK4, ...MATT8].some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // the crew's own words that are long enough to be a quotation are one of those
    ["peter", "andrew", "james", "john"].forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          if (MARK4.some(v => v.includes(l.replace(/[.!?]$/, "")))) {
            expect(
              SCRIPTURE_LINES.some(s => s.includes(l.replace(/[.!?]$/, ""))),
              l
            ).toBe(true);
          }
        })
      )
    );
  });

  it("runs the parts in order on its own, and calms the sea as soon as he is woken", () => {
    vi.useFakeTimers();
    const dir = createActor(directorMachine).start();
    expect(dir.getSnapshot().value).toBe("evening");
    vi.advanceTimersByTime(MS.evening);
    expect(dir.getSnapshot().value).toBe("storm");
    vi.advanceTimersByTime(MS.storm);
    expect(dir.getSnapshot().value).toBe("fear");
    // waking him before the fear has run out
    vi.advanceTimersByTime(3000);
    dir.send({ type: "WOKEN" });
    expect(dir.getSnapshot().value).toBe("calm");
    vi.advanceTimersByTime(MS.calm);
    expect(dir.getSnapshot().value).toBe("marvel");
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("marvel");
    dir.stop();
  });

  it("moves on by itself if nobody wakes him, ignores waking him at the wrong time, and can be skipped", () => {
    vi.useFakeTimers();
    const dir = createActor(directorMachine).start();
    dir.send({ type: "WOKEN" });
    expect(dir.getSnapshot().value).toBe("evening");
    vi.advanceTimersByTime(MS.evening + MS.storm + MS.fear);
    expect(dir.getSnapshot().value).toBe("calm");
    dir.send({ type: "REPLAY" });
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("marvel");
    dir.stop();
  });
});

describe("the cast in the boat", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds the Sea of Galilee as the stop of the storm, with the oar as its keepsake", () => {
    const stop = STOPS.find(s => s.scene === "galilee");
    expect(stop.place).toBe("Sea of Galilee");
    expect(GALILEE_DAY).toBe(36);
    expect(stop.keepsake).toBe("oar");
    expect(UNLOCK.item[OAR][1]).toBe("oar");
  });

  it("brings in the other players who have reached the Sea of Galilee, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 60), player("b", 36), player("c", 35), player("d", 3), me]
    });
    expect(cast.crew.map(g => g.id).sort()).toEqual(["a", "b"]);
    expect(cast.me).toMatchObject({ id: "me", kind: "me" });
    expect(cast.crew.find(g => g.id === "me")).toBeUndefined();
  });

  it("caps the other players so the boat is not crowded, and picks the same ones every time", () => {
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 60));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.crew.length).toBe(MAX_REAL);
    expect(a.crew.map(g => g.id)).toEqual(b.crew.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(buildCast({ me, others: [] }).crew.length).toBe(0);
  });

  it("has Peter, Andrew, James and John, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.disciples.map(d => d.name)).toEqual(["Peter", "Andrew", "James", "John"]);
    expect(cast.disciples.map(d => d.kind)).toEqual(["peter", "andrew", "james", "john"]);
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
  });

  it("draws everyone, holding the oar too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      const holding = fullSVG({ ...c.look, item: OAR }, 70);
      expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
      expect(strip(holding), c.name).not.toBe(strip(plain));
    });
  });
});

describe("what people say in the boat", () => {
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

  it("varies what the others say, and copes with an unknown role or part", () => {
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "storm", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("peter", "storm", -5)).toBeTruthy();
  });

  it("has Peter ask what the passage says they asked", () => {
    expect(lineFor("peter", "fear")).toBe("Master, carest thou not that we perish?");
    expect(lineFor("john", "marvel")).toMatch(/^What manner of man is this/);
  });
});

describe("the sound in the boat", () => {
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
    // the wind is loudest in the fear, and almost gone in the great calm, when the music is also slowest
    expect(MURMUR.fear).toBeGreaterThan(MURMUR.storm);
    expect(MURMUR.calm).toBeLessThan(MURMUR.evening);
    expect(MOODS.calm.bpm).toBeLessThan(MOODS.evening.bpm);
    expect(MOODS.storm.bpm).toBeGreaterThan(MOODS.evening.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["wave", "thunder", "splash", "hush"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["wave", "thunder", "splash", "hush", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});

describe("the scene as the map sees it", () => {
  it("is found from its stop and described for the screen", () => {
    const stop = STOPS.find(s => s.scene === "galilee");
    const def = sceneOf(stop);
    expect(def).toBe(SCENES.galilee);
    expect(def.title).toBe("Peace, be still");
    expect(def.parts).toEqual(PARTS);
    PARTS.forEach(p => expect(def.steps[p], p).toBeTruthy());
    expect(def.actions.map(a => a.run)).toEqual(["bail", "wakeHim", "holdOn", "greetNearest"]);
    expect(def.enter).toMatch(/boat/);
  });
});
