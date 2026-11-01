// The grassy hillside at Bethsaida, where the crowd sat down in companies to be fed (Luke 9:10–17, John 6:1–13): its size,
// the five grass companies with their seats, the rock where the bread is blessed, and where people can stand and walk.
// Everything is in world units. Like the courtyard at Cana it comes in two shapes: a tall one for a phone held upright
// (360 x 540) and a wide one for a desktop or a phone turned sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const HILL_Y = spec.hillY;
  // "Make them sit down by fifties in a company" (Luke 9:14): five companies, each a ring of seats on the grass
  const GROUPS = spec.groups.map((g, id) => ({ id, ...g }));
  const SEATS = GROUPS.flatMap(g =>
    Array.from({ length: 8 }, (_, k) => {
      const a = (k / 8) * Math.PI * 2 + 0.4;
      return {
        id: `g${g.id}-${k}`,
        group: g.id,
        x: Math.round(g.x + Math.cos(a) * g.rx),
        y: Math.round(g.y + Math.sin(a) * g.ry),
        face: Math.cos(a) < 0 ? 1 : -1
      };
    })
  );
  const ROCK = spec.rock;
  const TREES = spec.trees;
  const OBSTACLES = [
    { x: 0, y: 0, w: WORLD.w, h: HILL_Y },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    ROCK,
    ...TREES
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    HILL_Y,
    GROUPS,
    SEATS,
    ROCK,
    TREES,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where the bread is laid and blessed, and where the lad and the disciples gather round it
    ROCK_USE: spec.rockUse,
    LAD_SPOT: spec.lad,
    DISCIPLE_SPOTS: spec.disciples,
    // where the baskets of bread are set out (one for each time a company is fed)
    STORE: spec.store,
    // where the fragments are left: twelve baskets full (Luke 9:17)
    LEFTOVERS: spec.leftovers,
    // where people stroll while the crowd waits
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A hillside for a phone held upright: the companies in two columns, the rock at the bottom.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  hillY: 104,
  groups: [
    { x: 92, y: 196, rx: 40, ry: 24 },
    { x: 268, y: 196, rx: 40, ry: 24 },
    { x: 180, y: 272, rx: 40, ry: 24 },
    { x: 92, y: 350, rx: 40, ry: 24 },
    { x: 268, y: 350, rx: 40, ry: 24 }
  ],
  rock: { x: 152, y: 416, w: 56, h: 30 },
  trees: [
    { x: 10, y: 104, w: 22, h: 20 },
    { x: 166, y: 104, w: 26, h: 20 },
    { x: 328, y: 104, w: 22, h: 20 }
  ],
  spawn: { x: 180, y: 508 },
  rockUse: { x: 180, y: 456 },
  lad: { x: 146, y: 458 },
  disciples: [
    { x: 118, y: 436 },
    { x: 242, y: 436 },
    { x: 124, y: 462 },
    { x: 236, y: 462 }
  ],
  store: [96, 128, 160, 192, 224].flatMap(x => [
    { x, y: 472 },
    { x: x + 16, y: 490 }
  ]),
  leftovers: [
    { x: 30, y: 202 },
    { x: 154, y: 202 },
    { x: 206, y: 202 },
    { x: 330, y: 202 },
    { x: 118, y: 278 },
    { x: 242, y: 278 },
    { x: 30, y: 356 },
    { x: 154, y: 356 },
    { x: 206, y: 356 },
    { x: 330, y: 356 },
    { x: 126, y: 424 },
    { x: 234, y: 424 }
  ],
  wander: [
    { x: 180, y: 150 },
    { x: 50, y: 272 },
    { x: 310, y: 272 },
    { x: 180, y: 336 },
    { x: 100, y: 424 },
    { x: 260, y: 424 },
    { x: 60, y: 140 },
    { x: 300, y: 140 },
    { x: 180, y: 220 }
  ]
});

// A hillside for a desktop or a phone turned sideways: the companies spread across, the rock in the middle at the front.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  hillY: 92,
  groups: [
    { x: 130, y: 176, rx: 54, ry: 30 },
    { x: 350, y: 158, rx: 54, ry: 30 },
    { x: 570, y: 176, rx: 54, ry: 30 },
    { x: 238, y: 296, rx: 54, ry: 30 },
    { x: 462, y: 296, rx: 54, ry: 30 }
  ],
  rock: { x: 322, y: 352, w: 56, h: 28 },
  trees: [
    { x: 12, y: 92, w: 22, h: 20 },
    { x: 240, y: 92, w: 26, h: 20 },
    { x: 460, y: 92, w: 26, h: 20 },
    { x: 666, y: 92, w: 22, h: 20 }
  ],
  spawn: { x: 350, y: 414 },
  rockUse: { x: 350, y: 392 },
  lad: { x: 316, y: 394 },
  disciples: [
    { x: 282, y: 372 },
    { x: 418, y: 372 },
    { x: 296, y: 396 },
    { x: 404, y: 396 }
  ],
  store: [190, 254, 318, 382, 446].flatMap(x => [
    { x, y: 400 },
    { x: x + 28, y: 414 }
  ]),
  leftovers: [
    { x: 52, y: 182 },
    { x: 208, y: 182 },
    { x: 272, y: 164 },
    { x: 428, y: 164 },
    { x: 492, y: 182 },
    { x: 648, y: 182 },
    { x: 160, y: 302 },
    { x: 316, y: 302 },
    { x: 384, y: 302 },
    { x: 540, y: 302 },
    { x: 290, y: 372 },
    { x: 410, y: 372 }
  ],
  wander: [
    { x: 240, y: 150 },
    { x: 460, y: 150 },
    { x: 130, y: 250 },
    { x: 570, y: 250 },
    { x: 350, y: 236 },
    { x: 140, y: 360 },
    { x: 560, y: 360 },
    { x: 350, y: 300 },
    { x: 60, y: 130 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// Which hillside fits a box: the wide one when the box is clearly wider than it is tall.
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
