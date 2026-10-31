// The walkable floor of a scene as a grid of tiles, and a path-finder over it. Every scene's place uses this: give it the
// size of the place (WORLD: { w, h, tile }) and the rectangles that block the way (OBSTACLES: [{ x, y, w, h }]).
import EasyStar from "easystarjs";

const inflate = (r, d) => ({ x: r.x - d, y: r.y - d, w: r.w + d * 2, h: r.h + d * 2 });
const inside = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

export function gridTools(WORLD, OBSTACLES) {
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

  return { tileOf, centreOf, buildGrid, nearestFree, makeFinder };
}
