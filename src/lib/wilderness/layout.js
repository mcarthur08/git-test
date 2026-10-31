// The wilderness of Judaea (Matthew 4:1–11): open desert with flat rocks to pray on, a field of stones, the pinnacle of the
// temple standing up on one side and a high mountain on the other, and the way Jesus walks between them. Everything is in
// world units. Like the other scenes it comes in two shapes: a tall one for a phone held upright (360 x 540) and a wide one
// for a desktop or a phone turned sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the far hills and sky, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.topY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the pinnacle and the mountain: what stops someone is the foot of each
    spec.tower,
    spec.mount
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    // where the walkable desert begins
    TOP_Y: spec.topY,
    // the temple pinnacle and the mountain: a footprint on the ground, drawn rising `rise` above its bottom edge
    TOWER: spec.tower,
    MOUNT: spec.mount,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where stones lie to be gathered, and the cairn they are carried to
    STONE_SPOTS: spec.stones,
    CAIRN: spec.cairn,
    // flat rocks to pray on
    PRAY_SPOTS: spec.pray,
    // the way the light of Jesus walks: in from the left, to the stones, to the foot of the pinnacle, to the foot of the
    // mountain, and out to open ground where the angels come
    LIGHT_PATH: spec.light,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A wilderness for a phone held upright: the hills across the top, the mountain on the left and the pinnacle on the right.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  topY: 150,
  tower: { x: 236, y: 196, w: 70, h: 30, rise: 112 },
  mount: { x: 24, y: 176, w: 120, h: 34, rise: 122 },
  spawn: { x: 190, y: 490 },
  stones: [
    { x: 70, y: 400 },
    { x: 130, y: 446 },
    { x: 250, y: 414 },
    { x: 304, y: 368 }
  ],
  cairn: { x: 190, y: 340 },
  pray: [
    { x: 54, y: 320 },
    { x: 306, y: 296 },
    { x: 100, y: 506 }
  ],
  light: [
    { x: 20, y: 430 },
    { x: 160, y: 380 },
    { x: 270, y: 262 },
    { x: 90, y: 266 },
    { x: 190, y: 400 }
  ],
  wander: [
    { x: 70, y: 340 },
    { x: 260, y: 340 },
    { x: 120, y: 450 },
    { x: 290, y: 450 },
    { x: 200, y: 290 },
    { x: 40, y: 470 }
  ]
});

// A wilderness for a desktop or a phone turned sideways: the mountain at the left and the pinnacle at the right.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  topY: 110,
  tower: { x: 520, y: 148, w: 80, h: 30, rise: 100 },
  mount: { x: 70, y: 138, w: 140, h: 34, rise: 110 },
  spawn: { x: 380, y: 390 },
  stones: [
    { x: 120, y: 340 },
    { x: 230, y: 392 },
    { x: 440, y: 396 },
    { x: 590, y: 340 }
  ],
  cairn: { x: 330, y: 270 },
  pray: [
    { x: 50, y: 270 },
    { x: 650, y: 250 },
    { x: 560, y: 410 }
  ],
  light: [
    { x: 20, y: 340 },
    { x: 270, y: 310 },
    { x: 560, y: 214 },
    { x: 140, y: 214 },
    { x: 370, y: 330 }
  ],
  wander: [
    { x: 200, y: 280 },
    { x: 440, y: 290 },
    { x: 330, y: 380 },
    { x: 540, y: 330 },
    { x: 400, y: 200 },
    { x: 100, y: 400 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
