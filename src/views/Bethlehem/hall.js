import { Graphics } from "pixi.js";

// The fields at Bethlehem by night drawn with simple shapes: a deep blue sky with stars and a moon, far hills with the town
// and its lit windows, a grassy field with a path to the stable, the shepherds' fire, sheep, the stable with its manger, the
// light of the angel, and the host of lights in the sky. Colours are dark but soft so the characters stand out.
const GRASS = 0x587a5e;
const WOOD = 0xa07a4a;
const WOOD_DARK = 0x6a4a2e;
const STRAW = 0xe2c46a;

// a number from 0 to 1 that is always the same for the same i, so the field looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawField(layout) {
  const { WORLD, HILL_Y, STABLE } = layout;
  const g = new Graphics();
  // the night sky in bands, lighter towards the hills
  const bands = [0x0c1233, 0x131c47, 0x1b2a5c, 0x28397a, 0x3a4d8c];
  const h = HILL_Y / bands.length;
  bands.forEach((c, i) => g.rect(0, i * h, WORLD.w, h + 1).fill(c));
  for (let i = 0; i < 46; i++) {
    g.circle(rnd(i) * WORLD.w, rnd(i + 50) * HILL_Y * 0.8, 0.7 + rnd(i + 100) * 1.1).fill({
      color: 0xffffff,
      alpha: 0.5 + rnd(i + 150) * 0.5
    });
  }
  // a moon, a little round
  g.circle(WORLD.w * 0.84, HILL_Y * 0.24, 11).fill(0xf3eed0);
  g.circle(WORLD.w * 0.84 - 4, HILL_Y * 0.24 - 2, 2.2).fill({ color: 0xd9d3b0, alpha: 0.7 });
  // far hills, with the town of Bethlehem on the nearer one at the right
  g.poly([
    0,
    HILL_Y,
    0,
    HILL_Y * 0.72,
    WORLD.w * 0.22,
    HILL_Y * 0.58,
    WORLD.w * 0.5,
    HILL_Y * 0.74,
    WORLD.w * 0.78,
    HILL_Y * 0.6,
    WORLD.w,
    HILL_Y * 0.7,
    WORLD.w,
    HILL_Y
  ]).fill(0x24304f);
  g.poly([
    0,
    HILL_Y,
    0,
    HILL_Y * 0.88,
    WORLD.w * 0.3,
    HILL_Y * 0.78,
    WORLD.w * 0.6,
    HILL_Y * 0.9,
    WORLD.w,
    HILL_Y * 0.8,
    WORLD.w,
    HILL_Y
  ]).fill(0x1b2742);
  const tx = WORLD.w * 0.62;
  const ty = HILL_Y * 0.9;
  for (let i = 0; i < 7; i++) {
    const w = 16 + rnd(i + 200) * 10;
    const ht = 10 + rnd(i + 230) * 12;
    const x = tx + i * 21 - 10;
    g.rect(x, ty - ht - (i % 2) * 4, w, ht + (i % 2) * 4 + 6).fill(0x3a3f5a);
    g.rect(x + w * 0.3, ty - ht * 0.6 - (i % 2) * 4, 4, 5).fill(0xffcf70);
  }
  // the field and its grass
  g.rect(0, HILL_Y, WORLD.w, WORLD.h - HILL_Y).fill(GRASS);
  for (let i = 0; i < 14; i++) {
    g.ellipse(
      rnd(i + 300) * WORLD.w,
      HILL_Y + 20 + rnd(i + 330) * (WORLD.h - HILL_Y - 30),
      40 + rnd(i + 360) * 50,
      10 + rnd(i + 390) * 14
    ).fill({ color: i % 2 ? 0x6a8c6c : 0x4a6a50, alpha: 0.4 });
  }
  // the path from the field down to the stable
  const px = STABLE.x + STABLE.w / 2;
  const py = STABLE.y + STABLE.h;
  g.poly([
    WORLD.w * 0.3,
    HILL_Y + 6,
    WORLD.w * 0.38,
    HILL_Y + 6,
    px + 18,
    py + 4,
    px - 22,
    py + 4
  ]).fill({ color: 0xb89a68, alpha: 0.5 });
  g.ellipse(px, py + 34, 80, 26).fill({ color: 0xb89a68, alpha: 0.5 });
  for (let i = 0; i < 70; i++) {
    g.rect(
      rnd(i + 500) * WORLD.w,
      HILL_Y + 6 + rnd(i + 560) * (WORLD.h - HILL_Y - 16),
      1.2,
      3.2
    ).fill({ color: 0x86a888, alpha: 0.8 });
  }
  g.rect(0, HILL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.15 });
  g.rect(WORLD.w - 8, HILL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.15 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.2 });
  return g;
}

