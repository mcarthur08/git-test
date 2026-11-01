import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import { buildCast, everyone, WILDERNESS_DAY, STONE, MIN_TOWN, MAX_REAL } from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES, PRAYERS } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
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
])("the %s wilderness", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  // where a stone is set down: at the side of the cairn nearer to where it lay
  const cairnSide = s => ({ x: L.CAIRN.x + (s.x > L.CAIRN.x ? 14 : -14), y: L.CAIRN.y + 14 });
  const places = () => ({
    spawn: [L.SPAWN],
    stones: L.STONE_SPOTS,
    cairn: [L.CAIRN, ...L.STONE_SPOTS.map(cairnSide)],
    pray: L.PRAY_SPOTS,
    light: L.LIGHT_PATH,
    wander: L.WANDER_SPOTS
  });

  it("is walled round the edge, blocks the far hills, the pinnacle and the mountain, and leaves the sand open", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.TOP_Y - 20 })).toBe(false);
    expect(free({ x: L.TOWER.x + L.TOWER.w / 2, y: L.TOWER.y + L.TOWER.h / 2 })).toBe(false);
    expect(free({ x: L.MOUNT.x + L.MOUNT.w / 2, y: L.MOUNT.y + L.MOUNT.h / 2 })).toBe(false);
    expect(free({ x: L.WORLD.w / 2, y: L.WORLD.h - 60 })).toBe(true);
  });

  it("puts the pinnacle and the mountain on the far edge of the sand, one each side of the middle", () => {
    expect(L.MOUNT.x + L.MOUNT.w).toBeLessThan(L.TOWER.x);
    expect(L.MOUNT.x + L.MOUNT.w / 2).toBeLessThan(L.WORLD.w / 2);
    expect(L.TOWER.x + L.TOWER.w / 2).toBeGreaterThan(L.WORLD.w / 2);
    [L.TOWER, L.MOUNT].forEach(b => {
      expect(b.y).toBeGreaterThan(L.TOP_Y);
      // each one rises above the sand into the sky
      expect(b.y + b.h - b.rise).toBeLessThan(L.TOP_Y);
    });
  });

  it("has four stones, a cairn to stack them on, three rocks to pray on and a path of five for the light", () => {
    expect(L.STONE_SPOTS.length).toBe(4);
    expect(L.PRAY_SPOTS.length).toBe(3);
    expect(L.LIGHT_PATH.length).toBe(PARTS.length);
    // the light comes in from the left, and stops at the foot of the pinnacle and then the mountain
    expect(L.LIGHT_PATH[0].x).toBeLessThan(L.LIGHT_PATH[1].x);
    expect(Math.abs(L.LIGHT_PATH[2].x - (L.TOWER.x + L.TOWER.w / 2))).toBeLessThan(L.TOWER.w);
    expect(L.LIGHT_PATH[2].y).toBeGreaterThan(L.TOWER.y + L.TOWER.h);
    expect(Math.abs(L.LIGHT_PATH[3].x - (L.MOUNT.x + L.MOUNT.w / 2))).toBeLessThan(L.MOUNT.w);
    expect(L.LIGHT_PATH[3].y).toBeGreaterThan(L.MOUNT.y + L.MOUNT.h);
  });

  it("keeps every place someone is meant to stand on free floor inside the picture", () => {
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
    // a stone to the cairn, whichever side it is set down on
    L.STONE_SPOTS.forEach(s => expect(find(s, cairnSide(s))).not.toBeNull());
  });
});

describe("choosing a wilderness", () => {
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

describe("the story of the temptation", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["fast", "stones", "pinnacle", "mountain", "angels"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(STORY[p].ref, p).toMatch(/^Matthew 4:/);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
    expect(MS.angels).toBeUndefined();
  });

  it("quotes Matthew 4 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^Matthew 4:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells every verse of the passage, 1 to 11, in order", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual(Array.from({ length: 11 }, (_, i) => `Matthew 4:${i + 1}`));
  });

  it("says the words of the passage word for word, and gives you three answers to say", () => {
    SCRIPTURE_LINES.forEach(line => {
      expect(
        MATT4.some(v => v.includes(line)),
        line
      ).toBe(true);
    });
    // the three you can say are each an answer Jesus gave
    expect(SCRIPTURE_LINES.slice(0, 3).map(l => MATT4.findIndex(v => v.includes(l)) + 1)).toEqual([
      4, 7, 10
    ]);
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
    expect(dir.getSnapshot().value).toBe("fast");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("angels");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("fast");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("angels");
    dir.stop();
  });
});

describe("the cast in the wilderness", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds the Wilderness as the stop of the temptation, with the stone in the items", () => {
    const stop = STOPS.find(s => s.place === "The Wilderness");
    expect(WILDERNESS_DAY).toBe(stop.day);
    expect(WILDERNESS_DAY).toBe(18);
    expect(stop.keepsake).toBe("stone");
    expect(UNLOCK.item[STONE][1]).toBe("stone");
  });

  it("brings in the other players who have reached the Wilderness, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 60), player("b", 18), player("c", 17), player("d", 3), me]
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

  it("copes with no player of its own, and draws no one as Jesus or the tempter", () => {
    const cast = buildCast({ me: null, others: [] });
    expect(cast.me).toBeNull();
    expect(everyone(cast).length).toBe(MIN_TOWN);
    everyone(buildCast({ me, others: [player("a", 60)] })).forEach(c =>
      expect(c.name).not.toMatch(/jesus|devil|satan|tempter/i)
    );
  });

  it("gives everyone a look that is valid", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
  });

  it("draws everyone, holding the stone too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      const holding = fullSVG({ ...c.look, item: STONE }, 70);
      expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
      expect(strip(holding), c.name).not.toBe(strip(plain));
    });
  });
});

describe("what people say in the wilderness", () => {
  it("has something to say in every part, for a guest or an unknown role", () => {
    ["guest", "me", "stranger"].forEach(r =>
      PARTS.forEach(p => {
        for (let seed = 0; seed < 8; seed++) {
          const line = lineFor(r, p, seed);
          expect(line, `${r} ${p}`).toBeTruthy();
          expect(line).not.toMatch(/undefined|NaN|null/);
        }
      })
    );
  });

  it("varies what is said, and copes with an unknown part or a negative seed", () => {
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "fast", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("guest", "nowhere", 3)).toBeTruthy();
    expect(lineFor("guest", "stones", -5)).toBeTruthy();
  });

  it("has prayers to say, which are not quotations", () => {
    expect(PRAYERS.length).toBeGreaterThan(1);
    PRAYERS.forEach(p => expect(MATT4.some(v => v.includes(p.replace(/[.!?]$/, "")))).toBe(false));
  });
});

describe("the sound in the wilderness", () => {
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
    // the temptation is the stillest music, and the angels the liveliest
    expect(MOODS.stones.bpm).toBeLessThan(MOODS.fast.bpm);
    expect(MOODS.angels.bpm).toBeGreaterThan(MOODS.mountain.bpm);
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["stone", "pray", "scripture", "angels"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["stone", "pray", "scripture", "angels", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});
