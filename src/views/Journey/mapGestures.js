import { mapVB, mapPannable, setMapVB, zoomMapAt, mapPoint } from "@/lib/mapCamera.js";

// True right after a drag or pinch, so the tap that ends it doesn't also select a stop.
export const gesture = { dragged: false };

// Drag to pan, pinch or wheel to zoom, double-click to zoom in. Returns a function that removes the listeners.
export function wireGestures(svg) {
  const pts = new Map();
  let last = null;
  let pinch = null;
  let moved = 0;
  const down = e => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = 0;
    gesture.dragged = false;
    if (pts.size === 1) {
      last = { x: e.clientX, y: e.clientY };
    }
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
    }
  };
  const move = e => {
    if (!pts.has(e.pointerId)) {
      return;
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 0 && pinch.d > 0) {
        const m = mapPoint(svg, (a.x + b.x) / 2, (a.y + b.y) / 2);
        zoomMapAt(d / pinch.d, m.x, m.y);
        pinch.d = d;
        gesture.dragged = true;
      }
      return;
    }
    if (pts.size === 1 && last && mapPannable()) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      const s = mapPoint(svg, e.clientX, e.clientY).s;
      const [x, y, w] = mapVB();
      if (moved > 4) {
        setMapVB(x - dx / s, y - dy / s, w);
        gesture.dragged = true;
      }
      last = { x: e.clientX, y: e.clientY };
    }
  };
  const end = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) {
      pinch = null;
    }
    if (!pts.size) {
      last = null;
    }
  };
  const wheel = e => {
    e.preventDefault();
    const m = mapPoint(svg, e.clientX, e.clientY);
    zoomMapAt(e.deltaY < 0 ? 1.25 : 0.8, m.x, m.y);
  };
  const dbl = e => {
    const m = mapPoint(svg, e.clientX, e.clientY);
    zoomMapAt(2, m.x, m.y);
  };
  svg.addEventListener("pointerdown", down);
  svg.addEventListener("pointermove", move);
  ["pointerup", "pointercancel", "pointerleave"].forEach(t => svg.addEventListener(t, end));
  svg.addEventListener("wheel", wheel, { passive: false });
  svg.addEventListener("dblclick", dbl);
  return () => {
    svg.removeEventListener("pointerdown", down);
    svg.removeEventListener("pointermove", move);
    ["pointerup", "pointercancel", "pointerleave"].forEach(t => svg.removeEventListener(t, end));
    svg.removeEventListener("wheel", wheel);
    svg.removeEventListener("dblclick", dbl);
  };
}
