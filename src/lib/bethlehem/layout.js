// The fields outside Bethlehem and the stable (Luke 2:8–20): the hills and the town on the skyline, the field where the
// shepherds keep their fire and their flock, and the stable with its manger at the other side, with a path between. The light
// of the angel shines over the field and then rests over the stable. Everything is in world units. Like the other scenes it
// comes in two shapes: a tall one for a phone held upright (360 x 540) and a wide one for a desktop or a phone turned
// sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the hills and the sky, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.hillY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the stable, and the shepherds' fire
    spec.stable,
    spec.fire
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    HILL_Y: spec.hillY,
    STABLE: spec.stable,
    FIRE: spec.fire,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where the manger stands in the stable, and where Mary and Joseph stand beside it
    MANGER: spec.manger,
    HOLY: spec.holy,
    // where the shepherds keep watch round the fire
    SHEPHERD_SPOTS: spec.shepherds,
    // where the shepherds (and you) stand to see the child, in front of the stable
    VISIT_SPOTS: spec.visit,
    // where the sheep graze, to be gathered, and where they stand once gathered, near the fire
    SHEEP_SPOTS: spec.sheep,
    FLOCK_SPOTS: spec.flock,
    // where the light is: over the field for the angel, over the stable at the end
    GLORY: spec.glory,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A field for a phone held upright: the fire at the top left, the stable at the bottom right.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  hillY: 160,
  stable: { x: 196, y: 300, w: 132, h: 64 },
  fire: { x: 56, y: 236, w: 28, h: 20 },
  spawn: { x: 180, y: 480 },
  manger: { x: 262, y: 356 },
  holy: [
    { x: 232, y: 386 },
    { x: 294, y: 386 }
  ],
  shepherds: [
    { x: 40, y: 280 },
    { x: 98, y: 284 },
    { x: 114, y: 246 }
  ],
  visit: [
    { x: 212, y: 422 },
    { x: 262, y: 428 },
    { x: 312, y: 422 },
    { x: 262, y: 462 }
  ],
  sheep: [
    { x: 140, y: 220 },
    { x: 56, y: 336 },
    { x: 140, y: 340 },
    { x: 96, y: 410 }
  ],
  flock: [
    { x: 30, y: 216 },
    { x: 98, y: 212 },
    { x: 140, y: 270 },
    { x: 40, y: 312 }
  ],
  glory: [
    { x: 110, y: 72 },
    { x: 150, y: 100 },
    { x: 262, y: 268 }
  ],
  wander: [
    { x: 170, y: 230 },
    { x: 200, y: 260 },
    { x: 130, y: 330 },
    { x: 80, y: 430 },
    { x: 200, y: 510 },
    { x: 310, y: 270 }
  ]
});

// A field for a desktop or a phone turned sideways: the fire at the left, the stable at the right.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  hillY: 120,
  stable: { x: 470, y: 210, w: 170, h: 70 },
  fire: { x: 90, y: 190, w: 30, h: 22 },
  spawn: { x: 340, y: 390 },
  manger: { x: 555, y: 272 },
  holy: [
    { x: 512, y: 304 },
    { x: 600, y: 304 }
  ],
  shepherds: [
    { x: 70, y: 236 },
    { x: 138, y: 240 },
    { x: 154, y: 200 }
  ],
  visit: [
    { x: 490, y: 340 },
    { x: 555, y: 348 },
    { x: 620, y: 340 },
    { x: 555, y: 385 }
  ],
  sheep: [
    { x: 200, y: 176 },
    { x: 90, y: 300 },
    { x: 220, y: 300 },
    { x: 160, y: 370 }
  ],
  flock: [
    { x: 40, y: 160 },
    { x: 150, y: 158 },
    { x: 190, y: 236 },
    { x: 50, y: 270 }
  ],
  glory: [
    { x: 150, y: 52 },
    { x: 220, y: 80 },
    { x: 555, y: 176 }
  ],
  wander: [
    { x: 260, y: 200 },
    { x: 330, y: 260 },
    { x: 400, y: 330 },
    { x: 240, y: 370 },
    { x: 420, y: 170 },
    { x: 110, y: 330 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
