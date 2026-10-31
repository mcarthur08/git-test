// The street in Jericho (Luke 19:1–10): a wall of houses along the back (the last one is Zacchaeus's), the road Jesus
// passes along, a crowd along its edges, and the sycamore he climbs. Everything is in world units. Like the other scenes it
// comes in two shapes: a tall one for a phone held upright (360 x 540) and a wide one for a desktop or a phone turned
// sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const TREE = spec.tree;
  const OBSTACLES = [
    // the houses along the back, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.wallY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the trunk of the sycamore
    TREE.trunk
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    WALL_Y: spec.wallY,
    ROAD: spec.road,
    TREE,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where Zacchaeus stands among the crowd, trying to see
    ZACCHAEUS_SPOT: spec.zacchaeus,
    // the front of his house, where he takes Jesus in
    HOUSE_DOOR: spec.door,
    // where each of the crowd stands along the road
    CROWD_SPOTS: spec.crowd,
    // the poor, where they wait and where they gather to be given to
    POOR_SPOTS: spec.poor,
    RECEIVE_SPOTS: spec.receive,
    // the way the light of Jesus passes along the street, from where it comes in to where it comes to the tree
    LIGHT_PATH: spec.light,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// a row of `n` places from (x, y) going right, each `gap` apart
const row = (x, y, n, gap) => Array.from({ length: n }, (_, i) => ({ x: x + i * gap, y }));

// A street for a phone held upright: the road across the middle, the sycamore at the back of it on the right.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  wallY: 130,
  road: { y: 236, h: 104 },
  tree: {
    x: 262,
    y: 252,
    trunk: { x: 254, y: 240, w: 16, h: 14 },
    // where someone stands to climb it, and how high they go
    base: { x: 262, y: 268 },
    seat: { x: 246, y: 268 },
    lift: 46
  },
  spawn: { x: 180, y: 450 },
  zacchaeus: { x: 218, y: 366 },
  door: { x: 312, y: 150 },
  crowd: [...row(32, 366, 9, 33), ...row(46, 230, 5, 36)],
  poor: [
    { x: 60, y: 470 },
    { x: 130, y: 490 },
    { x: 230, y: 490 },
    { x: 300, y: 470 }
  ],
  receive: [
    { x: 266, y: 176 },
    { x: 300, y: 196 },
    { x: 340, y: 176 },
    { x: 280, y: 206 }
  ],
  light: [
    { x: 24, y: 284 },
    { x: 120, y: 284 },
    { x: 214, y: 288 },
    { x: 236, y: 288 }
  ],
  wander: [
    { x: 60, y: 420 },
    { x: 180, y: 420 },
    { x: 300, y: 420 },
    { x: 100, y: 180 },
    { x: 180, y: 190 },
    { x: 140, y: 460 }
  ]
});

// A street for a desktop or a phone turned sideways: the road across the picture, the sycamore beside it on the right.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  wallY: 108,
  road: { y: 188, h: 86 },
  tree: {
    x: 470,
    y: 200,
    trunk: { x: 462, y: 188, w: 16, h: 14 },
    base: { x: 470, y: 216 },
    seat: { x: 452, y: 216 },
    lift: 46
  },
  spawn: { x: 350, y: 380 },
  zacchaeus: { x: 380, y: 304 },
  door: { x: 620, y: 126 },
  crowd: [...row(60, 304, 12, 44), ...row(80, 178, 8, 46)],
  poor: [
    { x: 120, y: 380 },
    { x: 250, y: 400 },
    { x: 450, y: 400 },
    { x: 580, y: 380 }
  ],
  receive: [
    { x: 580, y: 148 },
    { x: 620, y: 166 },
    { x: 660, y: 148 },
    { x: 600, y: 190 }
  ],
  light: [
    { x: 30, y: 232 },
    { x: 250, y: 232 },
    { x: 410, y: 236 },
    { x: 440, y: 236 }
  ],
  wander: [
    { x: 120, y: 340 },
    { x: 350, y: 340 },
    { x: 560, y: 340 },
    { x: 200, y: 150 },
    { x: 340, y: 150 },
    { x: 520, y: 340 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
