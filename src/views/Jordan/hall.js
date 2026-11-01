import { Container, Graphics } from "pixi.js";

// The Jordan drawn with simple shapes: sky, far hills, the deep river and its shallows with a line of foam, a grassy bank
// with reeds and stones, a willow, the ripples of someone wading, the light that stands for Jesus, the shaft of light from
// the opened heavens, and the dove. Colours are soft so the characters stand out.
const GRASS = 0xa9bf72;
const GRASS_DARK = 0x7f9a52;
const BARK = 0x6a4a30;
const LEAF = 0x6f9a4a;

// a number from 0 to 1 that is always the same for the same i, so the river looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawRiver(layout) {
  const { WORLD, RIVER_Y, BANK_Y } = layout;
  const horizon = RIVER_Y * 0.5;
  const g = new Graphics();
  g.rect(0, 0, WORLD.w, horizon).fill(0xcfe6f0);
  g.rect(0, horizon * 0.55, WORLD.w, horizon * 0.25).fill(0xf0f3ee);
  g.poly([
    0,
    horizon,
    WORLD.w * 0.12,
    horizon * 0.6,
    WORLD.w * 0.34,
    horizon * 0.85,
    WORLD.w * 0.58,
    horizon * 0.5,
    WORLD.w * 0.84,
    horizon * 0.8,
    WORLD.w,
    horizon * 0.6,
    WORLD.w,
    horizon,
    0,
    horizon
  ]).fill(0xb7c49a);
  // the far bank, then the deep water, then the shallows
  g.rect(0, horizon, WORLD.w, RIVER_Y - horizon).fill(0x3f7f8f);
  g.rect(0, horizon, WORLD.w, 6).fill(GRASS_DARK);
  g.rect(0, RIVER_Y, WORLD.w, BANK_Y - RIVER_Y).fill(0x7bbcb4);
  for (let i = 0; i < 14; i++) {
    g.ellipse(
      rnd(i) * WORLD.w,
      horizon + 8 + rnd(i + 30) * (BANK_Y - horizon - 8),
      30 + rnd(i + 60) * 50,
      3 + rnd(i + 90) * 5
    ).fill({ color: 0xffffff, alpha: 0.13 });
  }
  // the current: short pale streaks along the river
  for (let i = 0; i < 14; i++) {
    g.rect(
      rnd(i + 120) * WORLD.w,
      horizon + 12 + rnd(i + 150) * (RIVER_Y - horizon - 18),
      22,
      1.4
    ).fill({
      color: 0xffffff,
      alpha: 0.4
    });
  }
  // the grassy bank, with a line of foam where the water ends
  g.rect(0, BANK_Y, WORLD.w, WORLD.h - BANK_Y).fill(GRASS);
  g.rect(0, BANK_Y - 3, WORLD.w, 4).fill({ color: 0xffffff, alpha: 0.7 });
  for (let x = -10; x < WORLD.w + 20; x += 28) {
    g.ellipse(x + 14, BANK_Y - 1, 16, 3).fill({ color: 0xffffff, alpha: 0.55 });
  }
  for (let i = 0; i < 22; i++) {
    g.ellipse(
      rnd(i + 200) * WORLD.w,
      BANK_Y + 12 + rnd(i + 240) * (WORLD.h - BANK_Y - 22),
      30 + rnd(i + 280) * 40,
      8 + rnd(i + 320) * 12
    ).fill({ color: i % 2 ? 0xbcd085 : GRASS_DARK, alpha: 0.35 });
  }
  // stones on the bank, and a few reeds standing in the shallows
  for (let i = 0; i < 40; i++) {
    g.ellipse(
      rnd(i + 400) * WORLD.w,
      BANK_Y + 8 + rnd(i + 460) * (WORLD.h - BANK_Y - 18),
      2.2,
      1.4
    ).fill({ color: 0x9a9384, alpha: 0.75 });
  }
  for (let i = 0; i < 12; i++) {
    const x = rnd(i + 500) * WORLD.w;
    const y = BANK_Y - 4 - rnd(i + 540) * 8;
    for (let k = -1; k <= 1; k++) {
      g.moveTo(x + k * 3, y).lineTo(x + k * 5, y - 14 - rnd(i + k) * 8);
    }
    g.stroke({ width: 1.4, color: 0x587a3a, alpha: 0.9 });
  }
  g.rect(0, BANK_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(WORLD.w - 8, BANK_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// the willow on the bank: a trunk at the obstacle and a drooping crown above it
export function drawWillow(t) {
  const g = new Graphics();
  const cx = t.x + t.w / 2;
  const bottom = t.y + t.h;
  g.ellipse(cx, bottom, t.w / 2 + 14, 6).fill({ color: 0x000000, alpha: 0.2 });
  g.poly([cx - 7, bottom, cx - 4, t.y - 40, cx + 4, t.y - 40, cx + 7, bottom]).fill(BARK);
  g.ellipse(cx, t.y - 52, 38, 26).fill(LEAF);
  g.ellipse(cx - 18, t.y - 44, 22, 16).fill({ color: 0x86b05a, alpha: 0.9 });
  for (let k = -4; k <= 4; k++) {
    g.moveTo(cx + k * 8, t.y - 36).lineTo(cx + k * 9, t.y - 6 + (k % 2) * 6);
  }
  g.stroke({ width: 2, color: LEAF, alpha: 0.85 });
  g.zIndex = bottom;
  return g;
}

// the rings of a foot or a body in the water: the engine grows them and fades them
export function makeRipple(x, y) {
  const g = new Graphics();
  g.ellipse(0, 0, 26, 8).stroke({ width: 1.6, color: 0xffffff, alpha: 0.9 });
  g.ellipse(0, 0, 16, 5).stroke({ width: 1.2, color: 0xffffff, alpha: 0.7 });
  g.position.set(x, y);
  return g;
}

// The light that stands for Jesus: a warm glow, with a brighter heart. It is not a person and not drawn like one. The
// engine moves it down to the water and fades it.
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

// the shaft of light from the opened heavens, wide at the top and narrow where it falls on the light below it
export function makeRays() {
  const g = new Graphics();
  g.poly([-70, -420, 70, -420, 16, 0, -16, 0]).fill({ color: 0xfff6c8, alpha: 0.16 });
  g.poly([-34, -420, 34, -420, 9, 0, -9, 0]).fill({ color: 0xfffbe6, alpha: 0.2 });
  g.alpha = 0;
  return { g };
}

// A white dove seen from the front, with two wings that the engine flaps (`flap` takes a number that grows with time).
export function makeDove() {
  const g = new Container();
  const wing = side => {
    const w = new Graphics();
    w.poly([0, 0, side * 22, -10, side * 26, 2, side * 10, 6]).fill(0xffffff);
    w.poly([side * 8, 0, side * 22, -10, side * 26, 2]).fill({ color: 0xd9e4ee, alpha: 0.7 });
    w.position.set(side * 3, -2);
    return w;
  };
  const left = wing(-1);
  const right = wing(1);
  const body = new Graphics();
  body.ellipse(0, 3, 5, 8).fill(0xffffff);
  body.circle(0, -7, 3.6).fill(0xffffff);
  body.poly([-1.6, -7, 1.6, -7, 0, -3.8]).fill(0xe39a3a);
  body.circle(1.4, -8, 0.7).fill(0x2c2c2c);
  body.poly([-3, 9, 3, 9, 0, 17]).fill(0xe8eef4);
  g.addChild(left, right, body);
  g.alpha = 0;
  return {
    g,
    flap(t) {
      const s = 0.55 + 0.45 * Math.sin(t * 14);
      left.scale.y = s;
      right.scale.y = s;
    }
  };
}
