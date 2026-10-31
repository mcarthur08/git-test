import { Graphics } from "pixi.js";

// The plain round Jacob's well drawn with simple shapes: a pale noon sky, Mount Gerizim and the hills, the flat-roofed
// houses of Sychar with its gate, dry ground with tufts of grass and stones, the road, the stone well with its beam and
// rope, a waterpot left standing, and the light that stands for Jesus. Colours are warm and bleached by the sun so the
// characters stand out.
const GROUND = 0xdcc38a;
const STONE = 0xa89c88;
const STONE_DARK = 0x7b705f;
const WOOD_DARK = 0x6a4a2e;
const CLAY = 0xb5683a;

// a number from 0 to 1 that is always the same for the same i, so the plain looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawPlain(layout) {
  const { WORLD, SKY_Y, GATE } = layout;
  const g = new Graphics();
  g.rect(0, 0, WORLD.w, SKY_Y).fill(0xcfe6ef);
  g.rect(0, SKY_Y * 0.45, WORLD.w, SKY_Y * 0.3).fill(0xeaf3f0);
  g.circle(WORLD.w * 0.14, SKY_Y * 0.3, 16).fill({ color: 0xfff6c8, alpha: 0.95 });
  g.circle(WORLD.w * 0.14, SKY_Y * 0.3, 30).fill({ color: 0xfff6c8, alpha: 0.25 });
  // Mount Gerizim and the hills behind it
  g.poly([
    0,
    SKY_Y,
    0,
    SKY_Y * 0.7,
    WORLD.w * 0.2,
    SKY_Y * 0.55,
    WORLD.w * 0.42,
    SKY_Y * 0.18,
    WORLD.w * 0.62,
    SKY_Y * 0.62,
    WORLD.w * 0.8,
    SKY_Y * 0.5,
    WORLD.w,
    SKY_Y * 0.66,
    WORLD.w,
    SKY_Y
  ]).fill(0xb8b08e);
  g.poly([
    0,
    SKY_Y,
    0,
    SKY_Y * 0.85,
    WORLD.w * 0.3,
    SKY_Y * 0.72,
    WORLD.w * 0.55,
    SKY_Y * 0.88,
    WORLD.w * 0.85,
    SKY_Y * 0.78,
    WORLD.w,
    SKY_Y * 0.86,
    WORLD.w,
    SKY_Y
  ]).fill(0x9fa97a);
  // the town of Sychar: flat-roofed houses along the horizon, round the gate
  const houses = Math.round(WORLD.w / 50);
  for (let i = 0; i < houses; i++) {
    const x = GATE.x - 90 + i * 30 + rnd(i) * 10;
    if (x < 20 || x > WORLD.w - 40) {
      continue;
    }
    const h = 14 + rnd(i + 20) * 14;
    const w = 20 + rnd(i + 40) * 12;
    g.rect(x, SKY_Y - h, w, h).fill(i % 2 ? 0xe9d9b4 : 0xdcc89c);
    g.rect(x, SKY_Y - h, w, 2.4).fill(0xc9b387);
    g.rect(x + w / 2 - 2, SKY_Y - 7, 4, 7).fill(WOOD_DARK);
  }
  g.rect(GATE.x - 14, SKY_Y - 30, 28, 30).fill(0xd2bc90);
  g.rect(GATE.x - 14, SKY_Y - 32, 28, 3).fill(0xb89f72);
  g.roundRect(GATE.x - 6, SKY_Y - 20, 12, 20, 6).fill(0x4a3a28);
  // the dry plain, with the road coming in from the left and going up to the gate
  g.rect(0, SKY_Y, WORLD.w, WORLD.h - SKY_Y).fill(GROUND);
  for (let i = 0; i < 18; i++) {
    g.ellipse(
      rnd(i + 200) * WORLD.w,
      SKY_Y + 14 + rnd(i + 240) * (WORLD.h - SKY_Y - 28),
      30 + rnd(i + 280) * 44,
      8 + rnd(i + 320) * 12
    ).fill({ color: i % 2 ? 0xe9d3a0 : 0xcdb27a, alpha: 0.4 });
  }
  const road = [
    [0, SKY_Y + (WORLD.h - SKY_Y) * 0.32],
    [WORLD.w * 0.28, SKY_Y + (WORLD.h - SKY_Y) * 0.5],
    [WORLD.w * 0.62, SKY_Y + (WORLD.h - SKY_Y) * 0.28],
    [GATE.x, SKY_Y + 6]
  ];
  road.slice(0, -1).forEach(([x, y], i) => {
    g.moveTo(x, y).lineTo(road[i + 1][0], road[i + 1][1]);
  });
  g.stroke({ width: 22, color: 0xe9d6a6, alpha: 0.7, cap: "round", join: "round" });
  for (let i = 0; i < 40; i++) {
    g.ellipse(
      rnd(i + 400) * WORLD.w,
      SKY_Y + 8 + rnd(i + 460) * (WORLD.h - SKY_Y - 18),
      2,
      1.3
    ).fill({ color: 0xa8916a, alpha: 0.7 });
  }
  for (let i = 0; i < 14; i++) {
    const x = rnd(i + 500) * WORLD.w;
    const y = SKY_Y + 20 + rnd(i + 540) * (WORLD.h - SKY_Y - 40);
    g.moveTo(x, y).lineTo(x - 3, y - 6);
    g.moveTo(x, y).lineTo(x + 1, y - 7);
    g.moveTo(x, y).lineTo(x + 4, y - 5);
  }
  g.stroke({ width: 1.2, color: 0x8a9a52, alpha: 0.8 });
  g.rect(0, SKY_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.1 });
  g.rect(WORLD.w - 8, SKY_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.1 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// Jacob's well seen from a little above: a round stone rim round dark water far down, with a beam across two posts and a
// rope that hangs into it
export function drawWell(w) {
  const g = new Graphics();
  const cx = w.x + w.w / 2;
  const bottom = w.y + w.h;
  g.ellipse(cx, bottom + 2, w.w / 2 + 8, 7).fill({ color: 0x000000, alpha: 0.2 });
  // the stone wall of the well, then its rim, then the dark opening
  g.roundRect(w.x, w.y + w.h * 0.3, w.w, w.h * 0.7, 6).fill(STONE_DARK);
  for (let k = 0; k < 3; k++) {
    g.rect(w.x + 2, w.y + w.h * 0.4 + k * 8, w.w - 4, 1.2).fill({ color: 0x4a4236, alpha: 0.5 });
  }
  g.ellipse(cx, w.y + w.h * 0.34, w.w / 2, w.h * 0.34).fill(STONE);
  g.ellipse(cx, w.y + w.h * 0.34, w.w / 2 - 6, w.h * 0.34 - 5).fill(0x1d2a36);
  g.ellipse(cx - 6, w.y + w.h * 0.3, 7, 2.4).fill({ color: 0x7fb3c8, alpha: 0.5 });
  // the posts and the beam, with the rope
  g.rect(w.x + 4, w.y - 26, 4, 34).fill(WOOD_DARK);
  g.rect(w.x + w.w - 8, w.y - 26, 4, 34).fill(WOOD_DARK);
  g.roundRect(w.x, w.y - 30, w.w, 5, 2).fill(0x8a6a42);
  g.moveTo(cx, w.y - 26).lineTo(cx, w.y + w.h * 0.3);
  g.stroke({ width: 1.2, color: 0xc9b27a });
  g.roundRect(cx - 4, w.y + w.h * 0.1, 8, 7, 1.5).fill(0x8a5e34);
  g.zIndex = bottom;
  return g;
}

// a waterpot left standing on the ground, where the woman set it down
export function drawPot(x, y) {
  const g = new Graphics();
  g.ellipse(x, y + 1, 9, 3).fill({ color: 0x000000, alpha: 0.2 });
  g.poly([x - 5, y, x - 8, y - 9, x - 5, y - 15, x + 5, y - 15, x + 8, y - 9, x + 5, y]).fill(CLAY);
  g.ellipse(x, y - 15, 5, 1.8).fill(0x7a3b22);
  g.rect(x - 7, y - 9, 14, 1.4).fill({ color: 0x7a3b22, alpha: 0.6 });
  g.zIndex = y;
  return g;
}

// the light that stands for Jesus: a warm glow on the ground, with a brighter heart. It is not a person and not drawn like
// one. The engine moves it and fades it.
export function makeLight() {
  const g = new Graphics();
  [
    [46, 24, 0.1],
    [34, 18, 0.14],
    [22, 12, 0.2],
    [11, 6, 0.3]
  ].forEach(([rx, ry, a]) => g.ellipse(0, 0, rx, ry).fill({ color: 0xfff1b0, alpha: a }));
  g.alpha = 0;
  return { g };
}
