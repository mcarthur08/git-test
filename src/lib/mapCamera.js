// The big map's camera: a viewBox [x, y, w, h] kept in the store as mapVB (null = the whole map), plus pan and zoom helpers.
// The view always has the shape of the screen area the map is drawn in (store mapAspect, width / height), so a map
// turned sideways on a phone fills the screen and you drag up and down to see the rest.
import { getState, setState } from "@/store.js";
import { stats } from "./player.js";
import { MAP_W, MAP_H, journeyPos } from "./journey.js";

const aspect = () => getState().mapAspect || MAP_W / MAP_H;
// The widest view: the whole width, or less when the screen is narrower than the map.
const maxW = () => Math.min(MAP_W, MAP_H * aspect());

export function mapVB() {
  const vb = getState().mapVB;
  if (vb) {
    return vb;
  }
  const w = maxW();
  const h = w / aspect();
  return [(MAP_W - w) / 2, (MAP_H - h) / 2, w, h];
}
export const mapZoom = () => MAP_W / mapVB()[2];
// True when part of the map is out of view, so dragging has somewhere to go.
export function mapPannable() {
  const [, , w, h] = mapVB();
  return w < MAP_W - 0.5 || h < MAP_H - 0.5;
}

export function setMapVB(x, y, w) {
  w = Math.max(MAP_W / 6, Math.min(maxW(), w));
  const h = w / aspect();
  x = Math.max(0, Math.min(MAP_W - w, x));
  y = Math.max(0, Math.min(MAP_H - h, y));
  setState({ mapVB: w >= MAP_W - 0.5 && h >= MAP_H - 0.5 ? null : [x, y, w, h] });
}

// The map's screen area changed shape (full screen, or the phone was turned): keep the same centre in view.
export function setMapAspect(a) {
  if (Math.abs(a - aspect()) < 0.005) {
    return;
  }
  const [x, y, w, h] = mapVB();
  setState({ mapAspect: a });
  const nw = Math.min(w, maxW());
  const nh = nw / a;
  setMapVB(x + w / 2 - nw / 2, y + h / 2 - nh / 2, nw);
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
    setState({ mapVB: null });
  }
  if (kind === "me") {
    const me = getState().me;
    const p = journeyPos(me ? stats(me).n : 0);
    const nw = MAP_W / 3;
    setMapVB(p.x - nw / 2, p.y - nw / aspect() / 2 - 10, nw);
  }
}
