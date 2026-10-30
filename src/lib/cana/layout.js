// The courtyard at the wedding in Cana: its size, what stands where, where people can stand and walk, and a
// path-finder over the walkable floor. Everything is in world units (the hall is 360 x 540, drawn in portrait).
import EasyStar from "easystarjs";

export const WORLD = { w: 360, h: 540, tile: 10 };
export const WALL_Y = 88;

export const HEAD_TABLE = { x: 110, y: 106, w: 140, h: 26 };
export const GUEST_TABLES = [
  { x: 46, y: 200, w: 40, h: 40 },
  { x: 274, y: 200, w: 40, h: 40 }
];
// "And there were set there six waterpots of stone" (John 2:6), in a row, each with a spot to pour from.
export const JARS = Array.from({ length: 6 }, (_, i) => ({
  i,
  x: 78 + i * 40,
  y: 392,
  pour: { x: 78 + i * 40, y: 422 }
}));
// the cistern the servants draw water from
export const CISTERN = { x: 24, y: 452, w: 42, h: 48, use: { x: 84, y: 476 } };
export const PLANTS = [
  { x: 12, y: 92, w: 16, h: 16 },
  { x: 332, y: 92, w: 16, h: 16 }
];
export const DANCE_FLOOR = { x: 180, y: 300, rx: 78, ry: 46 };
export const SPAWN = { x: 180, y: 506 };

const jarBox = j => ({ x: j.x - 13, y: j.y - 14, w: 26, h: 28 });
export const OBSTACLES = [
  { x: 0, y: 0, w: WORLD.w, h: WALL_Y },
  { x: 0, y: 0, w: 8, h: WORLD.h },
  { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
  { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
  HEAD_TABLE,
  ...GUEST_TABLES,
  ...JARS.map(jarBox),
  CISTERN,
  ...PLANTS
];

// Where the wedding party sits and stands.
export const HEAD_SEATS = {
  groom: { x: 150, y: 97 },
  bride: { x: 182, y: 97 },
  master: { x: 214, y: 97 }
};
export const MARY_SPOT = { x: 94, y: 128 };
export const MUSICIAN_SPOTS = [
  { x: 284, y: 98 },
  { x: 308, y: 98 }
];
// Seats at the guest tables: face is the way the guest looks (towards the table).
export const SEATS = GUEST_TABLES.flatMap((t, ti) => {
  const cx = t.x + t.w / 2;
  const cy = t.y + t.h / 2;
  return [
    { id: `t${ti}-back`, x: cx, y: t.y - 14, face: 1 },
    { id: `t${ti}-left`, x: t.x - 16, y: cy, face: 1 },
    { id: `t${ti}-right`, x: t.x + t.w + 16, y: cy, face: -1 },
    { id: `t${ti}-front`, x: cx, y: t.y + t.h + 16, face: -1 }
  ];
});
// Places to stand and dance, around and on the floor.
export const DANCE_SPOTS = [
  ...Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2;
    return {
      x: Math.round(DANCE_FLOOR.x + Math.cos(a) * DANCE_FLOOR.rx * 0.62),
      y: Math.round(DANCE_FLOOR.y + Math.sin(a) * DANCE_FLOOR.ry * 0.62)
    };
  }),
  { x: DANCE_FLOOR.x - 14, y: DANCE_FLOOR.y },
  { x: DANCE_FLOOR.x + 14, y: DANCE_FLOOR.y }
];
// Where a guest might stroll to when nothing else is going on.
export const WANDER_SPOTS = [
  { x: 120, y: 170 },
  { x: 240, y: 170 },
  { x: 180, y: 200 },
  { x: 110, y: 300 },
  { x: 250, y: 300 },
  { x: 180, y: 360 },
  { x: 130, y: 470 },
  { x: 240, y: 470 },
  { x: 180, y: 440 }
];

const inflate = (r, d) => ({ x: r.x - d, y: r.y - d, w: r.w + d * 2, h: r.h + d * 2 });
const inside = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

// The floor as a grid of tiles (0 = free, 1 = blocked), rows first, which is what the path-finder wants.
export function buildGrid() {
  const cols = Math.ceil(WORLD.w / WORLD.tile);
  const rows = Math.ceil(WORLD.h / WORLD.tile);
  const boxes = OBSTACLES.map(r => inflate(r, 3));
  return Array.from({ length: rows }, (_, ty) =>
    Array.from({ length: cols }, (_, tx) => {
      const x = tx * WORLD.tile + WORLD.tile / 2;
      const y = ty * WORLD.tile + WORLD.tile / 2;
      return boxes.some(b => inside(b, x, y)) ? 1 : 0;
    })
  );
}

export const tileOf = (x, y) => ({
  tx: Math.max(0, Math.min(Math.ceil(WORLD.w / WORLD.tile) - 1, Math.floor(x / WORLD.tile))),
  ty: Math.max(0, Math.min(Math.ceil(WORLD.h / WORLD.tile) - 1, Math.floor(y / WORLD.tile)))
});
export const centreOf = (tx, ty) => ({
  x: tx * WORLD.tile + WORLD.tile / 2,
  y: ty * WORLD.tile + WORLD.tile / 2
});

// The nearest free tile to a point, searching outwards ring by ring.
export function nearestFree(grid, x, y) {
  const { tx, ty } = tileOf(x, y);
  if (!grid[ty][tx]) {
    return { tx, ty };
  }
  for (let r = 1; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) {
          continue;
        }
        const nx = tx + dx;
        const ny = ty + dy;
        if (grid[ny] && grid[ny][nx] === 0) {
          return { tx: nx, ty: ny };
        }
      }
    }
  }
  return { tx, ty };
}

// A path-finder over a grid: find(from, to) gives the points to walk through, in world units, or null.
export function makeFinder(grid) {
  const es = new EasyStar.js();
  es.setGrid(grid);
  es.setAcceptableTiles([0]);
  es.enableSync();
  es.enableDiagonals();
  es.disableCornerCutting();
  return function find(from, to) {
    const a = nearestFree(grid, from.x, from.y);
    const b = nearestFree(grid, to.x, to.y);
    let out = null;
    es.findPath(a.tx, a.ty, b.tx, b.ty, path => {
      out = path;
    });
    es.calculate();
    if (!out) {
      return null;
    }
    // walk straight to the exact spot asked for once on its tile, unless that spot is blocked
    const end = grid[tileOf(to.x, to.y).ty][tileOf(to.x, to.y).tx]
      ? centreOf(b.tx, b.ty)
      : { x: to.x, y: to.y };
    const pts = out.slice(1).map(t => centreOf(t.x, t.y));
    if (pts.length) {
      pts[pts.length - 1] = end;
    } else {
      pts.push(end);
    }
    return pts;
  };
}
