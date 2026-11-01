// The shore of the sea of Galilee at Capernaum (Matthew 4:18–22): the sea and the shallows where nets are cast, the sand
// where a fishing boat is drawn up and nets are mended, and the way Jesus walks along the shore. Everything is in world
// units. Like the other scenes it comes in two shapes: a tall one for a phone held upright (360 x 540) and a wide one for a
// desktop or a phone turned sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the deep water, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.seaY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the boat drawn up on the sand
    spec.boat
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    SEA_Y: spec.seaY,
    // where the shallows end and the dry sand begins
    SAND_Y: spec.sandY,
    BOAT: spec.boat,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where a net can be cast from, in the shallows
    NET_SPOTS: spec.nets,
    // where Peter and Andrew start, casting their nets
    FISHERS: spec.fishers,
    // where nets lie to be mended beside the boat, and the places to stand and mend them
    MEND_SPOTS: spec.mend,
    // where those who follow him stand, behind the light at the end of the shore
    FOLLOW_SPOTS: spec.follow,
    // the way the light of Jesus walks: in from the left, by the fishers, by the boat, and on along the shore
    LIGHT_PATH: spec.light,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A shore for a phone held upright: the sea across the top, the boat on the left of the sand.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  seaY: 188,
  sandY: 238,
  boat: { x: 34, y: 316, w: 116, h: 46 },
  spawn: { x: 200, y: 470 },
  nets: [
    { x: 96, y: 214 },
    { x: 150, y: 218 },
    { x: 210, y: 214 },
    { x: 266, y: 218 }
  ],
  fishers: [
    { x: 126, y: 216 },
    { x: 236, y: 216 }
  ],
  mend: [
    { x: 50, y: 380 },
    { x: 92, y: 384 },
    { x: 134, y: 380 },
    { x: 176, y: 352 }
  ],
  follow: [
    { x: 296, y: 296 },
    { x: 272, y: 312 },
    { x: 300, y: 326 },
    { x: 274, y: 334 }
  ],
  light: [
    { x: 20, y: 274 },
    { x: 180, y: 262 },
    { x: 196, y: 346 },
    { x: 332, y: 300 }
  ],
  wander: [
    { x: 80, y: 430 },
    { x: 180, y: 420 },
    { x: 280, y: 440 },
    { x: 240, y: 380 },
    { x: 100, y: 290 },
    { x: 300, y: 260 }
  ]
});

// A shore for a desktop or a phone turned sideways: the sea across the top, the boat at the left of the sand.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  seaY: 128,
  sandY: 180,
  boat: { x: 70, y: 252, w: 140, h: 50 },
  spawn: { x: 400, y: 380 },
  nets: [
    { x: 200, y: 154 },
    { x: 290, y: 158 },
    { x: 380, y: 154 },
    { x: 470, y: 158 }
  ],
  fishers: [
    { x: 250, y: 156 },
    { x: 400, y: 156 }
  ],
  mend: [
    { x: 90, y: 322 },
    { x: 140, y: 326 },
    { x: 190, y: 322 },
    { x: 240, y: 298 }
  ],
  follow: [
    { x: 620, y: 246 },
    { x: 590, y: 262 },
    { x: 624, y: 278 },
    { x: 594, y: 292 }
  ],
  light: [
    { x: 20, y: 214 },
    { x: 330, y: 202 },
    { x: 262, y: 304 },
    { x: 660, y: 254 }
  ],
  wander: [
    { x: 320, y: 270 },
    { x: 440, y: 310 },
    { x: 540, y: 350 },
    { x: 320, y: 370 },
    { x: 560, y: 220 },
    { x: 140, y: 230 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
