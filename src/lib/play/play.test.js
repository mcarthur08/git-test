import { describe, it, expect, vi, afterEach } from "vitest";
import { createActor } from "xstate";
import { makeDirector } from "./director.js";
import { gridTools } from "./grid.js";
import { SCENES, sceneOf, partText } from "./registry.js";
import { LOADERS } from "../../views/play/loaders.js";
import { STOPS } from "../data.js";

afterEach(() => vi.useRealTimers());

describe("the director of a scene", () => {
  const make = () =>
    createActor(
      makeDirector([
        { id: "one", ms: 1000 },
        { id: "two", ms: 2000, on: { HURRY: "four" } },
        { id: "three", ms: 3000 },
        { id: "four" }
      ])
    ).start();
  const at = a => a.getSnapshot().value;

  it("starts at the first part and runs each for its time, then stays on the last", () => {
    vi.useFakeTimers();
    const a = make();
    expect(at(a)).toBe("one");
    vi.advanceTimersByTime(999);
    expect(at(a)).toBe("one");
    vi.advanceTimersByTime(1);
    expect(at(a)).toBe("two");
    vi.advanceTimersByTime(2000);
    expect(at(a)).toBe("three");
    vi.advanceTimersByTime(3000);
    expect(at(a)).toBe("four");
    vi.advanceTimersByTime(600000);
    expect(at(a)).toBe("four");
    a.stop();
  });

  it("can be skipped ahead, hurried by an event of its own, and replayed from anywhere", () => {
    vi.useFakeTimers();
    const a = make();
    a.send({ type: "SKIP" });
    expect(at(a)).toBe("two");
    a.send({ type: "HURRY" });
    expect(at(a)).toBe("four");
    a.send({ type: "SKIP" });
    expect(at(a)).toBe("four");
    a.send({ type: "REPLAY" });
    expect(at(a)).toBe("one");
    // an event meant for another part does nothing
    a.send({ type: "HURRY" });
    expect(at(a)).toBe("one");
    a.stop();
  });

  it("does not run the time of a part it has left", () => {
    vi.useFakeTimers();
    const a = make();
    vi.advanceTimersByTime(500);
    a.send({ type: "SKIP" });
    vi.advanceTimersByTime(600);
    expect(at(a)).toBe("two");
    a.stop();
  });

  it("works for a story of one part", () => {
    const a = createActor(makeDirector([{ id: "only" }])).start();
    expect(at(a)).toBe("only");
    a.send({ type: "SKIP" });
    a.send({ type: "REPLAY" });
    expect(at(a)).toBe("only");
    a.stop();
  });
});

describe("the floor grid and path-finder", () => {
  // a 100 x 60 place with a wall across the middle that has a gap at the bottom
  const WORLD = { w: 100, h: 60, tile: 10 };
  const wall = { x: 40, y: 0, w: 10, h: 40 };
  const t = gridTools(WORLD, [wall]);

  it("makes a grid the size of the place, with the obstacle blocked", () => {
    const grid = t.buildGrid();
    expect(grid.length).toBe(6);
    expect(grid[0].length).toBe(10);
    expect(grid[1][4]).toBe(1);
    expect(grid[1][0]).toBe(0);
    expect(grid[5][4]).toBe(0);
  });

  it("finds the tile of a point, keeping it inside the place", () => {
    expect(t.tileOf(25, 15)).toEqual({ tx: 2, ty: 1 });
    expect(t.tileOf(-50, 999)).toEqual({ tx: 0, ty: 5 });
    expect(t.centreOf(2, 1)).toEqual({ x: 25, y: 15 });
  });

  it("walks round an obstacle, ending exactly where it was asked", () => {
    const find = t.makeFinder(t.buildGrid());
    const path = find({ x: 15, y: 15 }, { x: 85, y: 15 });
    expect(path).not.toBeNull();
    expect(path[path.length - 1]).toEqual({ x: 85, y: 15 });
    // it has to go down through the gap under the wall
    expect(Math.max(...path.map(p => p.y))).toBeGreaterThan(40);
  });

  it("goes to the nearest free tile when asked to go somewhere blocked", () => {
    const grid = t.buildGrid();
    const find = t.makeFinder(grid);
    const path = find({ x: 15, y: 15 }, { x: 45, y: 15 });
    const end = path[path.length - 1];
    const tile = t.tileOf(end.x, end.y);
    expect(grid[tile.ty][tile.tx]).toBe(0);
    expect(t.nearestFree(grid, 45, 15)).toEqual(
      expect.objectContaining({ tx: expect.any(Number) })
    );
  });

  it("says there is no way when the place is cut in two", () => {
    const whole = gridTools(WORLD, [{ x: 40, y: 0, w: 10, h: 60 }]);
    const find = whole.makeFinder(whole.buildGrid());
    expect(find({ x: 15, y: 15 }, { x: 85, y: 15 })).toBeNull();
  });
});

describe("the registry of scenes", () => {
  it("describes every scene fully, under its own id", () => {
    Object.entries(SCENES).forEach(([id, def]) => {
      expect(def.id).toBe(id);
      expect(def.title && def.ref && def.enter && def.hint).toBeTruthy();
      expect(def.parts.length).toBeGreaterThan(2);
      def.parts.forEach(p => {
        expect(def.steps[p], `${id} ${p} step`).toBeTruthy();
        expect(def.story[p].quotes.length, `${id} ${p} story`).toBeGreaterThan(0);
        expect(partText(id, p).length).toBeGreaterThan(10);
      });
      expect(def.actions.length).toBeGreaterThan(0);
      def.actions.forEach(a => {
        expect(a.label && a.run).toBeTruthy();
      });
      expect(new Set(def.actions.map(a => a.run)).size).toBe(def.actions.length);
    });
  });

  it("has a loader for every scene and a stop on the map to open each one", () => {
    expect(Object.keys(LOADERS).sort()).toEqual(Object.keys(SCENES).sort());
    Object.values(SCENES).forEach(def => {
      const stops = STOPS.filter(s => s.scene === def.id);
      expect(stops.length, def.id).toBe(1);
      expect(stops[0].place).toBe(def.stop);
      expect(sceneOf(stops[0])).toBe(def);
    });
  });

  it("only offers a scene from a stop that has one", () => {
    STOPS.forEach(s => {
      if (s.scene) {
        expect(SCENES[s.scene], s.place).toBeTruthy();
      } else {
        expect(sceneOf(s)).toBeNull();
      }
    });
    expect(sceneOf(null)).toBeNull();
    expect(sceneOf({ scene: "nonsense" })).toBeNull();
  });
});
