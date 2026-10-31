// Nazareth and the road up to Jerusalem (Luke 2:39–52): the carpenter's workshop with its benches, Joseph and Mary's house
// where the bundles for the feast are packed, a road that runs out of the village, and, at the far end of it, the porch of
// the temple court where the teachers sit. Everything is in world units. Like the other scenes it comes in two shapes: a
// tall one for a phone held upright (360 x 540) and a wide one for a desktop or a phone turned sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the hills behind the village, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.topY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the house, the workshop, and the back wall of the temple court
    spec.house,
    spec.shop,
    spec.court
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    TOP_Y: spec.topY,
    HOUSE: spec.house,
    SHOP: spec.shop,
    COURT: spec.court,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where a board can be planed, in front of the workshop
    BOARD_SPOTS: spec.boards,
    // where a bundle for the feast can be packed, in front of the house
    BUNDLE_SPOTS: spec.bundles,
    // the places along the road where they look for him
    SEEK_SPOTS: spec.seek,
    // where the two teachers sit, and where Joseph and Mary stand when they find him
    TEACHER_SPOTS: spec.teachers,
    VISIT_SPOTS: spec.visit,
    // the far end of the road: a day's journey from Jerusalem
    ROAD_FAR: spec.far,
    // the way the light of Jesus goes: the workshop, the house door, the court, and home again
    LIGHT_PATH: spec.light,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A village for a phone held upright: the house and the workshop on the left, the court on the right, and the road between.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  topY: 170,
  house: { x: 20, y: 186, w: 120, h: 76 },
  shop: { x: 20, y: 340, w: 120, h: 56 },
  court: { x: 200, y: 186, w: 140, h: 44 },
  spawn: { x: 210, y: 470 },
  boards: [
    { x: 50, y: 418 },
    { x: 90, y: 422 },
    { x: 130, y: 418 },
    { x: 172, y: 380 }
  ],
  bundles: [
    { x: 50, y: 284 },
    { x: 90, y: 288 },
    { x: 130, y: 284 },
    { x: 170, y: 250 }
  ],
  seek: [
    { x: 190, y: 340 },
    { x: 270, y: 400 },
    { x: 320, y: 330 },
    { x: 180, y: 450 }
  ],
  teachers: [
    { x: 226, y: 254 },
    { x: 314, y: 254 }
  ],
  visit: [
    { x: 244, y: 292 },
    { x: 296, y: 296 }
  ],
  far: { x: 320, y: 490 },
  light: [
    { x: 104, y: 402 },
    { x: 104, y: 290 },
    { x: 270, y: 262 },
    { x: 150, y: 400 }
  ],
  wander: [
    { x: 80, y: 310 },
    { x: 180, y: 300 },
    { x: 260, y: 360 },
    { x: 120, y: 450 },
    { x: 300, y: 440 },
    { x: 200, y: 400 }
  ]
});

// A village for a desktop or a phone turned sideways: the house and the workshop at the left, the court at the right.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  topY: 120,
  house: { x: 30, y: 134, w: 150, h: 70 },
  shop: { x: 30, y: 290, w: 150, h: 60 },
  court: { x: 480, y: 134, w: 190, h: 46 },
  spawn: { x: 340, y: 390 },
  boards: [
    { x: 60, y: 372 },
    { x: 110, y: 376 },
    { x: 160, y: 372 },
    { x: 212, y: 340 }
  ],
  bundles: [
    { x: 60, y: 226 },
    { x: 110, y: 230 },
    { x: 160, y: 226 },
    { x: 212, y: 200 }
  ],
  seek: [
    { x: 270, y: 290 },
    { x: 380, y: 250 },
    { x: 520, y: 330 },
    { x: 300, y: 400 }
  ],
  teachers: [
    { x: 520, y: 204 },
    { x: 630, y: 204 }
  ],
  visit: [
    { x: 540, y: 250 },
    { x: 610, y: 254 }
  ],
  far: { x: 660, y: 400 },
  light: [
    { x: 110, y: 376 },
    { x: 110, y: 234 },
    { x: 575, y: 212 },
    { x: 240, y: 376 }
  ],
  wander: [
    { x: 260, y: 230 },
    { x: 400, y: 300 },
    { x: 520, y: 360 },
    { x: 330, y: 340 },
    { x: 600, y: 320 },
    { x: 250, y: 400 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
