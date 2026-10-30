import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createActor } from "xstate";
import {
  WORLD,
  OBSTACLES,
  JARS,
  CISTERN,
  SEATS,
  DANCE_SPOTS,
  WANDER_SPOTS,
  HEAD_SEATS,
  MARY_SPOT,
  MUSICIAN_SPOTS,
  SPAWN,
  buildGrid,
  tileOf,
  nearestFree,
  makeFinder,
  PORTRAIT,
  LANDSCAPE,
  LAYOUTS,
  layoutFor
} from "./layout.js";
import { PHASES, STORY, phaseText, directorMachine } from "./story.js";
import { personMachine } from "./person.js";
import { buildCast, everyone, CANA_DAY, ITEM, NPC, hash, guestLook } from "./cast.js";
import { LINES, lineFor, SCRIPTURE_LINES } from "./lines.js";
import { normLook } from "../look.js";
import { fullSVG, POSES } from "../full.js";
import { STOPS, UNLOCK } from "../data.js";

// Every figure gets its own random element ids, so two drawings only match once those are left out.
const strip = svg => svg.replace(/(id="|#)[^"')]+/g, "$1");

// chapter 2 of John, from the Bible text the app ships
const JOHN2 = JSON.parse(readFileSync(resolve(process.cwd(), "public/kjv/John.json"), "utf8"))[1];
const verse = ref => JOHN2[+ref.split(":")[1] - 1];

afterEach(() => vi.useRealTimers());

describe("the courtyard", () => {
  const grid = buildGrid();
  const free = p => grid[tileOf(p.x, p.y).ty][tileOf(p.x, p.y).tx] === 0;

  it("is a grid covering the whole hall, with walls round the edge", () => {
    expect(grid.length).toBe(Math.ceil(WORLD.h / WORLD.tile));
    expect(grid[0].length).toBe(Math.ceil(WORLD.w / WORLD.tile));
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.some(row => row.includes(0))).toBe(true);
  });

  it("blocks the tables, the six water pots and the cistern", () => {
    expect(JARS.length).toBe(6);
    JARS.forEach(j => expect(free(j), `jar ${j.i}`).toBe(false));
    expect(OBSTACLES.length).toBeGreaterThan(8);
    expect(grid[tileOf(180, 118).ty][tileOf(180, 118).tx]).toBe(1);
  });

  it("keeps every place someone is meant to stand on free floor", () => {
    const spots = {
      spawn: [SPAWN],
      jars: JARS.map(j => j.pour),
      cistern: [CISTERN.use],
      seats: SEATS,
      dance: DANCE_SPOTS,
      wander: WANDER_SPOTS,
      head: Object.values(HEAD_SEATS),
      mary: [MARY_SPOT],
      musicians: MUSICIAN_SPOTS
    };
    Object.entries(spots).forEach(([name, list]) =>
      list.forEach((p, i) => expect(free(p), `${name} ${i} at ${p.x},${p.y}`).toBe(true))
    );
    expect(new Set(SEATS.map(s => s.id)).size).toBe(SEATS.length);
  });

  it("lets everyone walk from the entrance to every place", () => {
    const find = makeFinder(grid);
    const all = [
      ...JARS.map(j => j.pour),
      CISTERN.use,
      ...SEATS,
      ...DANCE_SPOTS,
      ...WANDER_SPOTS,
      ...Object.values(HEAD_SEATS),
      MARY_SPOT,
      ...MUSICIAN_SPOTS
    ];
    all.forEach(p => {
      const path = find(SPAWN, p);
      expect(path, `to ${p.x},${p.y}`).not.toBeNull();
      expect(path[path.length - 1]).toEqual({ x: p.x, y: p.y });
      // every step lands on free floor
      path.slice(0, -1).forEach(q => expect(free(q)).toBe(true));
    });
    // and back again
    expect(find(CISTERN.use, JARS[5].pour)).not.toBeNull();
  });

  it("walks to the nearest free spot when asked to go somewhere blocked", () => {
    const find = makeFinder(grid);
    const table = { x: 180, y: 118 };
    expect(free(table)).toBe(false);
    const path = find(SPAWN, table);
    expect(path).not.toBeNull();
    expect(free(path[path.length - 1])).toBe(true);
    const near = nearestFree(grid, table.x, table.y);
    expect(grid[near.ty][near.tx]).toBe(0);
  });

  it("goes straight there when already on the spot", () => {
    const find = makeFinder(grid);
    expect(find(SPAWN, SPAWN)).toEqual([{ x: SPAWN.x, y: SPAWN.y }]);
  });
});

describe("the story", () => {
  it("has the five phases, each with Scripture and a time", () => {
    expect(PHASES).toEqual(["feast", "wineRuns", "fillJars", "drawOut", "celebrate"]);
    PHASES.forEach(p => {
      expect(STORY[p].quotes.length).toBeGreaterThan(0);
      expect(phaseText(p).length).toBeGreaterThan(20);
    });
  });

  it("quotes John 2 word for word from the KJV the app ships", () => {
    PHASES.forEach(p =>
      STORY[p].quotes.forEach(([ref, text]) => {
        expect(ref).toMatch(/^John 2:\d+$/);
        expect(verse(ref), `${ref}: ${text}`).toContain(text);
      })
    );
  });

  it("says the words of the passage word for word", () => {
    SCRIPTURE_LINES.forEach(line =>
      expect(
        JOHN2.some(v => v.includes(line.replace(/\.$/, ""))),
        line
      ).toBe(true)
    );
    // every spoken line that quotes the passage is one of those
    const quoted = new Set(SCRIPTURE_LINES.map(l => l.replace(/^…/, "")));
    ["mary", "master"].forEach(role =>
      Object.values(LINES[role]).forEach(set =>
        set.forEach(l => {
          if (JOHN2.some(v => v.includes(l.replace(/^…/, "").replace(/\.$/, "")))) {
            expect(quoted.has(l.replace(/^…/, "")), l).toBe(true);
          }
        })
      )
    );
  });

  it("runs the phases in order on its own, and can be hurried along or replayed", () => {
    vi.useFakeTimers();
    const dir = createActor(directorMachine).start();
    expect(dir.getSnapshot().value).toBe("feast");
    vi.advanceTimersByTime(STORY.feast.ms);
    expect(dir.getSnapshot().value).toBe("wineRuns");
    vi.advanceTimersByTime(STORY.wineRuns.ms);
    expect(dir.getSnapshot().value).toBe("fillJars");
    dir.send({ type: "ALL_FILLED" });
    expect(dir.getSnapshot().value).toBe("drawOut");
    dir.send({ type: "TASTED" });
    expect(dir.getSnapshot().value).toBe("celebrate");
    vi.advanceTimersByTime(600000);
    expect(dir.getSnapshot().value).toBe("celebrate");
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("feast");
    dir.stop();
  });

  it("moves on by itself if nobody finishes the pots or tastes the wine", () => {
    vi.useFakeTimers();
    const dir = createActor(directorMachine).start();
    vi.advanceTimersByTime(STORY.feast.ms + STORY.wineRuns.ms);
    expect(dir.getSnapshot().value).toBe("fillJars");
    vi.advanceTimersByTime(STORY.fillJars.ms);
    expect(dir.getSnapshot().value).toBe("drawOut");
    vi.advanceTimersByTime(STORY.drawOut.ms);
    expect(dir.getSnapshot().value).toBe("celebrate");
    dir.stop();
  });

  it("can skip ahead from any phase and be replayed from any phase", () => {
    vi.useFakeTimers();
    const dir = createActor(directorMachine).start();
    ["wineRuns", "fillJars", "drawOut", "celebrate"].forEach(next => {
      dir.send({ type: "SKIP" });
      expect(dir.getSnapshot().value).toBe(next);
    });
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("feast");
    dir.send({ type: "SKIP" });
    dir.send({ type: "REPLAY" });
    expect(dir.getSnapshot().value).toBe("feast");
    dir.stop();
  });
});

describe("how a guest behaves", () => {
  const make = (extra = {}) => {
    const picks = [];
    const actor = createActor(personMachine, {
      input: {
        idleMs: () => 1000,
        pick: ctx => {
          const goal =
            extra.goal === undefined ? { kind: "wander", x: 10, y: 10, ms: 2000 } : extra.goal;
          picks.push(goal);
          return goal;
        }
      }
    }).start();
    return { actor, picks };
  };

  it("idles, picks something to do, walks there, does it, then idles again", () => {
    vi.useFakeTimers();
    const { actor, picks } = make();
    expect(actor.getSnapshot().value).toBe("idle");
    vi.advanceTimersByTime(1000);
    expect(actor.getSnapshot().value).toBe("walking");
    expect(actor.getSnapshot().context.goal).toEqual(picks[0]);
    actor.send({ type: "ARRIVED" });
    expect(actor.getSnapshot().value).toBe("acting");
    vi.advanceTimersByTime(1999);
    expect(actor.getSnapshot().value).toBe("acting");
    vi.advanceTimersByTime(1);
    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.goal).toBeNull();
    actor.stop();
  });

  it("can be sent somewhere, even part-way through something else", () => {
    vi.useFakeTimers();
    const { actor } = make();
    const goal = { kind: "chat", x: 50, y: 60, ms: 3000 };
    actor.send({ type: "GOAL", goal });
    expect(actor.getSnapshot().value).toBe("walking");
    expect(actor.getSnapshot().context.goal).toEqual(goal);
    const next = { kind: "dance", x: 1, y: 2, ms: 500 };
    actor.send({ type: "GOAL", goal: next });
    expect(actor.getSnapshot().context.goal).toEqual(next);
    actor.send({ type: "ARRIVED" });
    actor.send({ type: "GOAL", goal });
    expect(actor.getSnapshot().value).toBe("walking");
    actor.stop();
  });

  it("goes back to idling when there is nothing to do or the way is blocked", () => {
    vi.useFakeTimers();
    const { actor } = make({ goal: null });
    vi.advanceTimersByTime(1000);
    expect(actor.getSnapshot().value).toBe("idle");
    actor.send({ type: "GOAL", goal: { kind: "wander", x: 1, y: 1, ms: 100 } });
    actor.send({ type: "BLOCKED" });
    expect(actor.getSnapshot().value).toBe("idle");
    actor.send({ type: "GOAL", goal: { kind: "wander", x: 1, y: 1, ms: 100 } });
    actor.send({ type: "ARRIVED" });
    actor.send({ type: "STOP" });
    expect(actor.getSnapshot().value).toBe("idle");
    actor.stop();
  });
});

