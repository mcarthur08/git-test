import { Graphics } from "pixi.js";

// The shore at Capernaum drawn with simple shapes: sky, far hills, the sea and its shallows with a line of foam, sand
// with pebbles, a fishing boat drawn up on the beach, heaps of net to mend, nets lying where they were dropped, the ring of
// a net cast on the water, and the light that stands for Jesus walking along the shore. Colours are soft and warm so the
// characters stand out.
const SAND = 0xe3cb95;
const WOOD = 0xb08552;
const WOOD_DARK = 0x7d5a32;
const NET = 0xc9b38a;

// a number from 0 to 1 that is always the same for the same i, so the shore looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawShore(layout) {
  const { WORLD, SEA_Y, SAND_Y } = layout;
  const horizon = SEA_Y * 0.5;
  const g = new Graphics();
  g.rect(0, 0, WORLD.w, horizon).fill(0xbfe3f2);
  g.rect(0, horizon * 0.55, WORLD.w, horizon * 0.25).fill(0xe6f2f4);
  g.poly([
    0,
    horizon,
    WORLD.w * 0.16,
    horizon * 0.5,
    WORLD.w * 0.38,
    horizon * 0.82,
    WORLD.w * 0.62,
    horizon * 0.42,
    WORLD.w * 0.86,
    horizon * 0.78,
    WORLD.w,
    horizon * 0.55,
    WORLD.w,
    horizon,
    0,
    horizon
  ]).fill(0xa9c4a0);
  // deep water, then the shallows
  g.rect(0, horizon, WORLD.w, SEA_Y - horizon).fill(0x2f7391);
  g.rect(0, SEA_Y, WORLD.w, SAND_Y - SEA_Y).fill(0x62b0c4);
  for (let i = 0; i < 14; i++) {
    g.ellipse(
      rnd(i) * WORLD.w,
      horizon + rnd(i + 30) * (SAND_Y - horizon),
      30 + rnd(i + 60) * 50,
      4 + rnd(i + 90) * 6
    ).fill({ color: 0xffffff, alpha: 0.12 });
  }
  for (let i = 0; i < 10; i++) {
    g.rect(
      rnd(i + 120) * WORLD.w,
      horizon + 8 + rnd(i + 150) * (SEA_Y - horizon - 14),
      16,
      1.4
    ).fill({
      color: 0xffffff,
      alpha: 0.45
    });
  }
  // the sand, with a line of foam where the water ends
  g.rect(0, SAND_Y, WORLD.w, WORLD.h - SAND_Y).fill(SAND);
  g.rect(0, SAND_Y - 3, WORLD.w, 4).fill({ color: 0xffffff, alpha: 0.75 });
  for (let x = -10; x < WORLD.w + 20; x += 26) {
    g.ellipse(x + 13, SAND_Y - 1, 15, 3).fill({ color: 0xffffff, alpha: 0.6 });
  }
  for (let i = 0; i < 20; i++) {
    g.ellipse(
      rnd(i + 200) * WORLD.w,
      SAND_Y + 12 + rnd(i + 240) * (WORLD.h - SAND_Y - 22),
      30 + rnd(i + 280) * 40,
      8 + rnd(i + 320) * 12
    ).fill({ color: i % 2 ? 0xedd7a2 : 0xd6bb82, alpha: 0.35 });
  }
  for (let i = 0; i < 60; i++) {
    g.ellipse(
      rnd(i + 400) * WORLD.w,
      SAND_Y + 8 + rnd(i + 460) * (WORLD.h - SAND_Y - 18),
      1.8,
      1.2
    ).fill({ color: 0xa8916a, alpha: 0.7 });
  }
  g.rect(0, SAND_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(WORLD.w - 8, SAND_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// the fishing boat drawn up on the sand, seen from the side, with its mast laid down and a net over the side
export function drawBoat(b) {
  const g = new Graphics();
  const bottom = b.y + b.h;
  g.ellipse(b.x + b.w / 2, bottom + 2, b.w / 2 + 8, 7).fill({ color: 0x000000, alpha: 0.2 });
  // the hull curves up at each end
  g.poly([
    b.x - 8,
    b.y + 6,
    b.x + 14,
    b.y + 12,
    b.x + b.w - 14,
    b.y + 12,
    b.x + b.w + 10,
    b.y,
    b.x + b.w - 10,
    bottom,
    b.x + 14,
    bottom
  ]).fill(WOOD_DARK);
  g.poly([
    b.x + 4,
    b.y + 12,
    b.x + b.w - 4,
    b.y + 12,
    b.x + b.w - 14,
    bottom - 6,
    b.x + 18,
    bottom - 6
  ]).fill(WOOD);
  for (let k = 1; k < 3; k++) {
    g.rect(b.x + 14, b.y + 12 + k * ((b.h - 18) / 3), b.w - 24, 1.4).fill({
      color: WOOD_DARK,
      alpha: 0.55
    });
  }
  g.rect(b.x + 6, b.y + 9, b.w - 8, 4).fill(0x6a4a2e);
  // the mast laid along the side, with the sail furled on it
  g.roundRect(b.x + 16, b.y + 1, b.w - 30, 5, 2).fill(0xe8dcc0);
  g.roundRect(b.x + 16, b.y + 1, b.w - 30, 5, 2).stroke({ width: 1, color: 0xb9a888 });
  // a net hanging over the side
  g.poly([b.x + 40, b.y + 10, b.x + 78, b.y + 10, b.x + 72, b.y + 30, b.x + 46, b.y + 30]).fill({
    color: NET,
    alpha: 0.85
  });
  for (let k = 0; k < 4; k++) {
    g.rect(b.x + 44 + k * 8, b.y + 10, 1, 20).fill({ color: WOOD_DARK, alpha: 0.5 });
  }
  g.zIndex = bottom;
  return g;
}

// a heap of net with a rip in it, which can be mended: it is drawn again, tidy and whole, once it is
export function makeHeap(spot) {
  const g = new Graphics();
  const draw = mended => {
    g.clear();
    const x = spot.x;
    const y = spot.y - 14;
    g.ellipse(x, y + 8, 18, 5).fill({ color: 0x000000, alpha: 0.18 });
    g.ellipse(x, y + 2, 16, 8).fill({ color: NET, alpha: 0.95 });
    for (let k = -3; k <= 3; k++) {
      g.moveTo(x + k * 4.4, y - 5).lineTo(x + k * 4.4 + 2, y + 9);
    }
    g.stroke({ width: 0.9, color: WOOD_DARK, alpha: 0.6 });
    if (mended) {
      g.circle(x - 6, y, 1.8).fill(0x7fbf6a);
      g.circle(x + 4, y + 3, 1.8).fill(0x7fbf6a);
    } else {
      // the rip
      g.poly([x - 4, y - 3, x + 3, y, x + 6, y + 6, x, y + 4]).fill({ color: SAND, alpha: 1 });
    }
  };
  draw(false);
  g.zIndex = spot.y - 4;
  return {
    g,
    mended: false,
    set(v) {
      this.mended = v;
      draw(v);
    }
  };
}

// a net lying where it was dropped, in the shallows
export function drawNetLying(x, y) {
  const g = new Graphics();
  g.ellipse(x, y + 4, 22, 7).fill({ color: NET, alpha: 0.75 });
  for (let k = -4; k <= 4; k++) {
    g.moveTo(x + k * 4.6, y - 2).lineTo(x + k * 4.6 + 2, y + 10);
  }
  g.stroke({ width: 0.8, color: WOOD_DARK, alpha: 0.5 });
  return g;
}

// the ring of a net as it spreads over the water: the engine grows it, holds it, and shrinks it as the net is hauled in
export function makeNetRing(x, y) {
  const g = new Graphics();
  g.ellipse(0, 0, 30, 11).fill({ color: NET, alpha: 0.35 });
  g.ellipse(0, 0, 30, 11).stroke({ width: 1.6, color: 0xefe2c0, alpha: 0.9 });
  for (let k = -3; k <= 3; k++) {
    g.moveTo(k * 8, -10).lineTo(k * 8, 10);
  }
  g.stroke({ width: 0.8, color: 0xefe2c0, alpha: 0.6 });
  g.position.set(x, y);
  return g;
}

// The light that stands for Jesus: a warm glow on the sand, with a brighter heart. It is not a person and not drawn like
// one. The engine moves it along the shore and fades it.
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
