// The courtyard at the wedding in Cana: its size, what stands where, where people can stand and walk, and a
// path-finder over the walkable floor. Everything is in world units. There are two halls with the same things in
// them: a tall one for a phone held upright (360 x 540) and a wide one for a desktop or a phone turned sideways
// (700 x 440). The scene picks whichever fits the box it has.
import EasyStar from "easystarjs";

const inflate = (r, d) => ({ x: r.x - d, y: r.y - d, w: r.w + d * 2, h: r.h + d * 2 });
const inside = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const jarBox = j => ({ x: j.x - 13, y: j.y - 14, w: 26, h: 28 });

function build(spec) {
  const WORLD = spec.world;
  const WALL_Y = spec.wallY;
  const HEAD_TABLE = spec.headTable;
  const GUEST_TABLES = spec.guestTables;
  // "And there were set there six waterpots of stone" (John 2:6), in a row, each with a spot to pour from.
  const JARS = Array.from({ length: 6 }, (_, i) => ({
    i,
    x: spec.jars.x + i * spec.jars.dx,
    y: spec.jars.y,
    pour: { x: spec.jars.x + i * spec.jars.dx, y: spec.jars.y + 30 }
  }));
  // the cistern the servants draw water from
  const CISTERN = spec.cistern;
  const PLANTS = spec.plants;
  const DANCE_FLOOR = spec.dance;
  const OBSTACLES = [
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
  // Seats at the guest tables: face is the way the guest looks (towards the table).
  const SEATS = GUEST_TABLES.flatMap((t, ti) => {
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
  const DANCE_SPOTS = [
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

  const cols = Math.ceil(WORLD.w / WORLD.tile);
  const rows = Math.ceil(WORLD.h / WORLD.tile);
  const tileOf = (x, y) => ({
    tx: Math.max(0, Math.min(cols - 1, Math.floor(x / WORLD.tile))),
    ty: Math.max(0, Math.min(rows - 1, Math.floor(y / WORLD.tile)))
  });
  const centreOf = (tx, ty) => ({
    x: tx * WORLD.tile + WORLD.tile / 2,
    y: ty * WORLD.tile + WORLD.tile / 2
  });

  // The floor as a grid of tiles (0 = free, 1 = blocked), rows first, which is what the path-finder wants.
  const buildGrid = () => {
    const boxes = OBSTACLES.map(r => inflate(r, 3));
    return Array.from({ length: rows }, (_, ty) =>
      Array.from({ length: cols }, (_, tx) => {
        const c = centreOf(tx, ty);
        return boxes.some(b => inside(b, c.x, c.y)) ? 1 : 0;
      })
    );
  };

  // The nearest free tile to a point, searching outwards ring by ring.
  const nearestFree = (grid, x, y) => {
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
  };

  // A path-finder over a grid: find(from, to) gives the points to walk through, in world units, or null.
  const makeFinder = grid => {
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
  };

  return {
    kind: spec.kind,
    WORLD,
    WALL_Y,
    HEAD_TABLE,
    GUEST_TABLES,
    JARS,
    CISTERN,
    PLANTS,
    DANCE_FLOOR,
    SPAWN: spec.spawn,
    OBSTACLES,
    HEAD_SEATS: spec.headSeats,
    MARY_SPOT: spec.mary,
    MUSICIAN_SPOTS: spec.musicians,
    SEATS,
    DANCE_SPOTS,
    // where a guest might stroll to when nothing else is going on
    WANDER_SPOTS: spec.wander,
    // where guests stand to watch the servants at the pots
    WATCH_SPOTS: spec.watch,
    // where the servants wait when they have nothing to carry
    STANDBY: spec.standby,
    buildGrid,
    tileOf,
    centreOf,
    nearestFree,
    makeFinder
  };
}

// A hall for a phone held upright: tall, with the pots near the bottom.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  wallY: 88,
  headTable: { x: 110, y: 106, w: 140, h: 26 },
  guestTables: [
    { x: 46, y: 200, w: 40, h: 40 },
    { x: 274, y: 200, w: 40, h: 40 }
  ],
  jars: { x: 78, dx: 40, y: 392 },
  cistern: { x: 24, y: 452, w: 42, h: 48, use: { x: 84, y: 476 } },
  plants: [
    { x: 12, y: 92, w: 16, h: 16 },
    { x: 332, y: 92, w: 16, h: 16 }
  ],
  dance: { x: 180, y: 300, rx: 78, ry: 46 },
  spawn: { x: 180, y: 506 },
  headSeats: { groom: { x: 150, y: 97 }, bride: { x: 182, y: 97 }, master: { x: 214, y: 97 } },
  mary: { x: 94, y: 128 },
  musicians: [
    { x: 284, y: 98 },
    { x: 308, y: 98 }
  ],
  wander: [
    { x: 120, y: 170 },
    { x: 240, y: 170 },
    { x: 180, y: 200 },
    { x: 110, y: 300 },
    { x: 250, y: 300 },
    { x: 180, y: 360 },
    { x: 130, y: 470 },
    { x: 240, y: 470 },
    { x: 180, y: 440 }
  ],
  watch: [
    { x: 120, y: 350 },
    { x: 180, y: 352 },
    { x: 240, y: 350 },
    { x: 150, y: 330 },
    { x: 210, y: 330 }
  ],
  standby: [
    { x: 120, y: 440 },
    { x: 210, y: 452 },
    { x: 290, y: 440 }
  ]
});

// A hall for a desktop or a phone turned sideways: wide, with the tables to either side and the pots along the front.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  wallY: 80,
  headTable: { x: 280, y: 96, w: 140, h: 26 },
  guestTables: [
    { x: 104, y: 190, w: 40, h: 40 },
    { x: 556, y: 190, w: 40, h: 40 }
  ],
  jars: { x: 190, dx: 64, y: 340 },
  cistern: { x: 28, y: 352, w: 42, h: 48, use: { x: 90, y: 378 } },
  plants: [
    { x: 12, y: 84, w: 16, h: 16 },
    { x: 672, y: 84, w: 16, h: 16 }
  ],
  dance: { x: 350, y: 236, rx: 96, ry: 52 },
  spawn: { x: 350, y: 412 },
  headSeats: { groom: { x: 316, y: 87 }, bride: { x: 350, y: 87 }, master: { x: 384, y: 87 } },
  mary: { x: 252, y: 118 },
  musicians: [
    { x: 470, y: 88 },
    { x: 498, y: 88 }
  ],
  wander: [
    { x: 200, y: 150 },
    { x: 500, y: 150 },
    { x: 350, y: 170 },
    { x: 190, y: 260 },
    { x: 510, y: 260 },
    { x: 350, y: 310 },
    { x: 230, y: 400 },
    { x: 470, y: 400 },
    { x: 350, y: 388 }
  ],
  watch: [
    { x: 260, y: 300 },
    { x: 350, y: 304 },
    { x: 440, y: 300 },
    { x: 300, y: 288 },
    { x: 400, y: 288 }
  ],
  standby: [
    { x: 150, y: 396 },
    { x: 350, y: 400 },
    { x: 560, y: 396 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// Which hall fits a box: the wide one when the box is clearly wider than it is tall.
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);

// The portrait hall under the names this module has always had.
export const {
  WORLD,
  WALL_Y,
  HEAD_TABLE,
  GUEST_TABLES,
  JARS,
  CISTERN,
  PLANTS,
  DANCE_FLOOR,
  SPAWN,
  OBSTACLES,
  HEAD_SEATS,
  MARY_SPOT,
  MUSICIAN_SPOTS,
  SEATS,
  DANCE_SPOTS,
  WANDER_SPOTS,
  WATCH_SPOTS,
  STANDBY,
  buildGrid,
  tileOf,
  centreOf,
  nearestFree,
  makeFinder
} = PORTRAIT;