// the stable: a low roof of thatch on posts over a dark back wall, with straw on the floor and the manger in front of it.
// `glow` is the soft light in the manger, which brightens when the shepherds come.
export function drawStable(s, manger) {
  const g = new Graphics();
  const bottom = s.y + s.h;
  g.ellipse(s.x + s.w / 2, bottom + 2, s.w / 2 + 8, 8).fill({ color: 0x000000, alpha: 0.25 });
  g.rect(s.x + 6, s.y + 14, s.w - 12, s.h - 14).fill(0x3a2a20);
  g.rect(s.x + 6, s.y + s.h - 10, s.w - 12, 10).fill({ color: STRAW, alpha: 0.9 });
  // a few lines of straw on the floor
  for (let k = 0; k < 14; k++) {
    g.rect(s.x + 12 + rnd(k + 700) * (s.w - 30), bottom - 9 + rnd(k + 720) * 7, 9, 1.2).fill({
      color: 0xf2dc8a,
      alpha: 0.9
    });
  }
  // the posts, and the thatched roof over them
  g.rect(s.x + 4, s.y + 12, 6, s.h - 12).fill(WOOD_DARK);
  g.rect(s.x + s.w - 10, s.y + 12, 6, s.h - 12).fill(WOOD_DARK);
  g.poly([s.x - 10, s.y + 22, s.x + s.w / 2, s.y - 14, s.x + s.w + 10, s.y + 22]).fill(0xb89a52);
  for (let k = 1; k < 4; k++) {
    g.rect(s.x - 6 + k * 8, s.y + 14 - k * 3, s.w - k * 16 + 12, 1.4).fill({
      color: 0x8a6e36,
      alpha: 0.7
    });
  }
  // the manger: a wooden trough on crossed legs, full of straw
  const m = manger;
  g.poly([m.x - 22, m.y - 14, m.x + 22, m.y - 14, m.x + 16, m.y - 2, m.x - 16, m.y - 2]).fill(WOOD);
  g.poly([m.x - 22, m.y - 14, m.x + 22, m.y - 14, m.x + 20, m.y - 10, m.x - 20, m.y - 10]).fill(
    WOOD_DARK
  );
  g.ellipse(m.x, m.y - 14, 19, 3.4).fill(STRAW);
  g.moveTo(m.x - 14, m.y - 2)
    .lineTo(m.x + 14, m.y + 8)
    .moveTo(m.x + 14, m.y - 2)
    .lineTo(m.x - 14, m.y + 8)
    .stroke({ width: 2.4, color: WOOD_DARK });
  g.zIndex = bottom;
  // the glow lies over the manger: not a person, just a warm light, brighter as the shepherds arrive
  const glow = new Graphics();
  [
    [40, 20, 0.08],
    [28, 14, 0.12],
    [18, 9, 0.2],
    [9, 4.5, 0.35]
  ].forEach(([rx, ry, a]) =>
    glow.ellipse(m.x, m.y - 14, rx, ry).fill({ color: 0xfff1b0, alpha: a })
  );
  glow.alpha = 0.5;
  glow.zIndex = bottom + 1;
  return { g, glow };
}

// the shepherds' fire: logs and stones, with a flame the engine makes flicker, and a warm glow on the grass
export function makeFire(f) {
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2 + 4;
  const g = new Graphics();
  g.ellipse(cx, cy + 2, 40, 16).fill({ color: 0xffa040, alpha: 0.14 });
  g.ellipse(cx, cy + 2, 24, 10).fill({ color: 0xffa040, alpha: 0.2 });
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    g.ellipse(cx + Math.cos(a) * 15, cy + Math.sin(a) * 6 + 3, 4, 2.8).fill(0x77736a);
  }
  g.moveTo(cx - 12, cy + 3)
    .lineTo(cx + 12, cy - 1)
    .moveTo(cx - 10, cy - 2)
    .lineTo(cx + 10, cy + 4)
    .stroke({ width: 4, color: 0x4a3322 });
  g.zIndex = cy;
  const flame = new Graphics();
  flame.poly([-9, 0, -5, -12, -1, -5, 2, -17, 6, -7, 9, 0]).fill(0xff8a2a);
  flame.poly([-5, 0, -2, -8, 1, -4, 3, 0]).fill(0xffe27a);
  flame.position.set(cx, cy);
  flame.zIndex = cy + 1;
  return { g, flame };
}

// a sheep seen from the side, standing at (0, 0) with its feet on the ground: a round fleece, a dark face and legs. The
// engine places it, and turns it by flipping `scale.x`.
export function makeSheep(i) {
  const g = new Graphics();
  g.ellipse(0, 1, 12, 3.4).fill({ color: 0x000000, alpha: 0.2 });
  g.rect(-6, -5, 1.8, 6).fill(0x3a302a);
  g.rect(4, -5, 1.8, 6).fill(0x3a302a);
  const wool = i % 2 ? 0xf2efe6 : 0xe8e2d0;
  [
    [-5, -9, 6],
    [2, -10, 7],
    [8, -8, 5],
    [-1, -6, 6]
  ].forEach(([x, y, r]) => g.circle(x, y, r).fill(wool));
  g.ellipse(11, -10, 3.4, 3).fill(0x3a302a);
  g.ellipse(9, -13, 1.4, 2.2).fill(0x3a302a);
  return g;
}

// the glory of the Lord: a wide soft light in the sky with a bright star at its heart. It is not a person and not drawn
// like one. The engine fades it in and moves it from the field to the stable.
export function makeGlory() {
  const g = new Graphics();
  [
    [64, 0.07],
    [46, 0.1],
    [32, 0.15],
    [20, 0.25],
    [11, 0.4]
  ].forEach(([r, a]) => g.circle(0, 0, r).fill({ color: 0xfff3c0, alpha: a }));
  const pts = [];
  for (let k = 0; k < 8; k++) {
    const a = (-90 + k * 45) * (Math.PI / 180);
    const r = k % 2 ? 4 : 17;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.poly(pts).fill(0xfffbe0);
  g.alpha = 0;
  return g;
}

// the heavenly host: a crowd of small lights across the sky, which the engine fades in for the song
export function makeHost(layout) {
  const { WORLD, HILL_Y } = layout;
  const g = new Graphics();
  for (let i = 0; i < 16; i++) {
    const x = 20 + rnd(i + 800) * (WORLD.w - 40);
    const y = 10 + rnd(i + 840) * (HILL_Y - 50);
    g.circle(x, y, 9).fill({ color: 0xfff3c0, alpha: 0.12 });
    g.circle(x, y, 4.6).fill({ color: 0xfff3c0, alpha: 0.3 });
    g.circle(x, y, 1.8).fill({ color: 0xffffff, alpha: 0.9 });
  }
  g.alpha = 0;
  return g;
}
