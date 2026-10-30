import { describe, it, expect, beforeEach } from "vitest";
import { getState, setState } from "@/store.js";
import { mapVB, mapZoom, setMapVB, zoomMapAt, mapPoint, mapControl } from "./mapCamera.js";
import { MAP_W, MAP_H, journeyPos } from "./journey.js";

const FULL = [0, 0, MAP_W, MAP_H];
const svgAt = (left, top, width, height) => ({
  getBoundingClientRect: () => ({ left, top, width, height })
});

beforeEach(() => setState({ mapVB: null, me: null }));

describe("mapVB / mapZoom", () => {
  it("shows the whole map when nothing is stored", () => {
    expect(mapVB()).toEqual(FULL);
    expect(mapZoom()).toBe(1);
  });

  it("reports the zoom from the stored width", () => {
    setState({ mapVB: [0, 0, MAP_W / 2, MAP_H / 2] });
    expect(mapZoom()).toBe(2);
  });
});

describe("setMapVB", () => {
  it("stores a window that keeps the map's aspect ratio", () => {
    setMapVB(10, 20, 180);
    const [x, y, w, h] = getState().mapVB;
    expect([x, y, w]).toEqual([10, 20, 180]);
    expect(h).toBeCloseTo((180 * MAP_H) / MAP_W);
  });

  it("clears the camera when zoomed all the way out", () => {
    setMapVB(0, 0, MAP_W);
    expect(getState().mapVB).toBeNull();
    setMapVB(0, 0, MAP_W * 3);
    expect(getState().mapVB).toBeNull();
  });

  it("zooms in no further than 6x", () => {
    setMapVB(0, 0, 1);
    expect(getState().mapVB[2]).toBeCloseTo(MAP_W / 6);
  });

  it("keeps the window inside the map", () => {
    setMapVB(-100, -100, 120);
    let [x, y] = getState().mapVB;
    expect([x, y]).toEqual([0, 0]);
    setMapVB(1000, 1000, 120);
    const [x2, y2, w, h] = getState().mapVB;
    expect(x2 + w).toBeCloseTo(MAP_W);
    expect(y2 + h).toBeCloseTo(MAP_H);
  });
});

describe("zoomMapAt", () => {
  it("zooms in around a point, keeping that point under the finger", () => {
    zoomMapAt(2, 180, 280);
    const [x, y, w, h] = getState().mapVB;
    expect(w).toBeCloseTo(MAP_W / 2);
    expect(x + w / 2).toBeCloseTo(180);
    expect(y + h / 2).toBeCloseTo(280);
  });

  it("keeps an off-centre point at the same relative position", () => {
    zoomMapAt(2, 90, 140);
    const [x, y, w, h] = getState().mapVB;
    expect((90 - x) / w).toBeCloseTo(90 / MAP_W);
    expect((140 - y) / h).toBeCloseTo(140 / MAP_H);
  });

  it("zooming out from the full map does nothing", () => {
    zoomMapAt(0.5, 100, 100);
    expect(getState().mapVB).toBeNull();
  });
});

describe("mapPoint", () => {
  it("maps screen corners to map corners when the box matches the map", () => {
    const svg = svgAt(10, 20, MAP_W, MAP_H);
    expect(mapPoint(svg, 10, 20)).toEqual({ x: 0, y: 0, s: 1 });
    expect(mapPoint(svg, 10 + MAP_W, 20 + MAP_H)).toEqual({ x: MAP_W, y: MAP_H, s: 1 });
  });

  it("scales by the larger ratio and centres, like preserveAspectRatio slice", () => {
    const svg = svgAt(0, 0, MAP_W * 2, MAP_H * 4);
    const p = mapPoint(svg, MAP_W, MAP_H * 2);
    expect(p.s).toBe(4);
    expect(p.x).toBeCloseTo(MAP_W / 2);
    expect(p.y).toBeCloseTo(MAP_H / 2);
  });

  it("follows the camera", () => {
    setState({ mapVB: [100, 200, 180, (180 * MAP_H) / MAP_W] });
    const p = mapPoint(svgAt(0, 0, 180, (180 * MAP_H) / MAP_W), 0, 0);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(200);
  });
});

describe("mapControl", () => {
  it("'in' zooms in 1.6x about the centre and 'out' undoes it", () => {
    mapControl("in");
    expect(mapZoom()).toBeCloseTo(1.6);
    mapControl("out");
    expect(mapZoom()).toBeCloseTo(1);
    expect(getState().mapVB).toBeNull();
  });

  it("'reset' shows everything again", () => {
    mapControl("in");
    mapControl("in");
    mapControl("reset");
    expect(getState().mapVB).toBeNull();
  });

  it("'me' centres on the player at 3x", () => {
    setState({
      me: { id: "m", done: { 1: "2026-10-01", 2: "2026-10-02", 3: "2026-10-03" }, quiz: {} }
    });
    mapControl("me");
    const [x, y, w, h] = getState().mapVB;
    const pos = journeyPos(3);
    expect(w).toBeCloseTo(MAP_W / 3);
    expect(x + w / 2).toBeCloseTo(pos.x, 0);
    expect(y + h / 2 + 10).toBeCloseTo(pos.y, 0);
  });

  it("'me' still works before the player has loaded", () => {
    setState({ me: null });
    expect(() => mapControl("me")).not.toThrow();
    expect(mapZoom()).toBeCloseTo(3);
  });

  it("ignores unknown buttons", () => {
    mapControl("sideways");
    expect(getState().mapVB).toBeNull();
  });
});
