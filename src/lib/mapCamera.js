// The big map's camera: a viewBox [x, y, w, h] kept in the store as mapVB (null = the whole map), plus pan and zoom helpers.
import { getState, setState } from "@/store.js";
import { stats } from "./player.js";
import { MAP_W, MAP_H, journeyPos } from "./journey.js";

export const mapVB = () => getState().mapVB || [0, 0, MAP_W, MAP_H];
export const mapZoom = () => MAP_W / mapVB()[2];

export function setMapVB(x, y, w) {
  w = Math.max(MAP_W / 6, Math.min(MAP_W, w));
  const h = (w * MAP_H) / MAP_W;
  x = Math.max(0, Math.min(MAP_W - w, x));
  y = Math.max(0, Math.min(MAP_H - h, y));
  setState({ mapVB: w >= MAP_W - 0.5 ? null : [x, y, w, h] });
}

export function zoomMapAt(factor, cx, cy) {
  const [x, y, w] = mapVB();
  const nw = w / factor;
  setMapVB(cx - (cx - x) * (nw / w), cy - (cy - y) * (nw / w), nw);
}

// Screen coordinates to map coordinates (and the screen pixels per map unit).
export function mapPoint(svg, clientX, clientY) {
  const r = svg.getBoundingClientRect();
  const [x, y, w, h] = mapVB();
  // preserveAspectRatio "slice": the same scale on both axes, centered
  const s = Math.max(r.width / w, r.height / h);
  return {
    x: x + (clientX - r.left - (r.width - w * s) / 2) / s,
    y: y + (clientY - r.top - (r.height - h * s) / 2) / s,
    s
  };
}

// The + / − / "find me" / "show everything" buttons.
export function mapControl(kind) {
  const [x, y, w, h] = mapVB();
  if (kind === "in") {
    zoomMapAt(1.6, x + w / 2, y + h / 2);
  }
  if (kind === "out") {
    zoomMapAt(1 / 1.6, x + w / 2, y + h / 2);
  }
  if (kind === "reset") {
    setMapVB(0, 0, MAP_W);
  }
  if (kind === "me") {
    const me = getState().me;
    const p = journeyPos(me ? stats(me).n : 0);
    const nw = MAP_W / 3;
    setMapVB(p.x - nw / 2, p.y - (nw * MAP_H) / MAP_W / 2 - 10, nw);
  }
}