describe("the cast", () => {
  const player = (id, n, alias = id) => ({ id, alias, look: guestLook(hash(id) % 9), s: { n } });
  const me = { id: "me", alias: "Boaz", look: guestLook(2), s: { n: 30 } };

  it("finds Cana as the stop of the water into wine", () => {
    expect(STOPS.find(s => s.scene === "cana").place).toBe("Cana");
    expect(CANA_DAY).toBe(24);
  });

  it("brings in the other players who have reached Cana, and nobody who has not", () => {
    const others = [player("a", 40), player("b", 24), player("c", 23), player("d", 5), me];
    const cast = buildCast({ me, others });
    const real = cast.guests.filter(g => g.real).map(g => g.id);
    expect(real.sort()).toEqual(["a", "b"]);
    expect(cast.me).toMatchObject({ id: "me", kind: "me", name: "You" });
    expect(cast.guests.find(g => g.id === "me")).toBeUndefined();
  });

  it("fills the courtyard with made-up guests when few players are there, and caps real ones", () => {
    expect(buildCast({ me, others: [] }).guests.length).toBe(6);
    const crowd = Array.from({ length: 30 }, (_, i) => player(`p${i}`, 50));
    const cast = buildCast({ me, others: crowd });
    expect(cast.guests.filter(g => g.real).length).toBe(9);
    expect(cast.guests.length).toBe(9);
  });

  it("picks the same guests every time, and gives everyone a different id", () => {
    const crowd = Array.from({ length: 20 }, (_, i) => player(`p${i}`, 50));
    const a = buildCast({ me, others: crowd });
    const b = buildCast({ me, others: [...crowd].reverse() });
    expect(a.guests.map(g => g.id)).toEqual(b.guests.map(g => g.id));
    const ids = everyone(a).map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the people of the story, and draws no one as Jesus", () => {
    const cast = buildCast({ me, others: [] });
    expect(cast.party.map(p => p.kind)).toEqual(["groom", "bride", "master", "mary"]);
    expect(cast.servants.length).toBe(3);
    expect(cast.musicians.length).toBe(2);
    everyone(cast).forEach(c => expect(c.name).not.toMatch(/jesus/i));
  });

  it("gives every character a look that is valid with everything unlocked", () => {
    const cast = buildCast({ me, others: [player("a", 60)] });
    everyone(cast).forEach(c => {
      const L = normLook(c.look, c.n);
      expect(L.g).toBe(c.look.g);
      if (c.look.item !== undefined) {
        expect(L.item, c.name).toBe(c.look.item);
      }
    });
    expect(normLook(NPC.musicians[0].look, 70).item).toBe(ITEM.harp);
    expect(normLook(NPC.musicians[1].look, 70).item).toBe(ITEM.timbrel);
  });

  it("knows the items it hands out", () => {
    Object.entries(ITEM).forEach(([name, i]) => expect(i, name).toBeGreaterThan(0));
    expect(UNLOCK.item[ITEM.jar][1]).toBe("jar");
    expect(UNLOCK.item[ITEM.cup][1]).toBe("cup");
  });

  it("makes different made-up guests from each other", () => {
    const looks = Array.from({ length: 6 }, (_, i) => JSON.stringify(guestLook(i + 1)));
    expect(new Set(looks).size).toBe(6);
  });
});

