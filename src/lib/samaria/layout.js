// The ground round Jacob's well in Samaria (John 4): a dry plain under the noon sun, the well with its stone rim in the
// middle, the road that comes in from the left, and the gate of Sychar at the far end, where the woman runs to tell the
// town. Everything is in world units. Like the other scenes it comes in two shapes: a tall one for a phone held upright
// (360 x 540) and a wide one for a desktop or a phone turned sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the hills and the town in the distance, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.skyY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the well
    spec.well
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    // where the far hills and the town end and the plain begins
    SKY_Y: spec.skyY,
    WELL: spec.well,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where someone stands to let down the bucket and draw water
    DRAW_SPOTS: spec.draw,
    // where the woman stands to talk with him, and where she sets her waterpot down
    WOMAN_SPOT: spec.woman,
    // the gate of Sychar, where the woman goes to tell the town and where the people come out
    GATE: spec.gate,
    // the way the light of Jesus goes: in along the road, to the edge of the well, and out to meet the town
    LIGHT_PATH: spec.light,
    // where the people of Sychar stand round him at the end
    GATHER_SPOTS: spec.gather,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A plain for a phone held upright: the hills and the town across the top, the well a little above the middle.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  skyY: 150,
  well: { x: 150, y: 290, w: 60, h: 34 },
  spawn: { x: 200, y: 490 },
  draw: [
    { x: 126, y: 312 },
    { x: 236, y: 312 },
    { x: 155, y: 346 },
    { x: 205, y: 346 }
  ],
  woman: { x: 244, y: 338 },
  gate: { x: 300, y: 176 },
  light: [
    { x: 20, y: 250 },
    { x: 180, y: 334 },
    { x: 180, y: 404 }
  ],
  gather: [
    { x: 126, y: 414 },
    { x: 150, y: 448 },
    { x: 212, y: 448 },
    { x: 236, y: 414 },
    { x: 180, y: 462 }
  ],
  wander: [
    { x: 60, y: 260 },
    { x: 90, y: 380 },
    { x: 280, y: 400 },
    { x: 300, y: 290 },
    { x: 60, y: 470 },
    { x: 270, y: 480 },
    { x: 100, y: 330 }
  ]
});

// A plain for a desktop or a phone turned sideways: the hills and the town across the top, the well in the middle.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  skyY: 120,
  well: { x: 320, y: 220, w: 70, h: 38 },
  spawn: { x: 400, y: 400 },
  draw: [
    { x: 296, y: 244 },
    { x: 416, y: 244 },
    { x: 335, y: 280 },
    { x: 375, y: 280 }
  ],
  woman: { x: 440, y: 278 },
  gate: { x: 630, y: 146 },
  light: [
    { x: 20, y: 200 },
    { x: 355, y: 272 },
    { x: 350, y: 350 }
  ],
  gather: [
    { x: 286, y: 350 },
    { x: 310, y: 390 },
    { x: 392, y: 390 },
    { x: 416, y: 350 },
    { x: 350, y: 404 }
  ],
  wander: [
    { x: 120, y: 230 },
    { x: 160, y: 340 },
    { x: 540, y: 340 },
    { x: 570, y: 230 },
    { x: 500, y: 400 },
    { x: 220, y: 400 },
    { x: 620, y: 300 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
