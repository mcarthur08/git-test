// The foot of the cliffs below Mount Hermon at Caesarea Philippi (Matthew 16:13–20): the rock wall with its cave and the
// spring that flows from it, open ground below, and the great rock on which the church is laid. Everything is in world
// units. Like the other scenes it comes in two shapes: a tall one for a phone held upright (360 x 540) and a wide one for a
// desktop or a phone turned sideways (700 x 440).
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const OBSTACLES = [
    // the face of the cliff, and the edges of the picture
    { x: 0, y: 0, w: WORLD.w, h: spec.cliffY },
    { x: 0, y: 0, w: 8, h: WORLD.h },
    { x: WORLD.w - 8, y: 0, w: 8, h: WORLD.h },
    { x: 0, y: WORLD.h - 10, w: WORLD.w, h: 10 },
    // the pool below the cave, and the rock
    spec.spring,
    spec.rock
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    CLIFF_Y: spec.cliffY,
    SPRING: spec.spring,
    ROCK: spec.rock,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where someone can stand to drink at the spring
    SPRING_SPOTS: spec.drink,
    // where stones lie to be picked up, and where each is set on the rock
    STONE_SPOTS: spec.stones,
    BUILD_SPOTS: spec.build,
    // where the disciples stand and listen, and where Peter stands when he answers
    GROUP_SPOTS: spec.group,
    PETER_SPOT: spec.peter,
    // the way the light of Jesus walks: in from the left, among the disciples, to Peter by the rock, and away
    LIGHT_PATH: spec.light,
    WANDER_SPOTS: spec.wander,
    ...tools
  };
}

// A place for a phone held upright: the cliff across the top, the spring at its left, the rock on the right.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  cliffY: 190,
  spring: { x: 40, y: 196, w: 120, h: 40 },
  rock: { x: 214, y: 300, w: 96, h: 56 },
  spawn: { x: 200, y: 490 },
  drink: [
    { x: 60, y: 258 },
    { x: 100, y: 262 },
    { x: 140, y: 258 }
  ],
  stones: [
    { x: 46, y: 430 },
    { x: 120, y: 460 },
    { x: 262, y: 430 },
    { x: 318, y: 390 }
  ],
  build: [
    { x: 226, y: 382 },
    { x: 254, y: 386 },
    { x: 282, y: 382 },
    { x: 308, y: 386 }
  ],
  group: [
    { x: 70, y: 330 },
    { x: 100, y: 346 },
    { x: 46, y: 350 },
    { x: 84, y: 372 }
  ],
  peter: { x: 186, y: 336 },
  light: [
    { x: 20, y: 296 },
    { x: 140, y: 290 },
    { x: 150, y: 376 },
    { x: 320, y: 450 }
  ],
  wander: [
    { x: 180, y: 440 },
    { x: 290, y: 480 },
    { x: 240, y: 250 },
    { x: 300, y: 260 },
    { x: 100, y: 500 },
    { x: 170, y: 270 }
  ]
});

// A place for a desktop or a phone turned sideways: the cliff across the top, the spring at its left, the rock on the right.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  cliffY: 130,
  spring: { x: 70, y: 136, w: 150, h: 44 },
  rock: { x: 470, y: 240, w: 120, h: 60 },
  spawn: { x: 350, y: 390 },
  drink: [
    { x: 100, y: 206 },
    { x: 145, y: 210 },
    { x: 190, y: 206 }
  ],
  stones: [
    { x: 60, y: 340 },
    { x: 200, y: 392 },
    { x: 520, y: 360 },
    { x: 640, y: 300 }
  ],
  build: [
    { x: 490, y: 326 },
    { x: 520, y: 330 },
    { x: 550, y: 326 },
    { x: 580, y: 330 }
  ],
  group: [
    { x: 230, y: 270 },
    { x: 262, y: 290 },
    { x: 200, y: 296 },
    { x: 236, y: 320 }
  ],
  peter: { x: 430, y: 280 },
  light: [
    { x: 20, y: 230 },
    { x: 320, y: 250 },
    { x: 390, y: 322 },
    { x: 660, y: 380 }
  ],
  wander: [
    { x: 330, y: 200 },
    { x: 430, y: 190 },
    { x: 600, y: 190 },
    { x: 330, y: 380 },
    { x: 600, y: 390 },
    { x: 130, y: 300 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
