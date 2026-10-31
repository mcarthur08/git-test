// The upper room in Jerusalem (Luke 22:7–20): a large furnished room with a long low table in the middle, a door in the back
// wall by the stairs, and a place laid at the table for each of eight. Everything is in world units. Like the other scenes it
// comes in two shapes: a tall one for a phone held upright (360 x 540) and a wide one for a desktop or a phone turned
// sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the back wall, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.wallY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the table, and the great water jar on its stand
    spec.table,
    spec.jar
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    WALL_Y: spec.wallY,
    TABLE: spec.table,
    JAR: spec.jar,
    // where the door in the back wall opens onto the floor
    DOOR: spec.door,
    OBSTACLES,
    SPAWN: spec.spawn,
    // the eight places at the table, nearest the head first: where to stand (x, y), which way to face, and where the plate
    // for that place lies on the table (px, py)
    SEATS: spec.seats,
    // where Peter and John start, just in from the door, and where Andrew and James wait
    ENTRY: spec.entry,
    WAIT: spec.wait,
    // where the goodman of the house stands to show the room
    GOODMAN: spec.goodman,
    // the way the light of Jesus comes: in at the door, and to the head of the table
    LIGHT_PATH: spec.light,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// four places down each long side, taken in turn: the one nearest the head, then the one across from it
const rows = (xs, top, bottom, plateTop, plateBottom, face) =>
  xs.flatMap(x => [
    { x, y: top, face, px: x, py: plateTop },
    { x, y: bottom, face, px: x, py: plateBottom }
  ]);

// A room for a phone held upright: the table runs down the room, the head of it nearest the door.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  wallY: 150,
  table: { x: 138, y: 232, w: 84, h: 180 },
  jar: { x: 292, y: 162, w: 44, h: 36 },
  door: { x: 66, y: 190 },
  spawn: { x: 200, y: 490 },
  seats: [256, 298, 340, 382].flatMap(y => [
    { x: 100, y, face: 1, px: 154, py: y - 12 },
    { x: 260, y, face: -1, px: 206, py: y - 12 }
  ]),
  entry: [
    { x: 100, y: 215 },
    { x: 50, y: 250 }
  ],
  wait: [
    { x: 60, y: 330 },
    { x: 60, y: 400 }
  ],
  goodman: { x: 60, y: 205 },
  light: [
    { x: 66, y: 196 },
    { x: 180, y: 210 }
  ],
  wander: [
    { x: 60, y: 300 },
    { x: 300, y: 260 },
    { x: 300, y: 380 },
    { x: 300, y: 450 },
    { x: 180, y: 460 },
    { x: 100, y: 450 }
  ]
});

// A room for a desktop or a phone turned sideways: the table runs across the room, the head of it at the left.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  wallY: 110,
  table: { x: 230, y: 200, w: 240, h: 56 },
  jar: { x: 610, y: 128, w: 44, h: 40 },
  door: { x: 66, y: 150 },
  spawn: { x: 400, y: 400 },
  seats: rows([260, 320, 380, 440], 190, 278, 214, 242, -1),
  entry: [
    { x: 100, y: 190 },
    { x: 60, y: 212 }
  ],
  wait: [
    { x: 120, y: 250 },
    { x: 110, y: 310 }
  ],
  goodman: { x: 66, y: 168 },
  light: [
    { x: 66, y: 156 },
    { x: 196, y: 228 }
  ],
  wander: [
    { x: 110, y: 270 },
    { x: 150, y: 340 },
    { x: 560, y: 210 },
    { x: 590, y: 320 },
    { x: 480, y: 390 },
    { x: 300, y: 370 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
