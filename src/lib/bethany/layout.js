// The village of Bethany (John 11–12): the rock with the grave of Lazarus cut into it and the stone that closes it, the
// road in front, and the house of Mary and Martha with the long table where the supper is made. Everything is in world
// units. Like the other scenes it comes in two shapes: a tall one for a phone held upright (360 x 540) and a wide one for a
// desktop or a phone turned sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the hills behind, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.ridgeY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the rock with the grave in it, the house, and the table in front of it
    spec.tomb,
    spec.house,
    spec.table
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    RIDGE_Y: spec.ridgeY,
    TOMB: spec.tomb,
    HOUSE: spec.house,
    TABLE: spec.table,
    OBSTACLES,
    SPAWN: spec.spawn,
    // in front of the grave: where Lazarus comes out, where you stand to roll the stone, and where he is loosed
    MOUTH: spec.mouth,
    PUSH: spec.push,
    RISEN: spec.risen,
    LOOSE: spec.loose,
    // where the neighbours stand to mourn at the grave
    MOURN: spec.mourn,
    // the door of the house, the places round the table, and where Mary stands to anoint
    DOOR: spec.door,
    SEATS: spec.seats,
    MARY: spec.mary,
    POUR: spec.pour,
    // the way the light of Jesus walks: in from the road, to the grave, and on to the head of the table
    LIGHT_PATH: spec.light,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A village for a phone held upright: the grave at the top left, the house at the top right, the table below it.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  ridgeY: 170,
  tomb: { x: 20, y: 150, w: 100, h: 96 },
  house: { x: 196, y: 130, w: 144, h: 116 },
  table: { x: 204, y: 336, w: 120, h: 34 },
  spawn: { x: 180, y: 490 },
  mouth: { x: 70, y: 264 },
  push: { x: 110, y: 270 },
  risen: { x: 60, y: 300 },
  loose: { x: 92, y: 306 },
  mourn: [
    { x: 36, y: 286 },
    { x: 90, y: 330 },
    { x: 126, y: 292 },
    { x: 30, y: 326 }
  ],
  door: { x: 268, y: 266 },
  seats: [
    { x: 220, y: 316 },
    { x: 264, y: 316 },
    { x: 308, y: 316 },
    { x: 220, y: 394 },
    { x: 264, y: 394 },
    { x: 308, y: 394 }
  ],
  mary: { x: 164, y: 384 },
  pour: { x: 190, y: 392 },
  light: [
    { x: 150, y: 330 },
    { x: 112, y: 312 },
    { x: 176, y: 352 }
  ],
  wander: [
    { x: 150, y: 440 },
    { x: 250, y: 450 },
    { x: 60, y: 400 },
    { x: 310, y: 440 },
    { x: 130, y: 380 },
    { x: 40, y: 360 }
  ]
});

// A village for a desktop or a phone turned sideways: the grave at the left, the house and the table at the right.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  ridgeY: 110,
  tomb: { x: 30, y: 90, w: 130, h: 96 },
  house: { x: 440, y: 70, w: 200, h: 116 },
  table: { x: 450, y: 262, w: 180, h: 36 },
  spawn: { x: 330, y: 400 },
  mouth: { x: 95, y: 204 },
  push: { x: 172, y: 206 },
  risen: { x: 100, y: 250 },
  loose: { x: 140, y: 256 },
  mourn: [
    { x: 60, y: 226 },
    { x: 120, y: 280 },
    { x: 160, y: 232 },
    { x: 40, y: 270 }
  ],
  door: { x: 540, y: 206 },
  seats: [
    { x: 480, y: 244 },
    { x: 540, y: 244 },
    { x: 600, y: 244 },
    { x: 480, y: 324 },
    { x: 540, y: 324 },
    { x: 600, y: 324 }
  ],
  mary: { x: 410, y: 314 },
  pour: { x: 434, y: 330 },
  light: [
    { x: 250, y: 250 },
    { x: 190, y: 252 },
    { x: 420, y: 280 }
  ],
  wander: [
    { x: 300, y: 330 },
    { x: 380, y: 380 },
    { x: 520, y: 380 },
    { x: 220, y: 380 },
    { x: 630, y: 370 },
    { x: 300, y: 232 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
