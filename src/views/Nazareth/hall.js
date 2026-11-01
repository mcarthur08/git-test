import { Graphics } from "pixi.js";

// Nazareth drawn with simple shapes: sky and hills, dusty ground with a road running out of the village, a flat-roofed
// house, the carpenter's open workshop, the pillared porch of the temple court, heaps of rough boards to plane, bundles to
// pack for the feast, and the light that stands for Jesus. Colours are soft and warm so the characters stand out.
const DUST = 0xe0cc9a;
const ROAD = 0xeedcae;
const CLAY = 0xe8d6ae;
const CLAY_DARK = 0xc9b283;
const WOOD = 0xb08552;
const WOOD_DARK = 0x7d5a32;
const STONE = 0xd9d2c2;
const STONE_DARK = 0xa9a08c;

// a number from 0 to 1 that is always the same for the same i, so the village looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawVillage(layout) {
  const { WORLD, TOP_Y, BUNDLE_SPOTS, SEEK_SPOTS, VISIT_SPOTS, SPAWN, ROAD_FAR } = layout;
  const g = new Graphics();
  g.rect(0, 0, WORLD.w, TOP_Y).fill(0xcfe6f2);
  g.rect(0, TOP_Y * 0.5, WORLD.w, TOP_Y * 0.2).fill(0xeaf3f1);
  // far hills, then nearer ones with a few olive trees
  g.poly([
    0,
    TOP_Y,
    0,
    TOP_Y * 0.62,
    WORLD.w * 0.22,
    TOP_Y * 0.42,
    WORLD.w * 0.5,
    TOP_Y * 0.66,
    WORLD.w * 0.78,
    TOP_Y * 0.38,
    WORLD.w,
    TOP_Y * 0.6,
    WORLD.w,
    TOP_Y
  ]).fill(0xb3c6a0);
  g.poly([
    0,
    TOP_Y,
    0,
    TOP_Y * 0.82,
    WORLD.w * 0.3,
    TOP_Y * 0.66,
    WORLD.w * 0.6,
    TOP_Y * 0.86,
    WORLD.w,
    TOP_Y * 0.7,
    WORLD.w,
    TOP_Y
  ]).fill(0x93ad7c);
  for (let i = 0; i < 9; i++) {
    const x = 14 + rnd(i + 5) * (WORLD.w - 28);
    const y = TOP_Y * (0.8 + rnd(i + 20) * 0.14);
    g.rect(x - 1, y, 2, 6).fill(0x6b5237);
    g.ellipse(x, y - 1, 7, 5).fill(0x6f8a58);
  }
  // the dusty ground, with the road worn into it
  g.rect(0, TOP_Y, WORLD.w, WORLD.h - TOP_Y).fill(DUST);
  for (let i = 0; i < 18; i++) {
    g.ellipse(
      rnd(i + 200) * WORLD.w,
      TOP_Y + 12 + rnd(i + 240) * (WORLD.h - TOP_Y - 22),
      30 + rnd(i + 280) * 40,
      8 + rnd(i + 320) * 12
    ).fill({ color: i % 2 ? 0xead7a6 : 0xd0b87f, alpha: 0.35 });
  }
  const lane = (pts, width) => {
    g.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => g.lineTo(p.x, p.y));
    g.stroke({ width, color: ROAD, alpha: 0.9, cap: "round", join: "round" });
  };
  lane([BUNDLE_SPOTS[1], BUNDLE_SPOTS[3], SEEK_SPOTS[0], SPAWN, ROAD_FAR], 34);
  lane([BUNDLE_SPOTS[3], VISIT_SPOTS[0], VISIT_SPOTS[1]], 30);
  // tufts of dry grass and small stones
  for (let i = 0; i < 40; i++) {
    const x = rnd(i + 400) * WORLD.w;
    const y = TOP_Y + 8 + rnd(i + 460) * (WORLD.h - TOP_Y - 18);
    g.ellipse(x, y, 1.8, 1.2).fill({ color: 0xa8916a, alpha: 0.7 });
  }
  for (let i = 0; i < 14; i++) {
    const x = rnd(i + 600) * WORLD.w;
    const y = TOP_Y + 14 + rnd(i + 640) * (WORLD.h - TOP_Y - 28);
    g.moveTo(x, y).lineTo(x - 2, y - 5);
    g.moveTo(x, y).lineTo(x + 1, y - 6);
    g.moveTo(x, y).lineTo(x + 3, y - 4);
  }
  g.stroke({ width: 1, color: 0x8a8a4a, alpha: 0.7 });
  g.rect(0, TOP_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(WORLD.w - 8, TOP_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// the porch of the temple court seen from the front: steps, a floor of stone, and a row of pillars under a beam
export function drawCourt(b) {
  const g = new Graphics();
  const bottom = b.y + b.h;
  g.ellipse(b.x + b.w / 2, bottom + 2, b.w / 2 + 6, 6).fill({ color: 0x000000, alpha: 0.18 });
  g.rect(b.x, b.y + 8, b.w, b.h - 8).fill(STONE_DARK);
  g.rect(b.x, b.y, b.w, 10).fill(STONE);
  g.rect(b.x - 4, b.y - 4, b.w + 8, 6).fill(STONE_DARK);
  const n = Math.max(4, Math.round(b.w / 36));
  for (let k = 0; k <= n; k++) {
    const x = b.x + 6 + (k * (b.w - 12)) / n;
    g.rect(x - 4, b.y + 8, 8, b.h - 8).fill(STONE);
    g.rect(x - 4, b.y + 8, 2, b.h - 8).fill({ color: 0xffffff, alpha: 0.35 });
    g.rect(x - 6, bottom - 5, 12, 5).fill(STONE_DARK);
  }
  // the steps, and a rug where the teachers sit
  g.rect(b.x - 6, bottom, b.w + 12, 8).fill(STONE);
  g.rect(b.x - 10, bottom + 8, b.w + 20, 8).fill({ color: STONE, alpha: 0.9 });
  g.rect(b.x - 10, bottom + 15, b.w + 20, 1.4).fill({ color: STONE_DARK, alpha: 0.7 });
  g.rect(b.x + 14, bottom + 18, b.w - 28, 12).fill({ color: 0x9a3b3b, alpha: 0.55 });
  g.zIndex = bottom;
  return g;
}

// a flat-roofed house of clay brick, with a door, a small window, and a ladder up to the roof
export function drawHouse(b) {
  const g = new Graphics();
  const bottom = b.y + b.h;
  g.ellipse(b.x + b.w / 2, bottom + 2, b.w / 2 + 6, 6).fill({ color: 0x000000, alpha: 0.2 });
  g.rect(b.x, b.y, b.w, b.h).fill(CLAY);
  g.rect(b.x, b.y, b.w, 8).fill(CLAY_DARK);
  g.rect(b.x - 3, b.y - 3, b.w + 6, 5).fill(0xb9a074);
  g.rect(b.x + b.w * 0.5 - 11, bottom - 34, 22, 34).fill(WOOD_DARK);
  g.circle(b.x + b.w * 0.5, bottom - 34, 11).fill(WOOD_DARK);
  g.circle(b.x + b.w * 0.5 + 6, bottom - 16, 1.4).fill(0xe3c27a);
  g.rect(b.x + 16, b.y + 22, 14, 14).fill(0x4a3a2a);
  g.rect(b.x + 16, b.y + 22, 14, 3).fill({ color: 0xffffff, alpha: 0.18 });
  g.rect(b.x + b.w - 30, b.y + 22, 14, 14).fill(0x4a3a2a);
  g.rect(b.x + b.w - 14, b.y - 3, 2, b.h + 3).fill(WOOD_DARK);
  g.rect(b.x + b.w - 8, b.y - 3, 2, b.h + 3).fill(WOOD_DARK);
  for (let k = 0; k < 5; k++) {
    g.rect(b.x + b.w - 14, b.y + 6 + k * 12, 8, 1.6).fill(WOOD_DARK);
  }
  g.zIndex = bottom;
  return g;
}

// the carpenter's workshop: open at the front under a thatched cover, with a bench inside and tools hung on the wall
export function drawShop(b) {
  const g = new Graphics();
  const bottom = b.y + b.h;
  g.ellipse(b.x + b.w / 2, bottom + 2, b.w / 2 + 8, 6).fill({ color: 0x000000, alpha: 0.2 });
  g.rect(b.x, b.y + 10, b.w, b.h - 10).fill(0x4a3626);
  // tools on the back wall: a saw, a hammer and a square
  g.poly([b.x + 16, b.y + 20, b.x + 44, b.y + 20, b.x + 16, b.y + 30]).fill(0xb9bcc0);
  g.rect(b.x + 60, b.y + 20, 3, 14).fill(WOOD);
  g.rect(b.x + 56, b.y + 19, 11, 4).fill(0x6a6a6a);
  g.moveTo(b.x + 82, b.y + 18)
    .lineTo(b.x + 82, b.y + 34)
    .lineTo(b.x + 96, b.y + 34);
  g.stroke({ width: 2.4, color: WOOD });
  // the bench, with a plank on it
  g.rect(b.x + 8, bottom - 20, b.w - 16, 5).fill(WOOD);
  g.rect(b.x + 8, bottom - 15, b.w - 16, 12).fill(WOOD_DARK);
  g.rect(b.x + 14, bottom - 25, b.w - 60, 5).fill(0xd9b57a);
  // the cover and its posts
  g.poly([
    b.x - 8,
    b.y + 14,
    b.x + 6,
    b.y - 4,
    b.x + b.w - 6,
    b.y - 4,
    b.x + b.w + 8,
    b.y + 14
  ]).fill(0xc9a45a);
  for (let k = 0; k < 9; k++) {
    g.rect(b.x + k * (b.w / 9), b.y - 2, 1.2, 14).fill({ color: 0x8a6a30, alpha: 0.6 });
  }
  g.rect(b.x, b.y + 10, 5, b.h - 10).fill(WOOD_DARK);
  g.rect(b.x + b.w - 5, b.y + 10, 5, b.h - 10).fill(WOOD_DARK);
  g.zIndex = bottom;
  return g;
}

// a heap of rough boards: it is drawn again, smooth and pale with a curl of shaving, once it has been planed
export function makeBoards(spot) {
  const g = new Graphics();
  const draw = planed => {
    g.clear();
    const x = spot.x;
    const y = spot.y - 12;
    g.ellipse(x, y + 9, 20, 5).fill({ color: 0x000000, alpha: 0.18 });
    [
      [-14, 4, 28, 5],
      [-12, -1, 26, 5],
      [-15, -6, 30, 5]
    ].forEach(([dx, dy, w, h], i) => {
      g.rect(x + dx, y + dy, w, h).fill(planed ? 0xe3c58e : i % 2 ? 0x9a7142 : 0x8a6338);
      g.rect(x + dx, y + dy, w, 1.2).fill({ color: 0xffffff, alpha: planed ? 0.4 : 0.12 });
    });
    if (planed) {
      g.circle(x + 18, y + 7, 3).stroke({ width: 1, color: 0xf2e2bb });
      g.circle(x - 19, y + 6, 2.4).stroke({ width: 1, color: 0xf2e2bb });
    } else {
      g.circle(x - 4, y - 5, 1.4).fill(0x5a3f22);
      g.circle(x + 7, y, 1.4).fill(0x5a3f22);
    }
  };
  draw(false);
  g.zIndex = spot.y - 4;
  return {
    g,
    planed: false,
    set(v) {
      this.planed = v;
      draw(v);
    }
  };
}

// a bundle for the journey: cloth laid open with loaves in it, and tied shut with a cord once it is packed
export function makeBundle(spot) {
  const g = new Graphics();
  const draw = tied => {
    g.clear();
    const x = spot.x;
    const y = spot.y - 12;
    g.ellipse(x, y + 8, 17, 5).fill({ color: 0x000000, alpha: 0.18 });
    if (tied) {
      g.ellipse(x, y + 1, 13, 10).fill(0xcdb88c);
      g.circle(x, y - 10, 4).fill(0xcdb88c);
      g.rect(x - 12, y - 1, 24, 2.4).fill(0x6a4a2e);
      g.circle(x + 2, y - 7, 1.8).fill(0x6a4a2e);
    } else {
      g.ellipse(x, y + 3, 19, 8).fill(0xd9c9a0);
      g.ellipse(x - 6, y, 7, 4).fill(0xc58f4a);
      g.ellipse(x + 6, y + 1, 7, 4).fill(0xb97f3c);
    }
  };
  draw(false);
  g.zIndex = spot.y - 4;
  return {
    g,
    tied: false,
    set(v) {
      this.tied = v;
      draw(v);
    }
  };
}

// The light that stands for Jesus: a warm glow on the ground, with a brighter heart. It is not a person and not drawn like
// one. The engine moves it about and fades it.
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
