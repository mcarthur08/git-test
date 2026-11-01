import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import { PORTRAIT, LANDSCAPE, LAYOUTS, layoutFor } from "./layout.js";
import { PARTS, MS, STORY, directorMachine } from "./story.js";
import { buildCast, everyone, BETHANY_DAY, ALABASTER, MIN_TOWN, MAX_REAL, FAMILY } from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { MOODS, MURMUR, voices, GAPS, soundConfig } from "./sound.js";
import { SCENES, sceneOf, partText } from "../play/registry.js";
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { normLook } from "../look.js";
import { fullSVG } from "../full.js";
import { createSound } from "../cana/sound.js";

// John 11 and 12 of the Bible text the app ships, which the story is taken from
const JOHN = JSON.parse(readFileSync(resolve(process.cwd(), "public/kjv/John.json"), "utf8"));
const CHAPTER = { 11: JOHN[10], 12: JOHN[11] };
const verse = ref => {
  const [c, v] = ref.split(" ")[1].split(":");
  return CHAPTER[c][+v - 1];
};
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

afterEach(() => vi.useRealTimers());

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s village", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    mouth: [L.MOUTH],
    push: [L.PUSH],
    risen: [L.RISEN],
    loose: [L.LOOSE],
    mourn: L.MOURN,
    door: [L.DOOR],
    seats: L.SEATS,
    mary: [L.MARY],
    pour: [L.POUR],
    light: L.LIGHT_PATH,
    wander: L.WANDER_SPOTS
  });

  it("is walled round the edge, and blocks the hills, the grave, the house and the table", () => {
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
    expect(free({ x: L.WORLD.w / 2, y: L.RIDGE_Y - 20 })).toBe(false);
    [L.TOMB, L.HOUSE, L.TABLE].forEach(r =>
      expect(free({ x: r.x + r.w / 2, y: r.y + r.h / 2 })).toBe(false)
    );
  });

  it("puts the grave and the house on the hill side, and the table on the open ground", () => {
    expect(L.TOMB.y).toBeLessThan(L.RIDGE_Y);
    expect(L.TOMB.x + L.TOMB.w).toBeLessThan(L.HOUSE.x);
    expect(L.TABLE.y).toBeGreaterThan(L.HOUSE.y + L.HOUSE.h);
    // the mouth of the grave is under its rock, and the door under the house
    expect(L.MOUTH.x).toBeGreaterThan(L.TOMB.x);
    expect(L.MOUTH.x).toBeLessThan(L.TOMB.x + L.TOMB.w);
    expect(L.DOOR.x).toBeGreaterThan(L.HOUSE.x);
    expect(L.DOOR.x).toBeLessThan(L.HOUSE.x + L.HOUSE.w);
  });

  it("has four places to mourn, six seats and a light that goes from the road to the grave to the table", () => {
    expect(L.MOURN.length).toBe(4);
    expect(L.SEATS.length).toBe(6);
    expect(L.LIGHT_PATH.length).toBe(3);
    expect(L.LIGHT_PATH[1].x).toBeLessThan(L.TOMB.x + L.TOMB.w + 60);
    expect(L.LIGHT_PATH[2].x).toBeLessThan(L.TABLE.x);
    expect(L.LIGHT_PATH[2].x).toBeGreaterThan(L.TOMB.x + L.TOMB.w);
  });

  it("keeps every place someone is meant to stand on free floor inside the village", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.RIDGE_Y);
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
    // from the grave to the table, and from the door to the seats
    expect(find(L.RISEN, L.SEATS[0])).not.toBeNull();
    expect(find(L.DOOR, L.SEATS[2])).not.toBeNull();
  });
});

