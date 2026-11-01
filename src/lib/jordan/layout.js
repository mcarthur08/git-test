// The bank of the Jordan (Matthew 3:13–17): the deep river, the shallows where John baptizes, the grassy bank where people
// wait and watch, and the way the light of Jesus comes down to the water. Everything is in world units. Like the other
// scenes it comes in two shapes: a tall one for a phone held upright (360 x 540) and a wide one for a desktop or a phone
// turned sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the deep water, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.riverY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the trunk of the willow on the bank
    spec.tree
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    RIVER_Y: spec.riverY,
    // where the shallows end and the dry bank begins
    BANK_Y: spec.bankY,
    TREE: spec.tree,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where John stands in the water to baptize
    JOHN: spec.john,
    // where someone can wade in, in the shallows
    WADE_SPOTS: spec.wade,
    // where you can stand on the bank close to John to listen
    LISTEN_SPOTS: spec.listen,
    // where you can stand to look up at the sky
    LOOK_SPOTS: spec.look,
    // the way the light of Jesus comes: in from the left, along the bank, into the water by John, and out on to the bank
    LIGHT_PATH: spec.light,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A river for a phone held upright: the water across the top, John in the shallows, the willow at the right.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  riverY: 170,
  bankY: 232,
  tree: { x: 300, y: 372, w: 24, h: 22 },
  spawn: { x: 200, y: 470 },
  john: { x: 232, y: 206 },
  wade: [
    { x: 80, y: 208 },
    { x: 130, y: 214 },
    { x: 290, y: 208 },
    { x: 330, y: 216 }
  ],
  listen: [
    { x: 250, y: 268 },
    { x: 210, y: 276 }
  ],
  look: [
    { x: 120, y: 330 },
    { x: 220, y: 350 },
    { x: 80, y: 380 }
  ],
  light: [
    { x: 20, y: 270 },
    { x: 90, y: 262 },
    { x: 184, y: 214 },
    { x: 170, y: 292 }
  ],
  wander: [
    { x: 60, y: 300 },
    { x: 280, y: 300 },
    { x: 100, y: 420 },
    { x: 250, y: 430 },
    { x: 320, y: 270 },
    { x: 40, y: 470 }
  ]
});

// A river for a desktop or a phone turned sideways: the water across the top, John in the shallows, the willow at the right.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  riverY: 120,
  bankY: 172,
  tree: { x: 620, y: 300, w: 26, h: 22 },
  spawn: { x: 380, y: 380 },
  john: { x: 420, y: 150 },
  wade: [
    { x: 160, y: 148 },
    { x: 250, y: 154 },
    { x: 540, y: 148 },
    { x: 620, y: 154 }
  ],
  listen: [
    { x: 450, y: 206 },
    { x: 390, y: 214 }
  ],
  look: [
    { x: 240, y: 300 },
    { x: 480, y: 330 },
    { x: 140, y: 340 }
  ],
  light: [
    { x: 20, y: 212 },
    { x: 200, y: 204 },
    { x: 340, y: 156 },
    { x: 330, y: 250 }
  ],
  wander: [
    { x: 120, y: 240 },
    { x: 560, y: 240 },
    { x: 200, y: 380 },
    { x: 540, y: 370 },
    { x: 640, y: 230 },
    { x: 80, y: 400 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