describe("what people say", () => {
  const roles = ["guest", "mary", "master", "groom", "bride", "servant", "musician"];

  it("has something to say for every role in every phase", () => {
    roles.forEach(r =>
      PHASES.forEach(p => {
        for (let seed = 0; seed < 8; seed++) {
          const line = lineFor(r, p, seed);
          expect(line, `${r} ${p}`).toBeTruthy();
          expect(line).not.toMatch(/undefined|NaN|null/);
        }
      })
    );
  });

  it("varies what a guest says, and copes with a role or phase it does not know", () => {
    const said = new Set(Array.from({ length: 10 }, (_, s) => lineFor("guest", "celebrate", s)));
    expect(said.size).toBeGreaterThan(3);
    expect(lineFor("stranger", "nowhere", 3)).toBeTruthy();
    expect(lineFor("mary", "feast", -5)).toBeTruthy();
  });

  it("has Mary say what the passage says she said", () => {
    expect(lineFor("mary", "wineRuns", 0)).toBe("They have no wine.");
    expect(lineFor("mary", "wineRuns", 1)).toBe("Whatsoever he saith unto you, do it.");
  });
});

describe("character poses for the scenes", () => {
  const BAD = /undefined|NaN|\[object|null/;

  it("raises an arm for a wave and both arms for a cheer, for a man and a woman", () => {
    ["m", "f"].forEach(g => {
      const idle = fullSVG({ g }, 70);
      Object.keys(POSES).forEach(pose => {
        const svg = fullSVG({ g }, 70, { pose });
        expect(strip(svg), `${g} ${pose}`).not.toBe(strip(idle));
        expect(svg, `${g} ${pose}`).not.toMatch(BAD);
        expect(svg).toContain("rotate(");
      });
      // a wave lifts one arm; arms-up lifts both
      expect((fullSVG({ g }, 70, { pose: "wave" }).match(/rotate\(120 /g) || []).length).toBe(1);
      expect((fullSVG({ g }, 70, { pose: "up" }).match(/rotate\(155 /g) || []).length).toBe(2);
    });
  });

  it("leaves a figure alone when there is no pose, and ignores one it does not know", () => {
    expect(strip(fullSVG({ g: "m" }, 70, { pose: "nonsense" }))).toBe(
      strip(fullSVG({ g: "m" }, 70))
    );
    expect(fullSVG({ g: "m" }, 70)).not.toMatch(/rotate\(1[0-9]{2} /);
  });

  it("can be drawn on a wider canvas so a raised arm is not cut off", () => {
    expect(fullSVG({ g: "m" }, 70)).toMatch(/viewBox="0 0 200 400"/);
    expect(fullSVG({ g: "m" }, 70, { pose: "up", vb: "-70 -70 340 470" })).toMatch(
      /viewBox="-70 -70 340 470"/
    );
  });

  it("holds each of the items the scene hands out (a jar, a cup, a harp, a timbrel)", () => {
    const none = fullSVG({ g: "m" }, 70);
    [ITEM.jar, ITEM.cup, ITEM.harp, ITEM.timbrel].forEach(item =>
      expect(strip(fullSVG({ g: "m", item }, 70)), `item ${item}`).not.toBe(strip(none))
    );
  });
});

describe.each([
  ["portrait", PORTRAIT],
  ["landscape", LANDSCAPE]
])("the %s hall", (name, L) => {
  const grid = L.buildGrid();
  const free = p => grid[L.tileOf(p.x, p.y).ty][L.tileOf(p.x, p.y).tx] === 0;
  const places = () => ({
    spawn: [L.SPAWN],
    pots: L.JARS.map(j => j.pour),
    cistern: [L.CISTERN.use],
    seats: L.SEATS,
    dance: L.DANCE_SPOTS,
    wander: L.WANDER_SPOTS,
    watch: L.WATCH_SPOTS,
    standby: L.STANDBY,
    head: Object.values(L.HEAD_SEATS),
    mary: [L.MARY_SPOT],
    musicians: L.MUSICIAN_SPOTS
  });

  it("is a grid over the whole hall, walled round the edge", () => {
    expect(grid.length).toBe(Math.ceil(L.WORLD.h / L.WORLD.tile));
    expect(grid[0].length).toBe(Math.ceil(L.WORLD.w / L.WORLD.tile));
    expect(grid[0].every(c => c === 1)).toBe(true);
    expect(grid[grid.length - 1].every(c => c === 1)).toBe(true);
    expect(grid.every(row => row[0] === 1 && row[row.length - 1] === 1)).toBe(true);
  });

  it("has six pots in a row, a cistern and two guest tables, all blocked and inside the hall", () => {
    expect(L.JARS.length).toBe(6);
    expect(L.GUEST_TABLES.length).toBe(2);
    L.JARS.forEach(j => {
      expect(free(j), `pot ${j.i}`).toBe(false);
      expect(j.x).toBeGreaterThan(20);
      expect(j.x).toBeLessThan(L.WORLD.w - 20);
    });
    // the pots do not overlap one another
    for (let i = 1; i < L.JARS.length; i++) {
      expect(L.JARS[i].x - L.JARS[i - 1].x).toBeGreaterThanOrEqual(36);
    }
    [L.HEAD_TABLE, ...L.GUEST_TABLES, L.CISTERN].forEach(r => {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(L.WORLD.w);
      expect(r.y + r.h).toBeLessThanOrEqual(L.WORLD.h);
    });
  });

  it("keeps every place someone is meant to stand on free floor inside the hall", () => {
    Object.entries(places()).forEach(([group, list]) =>
      list.forEach((p, i) => {
        expect(free(p), `${group} ${i} at ${p.x},${p.y}`).toBe(true);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.WORLD.w);
        expect(p.y).toBeGreaterThan(L.WALL_Y - 5);
        expect(p.y).toBeLessThan(L.WORLD.h);
      })
    );
    expect(L.DANCE_SPOTS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(L.SEATS.map(s => s.id)).size).toBe(L.SEATS.length);
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
    expect(find(L.CISTERN.use, L.JARS[5].pour)).not.toBeNull();
    expect(find(L.JARS[0].pour, L.HEAD_SEATS.master)).not.toBeNull();
  });

  it("walks to the nearest free spot when asked to go somewhere blocked", () => {
    const find = L.makeFinder(grid);
    const table = {
      x: L.HEAD_TABLE.x + L.HEAD_TABLE.w / 2,
      y: L.HEAD_TABLE.y + L.HEAD_TABLE.h / 2
    };
    expect(free(table)).toBe(false);
    const path = find(L.SPAWN, table);
    expect(free(path[path.length - 1])).toBe(true);
  });

  it("puts the dance floor where people can reach it and the head table behind it", () => {
    expect(L.DANCE_FLOOR.y).toBeGreaterThan(L.HEAD_TABLE.y + L.HEAD_TABLE.h);
    L.JARS.forEach(j => expect(j.y).toBeGreaterThan(L.DANCE_FLOOR.y + L.DANCE_FLOOR.ry));
  });
});

describe("choosing a hall", () => {
  it("has a tall hall and a wide hall", () => {
    expect(Object.keys(LAYOUTS)).toEqual(["portrait", "landscape"]);
    expect(PORTRAIT.WORLD.h).toBeGreaterThan(PORTRAIT.WORLD.w);
    expect(LANDSCAPE.WORLD.w).toBeGreaterThan(LANDSCAPE.WORLD.h);
    expect(PORTRAIT.kind).toBe("portrait");
    expect(LANDSCAPE.kind).toBe("landscape");
  });

  it("picks the wide hall for a box that is clearly wider than it is tall", () => {
    expect(layoutFor(1280, 640).kind).toBe("landscape");
    expect(layoutFor(844, 340).kind).toBe("landscape");
    expect(layoutFor(900, 600).kind).toBe("landscape");
  });

  it("picks the tall hall for a phone held upright, a square box, or no box yet", () => {
    expect(layoutFor(390, 600).kind).toBe("portrait");
    expect(layoutFor(700, 700).kind).toBe("portrait");
    expect(layoutFor(800, 700).kind).toBe("portrait");
    expect(layoutFor(0, 0).kind).toBe("portrait");
    expect(layoutFor(500, 0).kind).toBe("portrait");
  });

  it("keeps the names the tall hall has always had", () => {
    expect(WORLD).toBe(PORTRAIT.WORLD);
    expect(JARS).toBe(PORTRAIT.JARS);
    expect(buildGrid()).toEqual(PORTRAIT.buildGrid());
  });
});