describe("choosing a village", () => {
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

describe("the story of Lazarus and the supper", () => {
  it("has the five parts, each with Scripture and a time (the last stays)", () => {
    expect(PARTS).toEqual(["grave", "stone", "forth", "supper", "anoint"]);
    PARTS.forEach(p => {
      expect(STORY[p].quotes.length, p).toBeGreaterThan(0);
      expect(STORY[p].ref, p).toMatch(/^John 1[12]:/);
    });
    PARTS.slice(0, -1).forEach(p => expect(MS[p], p).toBeGreaterThan(1000));
  });

  it("quotes John 11 and 12 word for word from the KJV the app ships", () => {
    PARTS.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^John 1[12]:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("tells its verses in the order of the Gospel, raising Lazarus before the supper", () => {
    const refs = PARTS.flatMap(p => STORY[p].quotes.map(q => q[0]));
    expect(refs).toEqual([
      "John 11:32",
      "John 11:35",
      "John 11:38",
      "John 11:39",
      "John 11:41",
      "John 11:43",
      "John 11:44",
      "John 12:1",
      "John 12:2",
      "John 12:3"
    ]);
  });

  it("says the words of the passage word for word", () => {
    const all = [...CHAPTER[11], ...CHAPTER[12]];
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
    expect(dir.getSnapshot().value).toBe("grave");
    PARTS.slice(1).forEach((next, i) => {
      vi.advanceTimersByTime(MS[PARTS[i]]);
      expect(dir.getSnapshot().value).toBe(next);
    });
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("anoint");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("grave");
    PARTS.slice(1).forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "SKIP" });
    expect(dir.getSnapshot().value).toBe("anoint");
    dir.stop();
  });
});

describe("the cast at Bethany", () => {
  const player = (id, n) => ({ id, alias: id, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 50 } };

  it("finds Bethany as the stop of the supper, with the alabaster jar as its item", () => {
    const stop = STOPS.find(s => s.place === "Bethany");
    expect(BETHANY_DAY).toBe(65);
    expect(stop.keepsake).toBe("alabaster");
    expect(UNLOCK.item[ALABASTER][1]).toBe("alabaster");
  });

  it("brings in the other players who have reached Bethany, and nobody who has not", () => {
    const cast = buildCast({
      me,
      others: [player("a", 70), player("b", 65), player("c", 64), player("d", 3), me]
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
    const many = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 70));
    const a = buildCast({ me, others: many });
    const b = buildCast({ me, others: [...many].reverse() });
    expect(a.town.filter(g => g.real).length).toBe(MAX_REAL);
    expect(a.town.map(g => g.id)).toEqual(b.town.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has Mary, Martha and Lazarus, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.family.map(d => d.name)).toEqual(["Mary", "Martha", "Lazarus"]);
    expect(cast.family.map(d => d.kind)).toEqual(FAMILY);
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives everyone a look that is valid, with the sisters women and Lazarus a man", () => {
    const cast = buildCast({ me, others: [player("a", 70)] });
    everyone(cast).forEach(c => expect(normLook(c.look, 70).g).toBe(c.look.g));
    const [mary, martha, lazarus] = cast.family;
    expect(mary.look.g).toBe("f");
    expect(martha.look.g).toBe("f");
    expect(lazarus.look.g).toBe("m");
  });

  it("draws everyone, holding the alabaster jar too, without a missing value", () => {
    const cast = buildCast({ me, others: [] });
    everyone(cast).forEach(c => {
      const plain = fullSVG(c.look, 70);
      const holding = fullSVG({ ...c.look, item: ALABASTER }, 70);
      expect(plain).not.toMatch(/undefined|NaN|\[object|null/);
      expect(strip(holding), c.name).not.toBe(strip(plain));
    });
  });
});

describe("what people say at Bethany", () => {
  const roles = ["guest", "mary", "martha", "lazarus"];

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

  it("varies what the neighbours say, and copes with an unknown role or part", () => {
    const said = new Set(Array.from({ length: 12 }, (_, s) => lineFor("guest", "grave", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("mary", "stone", -5)).toBeTruthy();
  });
});

describe("the sound at Bethany", () => {
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
    // the grave is the slowest part, and Lazarus coming out the liveliest
    PARTS.filter(p => p !== "grave").forEach(p =>
      expect(MOODS.grave.bpm).toBeLessThan(MOODS[p].bpm)
    );
    PARTS.filter(p => p !== "forth").forEach(p =>
      expect(MOODS.forth.bpm).toBeGreaterThan(MOODS[p].bpm)
    );
  });

  it("has its own sounds, each with a gap so they do not pile up", () => {
    ["stoneRoll", "unwrap", "risen", "anointing"].forEach(n => {
      expect(typeof voices[n], n).toBe("function");
      expect(GAPS[n], n).toBeGreaterThan(0);
    });
    expect(soundConfig.extra).toBe(voices);
  });

  it("starts as a sound the scene can use, and is quiet without Web Audio", () => {
    const quiet = createSound({ Ctx: null, ...soundConfig });
    ["stoneRoll", "unwrap", "risen", "anointing", "phase"].forEach(n =>
      expect(() => quiet[n]()).not.toThrow()
    );
  });
});

// These need the scene to be registered (lib/play/registry.js) and its stop to name it (lib/data.js)
describe.skipIf(!SCENES.bethany)("the scene as the map sees it", () => {
  it("is found from its stop and described for the screen", () => {
    const stop = STOPS.find(s => s.scene === "bethany");
    const def = sceneOf(stop);
    expect(stop.place).toBe("Bethany");
    expect(def).toBe(SCENES.bethany);
    expect(def.title).toBe("Six days before the passover");
    expect(def.parts).toEqual(PARTS);
    PARTS.forEach(p => {
      expect(def.steps[p], p).toBeTruthy();
      expect(partText("bethany", p).length).toBeGreaterThan(10);
    });
    expect(def.actions.map(a => a.run)).toEqual([
      "rollStone",
      "looseHim",
      "pourOintment",
      "greetNearest"
    ]);
  });
});
