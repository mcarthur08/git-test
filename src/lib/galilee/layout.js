// The boat on the Sea of Galilee (Mark 4:35–41): the deck people walk on, the mast, the pillow at the back where he
// slept, and the places water gathers that can be bailed out. Everything is in world units. Like the other scenes it comes
// in two shapes: a tall one for a phone held upright (360 x 540) and a wide one for a desktop or a phone turned sideways
// (700 x 440). The boat lies along the long side of the picture, bow to the right.
import { gridTools } from "../play/grid.js";

function build(spec) {
  const WORLD = spec.world;
  const DECK = spec.deck;
  const MAST = spec.mast;
  const PILLOW = spec.pillow;
  // everything round the deck is sea (or the boat's side), which nobody can walk on
  const OBSTACLES = [
    { x: 0, y: 0, w: WORLD.w, h: DECK.y },
    { x: 0, y: DECK.y + DECK.h, w: WORLD.w, h: WORLD.h - DECK.y - DECK.h },
    { x: 0, y: 0, w: DECK.x, h: WORLD.h },
    { x: DECK.x + DECK.w, y: 0, w: WORLD.w - DECK.x - DECK.w, h: WORLD.h },
    MAST,
    PILLOW
  ];
  const tools = gridTools(WORLD, OBSTACLES);
  return {
    kind: spec.kind,
    WORLD,
    DECK,
    MAST,
    PILLOW,
    OBSTACLES,
    SPAWN: spec.spawn,
    // where each of the crew stands to start with, and at the oars
    CREW_SPOTS: spec.crew,
    // where they stand to wake him
    WAKE_SPOTS: spec.wake,
    // where the water lies on the deck, to be bailed (the more there is, the more of these are wet)
    PUDDLES: spec.puddles,
    // where people stroll while there is nothing to do
    WANDER_SPOTS: spec.wander,
    // the other little ships that were with them (Mark 4:36), drawn on the sea
    LITTLE_SHIPS: spec.ships,
    ...tools
  };
}

// A boat for a phone held upright: along the picture, the bow at the top, the pillow at the bottom.
export const PORTRAIT = build({
  kind: "portrait",
  world: { w: 360, h: 540, tile: 10 },
  deck: { x: 90, y: 150, w: 180, h: 340 },
  mast: { x: 168, y: 250, w: 24, h: 20 },
  pillow: { x: 150, y: 430, w: 60, h: 30 },
  spawn: { x: 180, y: 392 },
  crew: [
    { x: 126, y: 214 },
    { x: 234, y: 214 },
    { x: 126, y: 316 },
    { x: 234, y: 316 }
  ],
  wake: [
    { x: 138, y: 402 },
    { x: 222, y: 402 },
    { x: 180, y: 410 }
  ],
  puddles: [
    { x: 130, y: 184 },
    { x: 230, y: 190 },
    { x: 180, y: 220 },
    { x: 124, y: 284 },
    { x: 236, y: 290 },
    { x: 180, y: 330 },
    { x: 130, y: 360 },
    { x: 232, y: 366 },
    { x: 180, y: 396 },
    { x: 118, y: 420 },
    { x: 242, y: 424 },
    { x: 180, y: 470 }
  ],
  wander: [
    { x: 130, y: 200 },
    { x: 230, y: 210 },
    { x: 130, y: 300 },
    { x: 230, y: 300 },
    { x: 180, y: 350 },
    { x: 120, y: 380 },
    { x: 240, y: 380 }
  ],
  ships: [
    { x: 40, y: 120, s: 0.8 },
    { x: 316, y: 90, s: 0.7 },
    { x: 320, y: 500, s: 0.8 }
  ]
});

// A boat for a desktop or a phone turned sideways: along the picture, the bow to the right, the pillow at the left.
export const LANDSCAPE = build({
  kind: "landscape",
  world: { w: 700, h: 440, tile: 10 },
  deck: { x: 150, y: 130, w: 400, h: 190 },
  mast: { x: 340, y: 210, w: 22, h: 20 },
  pillow: { x: 160, y: 200, w: 30, h: 60 },
  spawn: { x: 260, y: 290 },
  crew: [
    { x: 280, y: 160 },
    { x: 420, y: 160 },
    { x: 280, y: 290 },
    { x: 420, y: 290 }
  ],
  wake: [
    { x: 210, y: 180 },
    { x: 210, y: 280 },
    { x: 220, y: 230 }
  ],
  puddles: [
    { x: 230, y: 150 },
    { x: 290, y: 200 },
    { x: 250, y: 300 },
    { x: 320, y: 150 },
    { x: 330, y: 290 },
    { x: 390, y: 180 },
    { x: 400, y: 250 },
    { x: 440, y: 300 },
    { x: 460, y: 160 },
    { x: 500, y: 210 },
    { x: 510, y: 290 },
    { x: 520, y: 150 }
  ],
  wander: [
    { x: 240, y: 160 },
    { x: 300, y: 250 },
    { x: 400, y: 170 },
    { x: 400, y: 290 },
    { x: 480, y: 230 },
    { x: 520, y: 170 },
    { x: 520, y: 290 }
  ],
  ships: [
    { x: 80, y: 80, s: 0.8 },
    { x: 620, y: 70, s: 0.7 },
    { x: 630, y: 390, s: 0.8 }
  ]
});

export const LAYOUTS = { portrait: PORTRAIT, landscape: LANDSCAPE };

// the wide place if the box is clearly wider than it is tall
export const layoutFor = (w, h) => (h > 0 && w / h >= 1.15 ? LANDSCAPE : PORTRAIT);
