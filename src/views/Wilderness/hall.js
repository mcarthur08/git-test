import { Graphics } from "pixi.js";

// The wilderness drawn with simple shapes: a pale sky and far hills, warm sand with dunes, pebbles and tufts of scrub, the
// temple pinnacle and the high mountain, a glimpse of the kingdoms of the world, stones to gather and the cairn they are
// carried to, flat rocks to pray on, the light that stands for Jesus, the shadow of the tempter, and the angels. Colours are
// soft and warm so the characters stand out, and the shadow is a drifting wisp rather than a figure.
const SAND = 0xe3c98f;
const ROCK = 0x9a8c78;
const ROCK_LIGHT = 0xbcae98;
const STONE_DARK = 0x6f6454;

// a number from 0 to 1 that is always the same for the same i, so the wilderness looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawDesert(layout) {
  const { WORLD, TOP_Y } = layout;
  const g = new Graphics();
  g.rect(0, 0, WORLD.w, TOP_Y).fill(0xf3dcae);
  g.rect(0, 0, WORLD.w, TOP_Y * 0.55).fill(0xf8e9c6);
  g.rect(0, 0, WORLD.w, TOP_Y * 0.25).fill(0xcfe3ec);
  // two ranges of far hills
  g.poly([
    0,
    TOP_Y,
    0,
    TOP_Y * 0.62,
    WORLD.w * 0.2,
    TOP_Y * 0.74,
    WORLD.w * 0.45,
    TOP_Y * 0.56,
    WORLD.w * 0.7,
    TOP_Y * 0.72,
    WORLD.w,
    TOP_Y * 0.6,
    WORLD.w,
    TOP_Y
  ]).fill(0xd8b988);
  g.poly([
    0,
    TOP_Y,
    0,
    TOP_Y * 0.84,
    WORLD.w * 0.28,
    TOP_Y * 0.78,
    WORLD.w * 0.55,
    TOP_Y * 0.88,
    WORLD.w * 0.82,
    TOP_Y * 0.8,
    WORLD.w,
    TOP_Y * 0.86,
    WORLD.w,
    TOP_Y
  ]).fill(0xc79f69);
  // the sand, with long soft dunes
  g.rect(0, TOP_Y, WORLD.w, WORLD.h - TOP_Y).fill(SAND);
  for (let i = 0; i < 22; i++) {
    g.ellipse(
      rnd(i + 200) * WORLD.w,
      TOP_Y + 12 + rnd(i + 240) * (WORLD.h - TOP_Y - 22),
      34 + rnd(i + 280) * 50,
      8 + rnd(i + 320) * 12
    ).fill({ color: i % 2 ? 0xedd7a2 : 0xd3b57c, alpha: 0.35 });
  }
  // pebbles
  for (let i = 0; i < 70; i++) {
    g.ellipse(
      rnd(i + 400) * WORLD.w,
      TOP_Y + 8 + rnd(i + 460) * (WORLD.h - TOP_Y - 18),
      1.8 + rnd(i + 520) * 1.4,
      1.2
    ).fill({ color: 0x9a8560, alpha: 0.7 });
  }
  // dry scrub
  for (let i = 0; i < 12; i++) {
    const x = 20 + rnd(i + 600) * (WORLD.w - 40);
    const y = TOP_Y + 20 + rnd(i + 640) * (WORLD.h - TOP_Y - 40);
    g.moveTo(x, y).lineTo(x - 4, y - 7);
    g.moveTo(x, y).lineTo(x, y - 9);
    g.moveTo(x, y).lineTo(x + 4, y - 6);
    g.stroke({ width: 1.2, color: 0x8a7a3a, alpha: 0.8 });
  }
  g.rect(0, TOP_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.1 });
  g.rect(WORLD.w - 8, TOP_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.1 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// the pinnacle of the temple: a tall pale tower of cut stone with a cornice and a little balustrade at the top
export function drawTower(t) {
  const g = new Graphics();
  const bottom = t.y + t.h;
  const top = bottom - t.rise;
  g.ellipse(t.x + t.w / 2, bottom + 2, t.w / 2 + 8, 6).fill({ color: 0x000000, alpha: 0.2 });
  g.rect(t.x, top, t.w, t.rise).fill(0xe2d6b8);
  g.rect(t.x + t.w * 0.62, top, t.w * 0.38, t.rise).fill({ color: 0x000000, alpha: 0.08 });
  for (let k = 1; k < 9; k++) {
    g.rect(t.x, top + k * (t.rise / 9), t.w, 1).fill({ color: 0xb9a888, alpha: 0.55 });
  }
  // a tall arched window
  g.roundRect(t.x + t.w / 2 - 7, top + t.rise * 0.36, 14, 26, 6).fill(0x5a4a38);
  // the cornice that juts out under the top, and the balustrade above it
  g.rect(t.x - 5, top - 3, t.w + 10, 6).fill(0xcdbf9c);
  g.rect(t.x - 5, top + 3, t.w + 10, 1.4).fill({ color: 0x000000, alpha: 0.15 });
  for (let k = 0; k < 6; k++) {
    g.rect(t.x - 2 + k * ((t.w + 4) / 5.4), top - 11, 3.6, 8).fill(0xe9dfc4);
  }
  g.rect(t.x - 4, top - 13, t.w + 8, 3).fill(0xd9ccaa);
  g.zIndex = bottom;
  return g;
}

// the high mountain: a bare, rocky peak with a shaded face
export function drawMountain(m) {
  const g = new Graphics();
  const bottom = m.y + m.h;
  const px = m.x + m.w * 0.5;
  g.ellipse(m.x + m.w / 2, bottom + 2, m.w / 2 + 14, 7).fill({ color: 0x000000, alpha: 0.2 });
  g.poly([
    m.x - 12,
    bottom,
    m.x + m.w * 0.18,
    bottom - m.rise * 0.55,
    m.x + m.w * 0.36,
    bottom - m.rise * 0.7,
    px,
    bottom - m.rise,
    m.x + m.w * 0.72,
    bottom - m.rise * 0.62,
    m.x + m.w + 12,
    bottom
  ]).fill(0xb89a72);
  g.poly([
    px,
    bottom - m.rise,
    m.x + m.w * 0.72,
    bottom - m.rise * 0.62,
    m.x + m.w + 12,
    bottom,
    px + 6,
    bottom
  ]).fill({ color: 0x5a4430, alpha: 0.3 });
  // a pale crest and cracks in the rock
  g.poly([
    px - 10,
    bottom - m.rise * 0.88,
    px,
    bottom - m.rise,
    px + 9,
    bottom - m.rise * 0.9,
    px,
    bottom - m.rise * 0.84
  ]).fill({ color: 0xf2e4c4, alpha: 0.8 });
  for (let k = 0; k < 5; k++) {
    const x = m.x + m.w * (0.2 + k * 0.15);
    g.moveTo(x, bottom - m.rise * (0.25 + 0.1 * (k % 2))).lineTo(
      x + 6,
      bottom - m.rise * (0.1 + 0.05 * (k % 3))
    );
  }
  g.stroke({ width: 1, color: 0x6f5a40, alpha: 0.5 });
  g.zIndex = bottom;
  return g;
}

// all the kingdoms of the world, glimpsed far off along the horizon: a gleam of towers and domes. The engine shows it only
// while he is on the mountain.
export function drawKingdoms(layout) {
  const { WORLD, TOP_Y } = layout;
  const g = new Graphics();
  const x0 = WORLD.w * 0.42;
  const span = WORLD.w * 0.22;
  const base = TOP_Y - 3;
  g.ellipse(x0 + span / 2, base - 10, span * 0.7, 26).fill({ color: 0xffe9a0, alpha: 0.35 });
  const cols = [0xf0e0b8, 0xd9b36a, 0xe8c9d0, 0xbcd0e0, 0xe6d6a0];
  for (let k = 0; k < 9; k++) {
    const w = 7 + rnd(k + 700) * 6;
    const h = 8 + rnd(k + 740) * 18;
    const x = x0 + (k / 8) * (span - w);
    g.rect(x, base - h, w, h).fill(cols[k % cols.length]);
    if (k % 3 === 0) {
      g.ellipse(x + w / 2, base - h, w / 2, 4).fill(0xd9ad4a);
    } else if (k % 3 === 1) {
      g.poly([x - 1, base - h, x + w / 2, base - h - 7, x + w + 1, base - h]).fill(0xb85c4a);
    }
  }
  g.alpha = 0;
  return g;
}

// a stone lying on the sand, which can be picked up (`set(true)`) and put back (`set(false)`)
export function makeStone(spot) {
  const g = new Graphics();
  g.ellipse(spot.x + 1, spot.y + 1, 11, 4).fill({ color: 0x000000, alpha: 0.2 });
  g.ellipse(spot.x, spot.y - 4, 9, 6).fill(ROCK);
  g.ellipse(spot.x - 2, spot.y - 6, 5, 3).fill({ color: ROCK_LIGHT, alpha: 0.85 });
  g.ellipse(spot.x + 9, spot.y - 1, 4.5, 3).fill(STONE_DARK);
  g.zIndex = spot.y;
  return {
    g,
    taken: false,
    set(v) {
      this.taken = v;
      g.visible = !v;
    }
  };
}

// the cairn the stones are carried to: n stones stacked (an outline of where it goes until the first is set down)
export function makeCairn(spot) {
  const g = new Graphics();
  const tiers = [
    [0, -3, 11, 5.4],
    [-1, -9.5, 8.6, 4.6],
    [1, -15, 6.6, 4],
    [0, -20, 4.6, 3.4]
  ];
  const draw = n => {
    g.clear();
    g.ellipse(spot.x, spot.y + 1, 15, 5).fill({ color: 0x000000, alpha: 0.16 });
    if (n === 0) {
      g.ellipse(spot.x, spot.y - 2, 13, 5).stroke({ width: 1.4, color: 0xfff1b0, alpha: 0.9 });
    }
    tiers.slice(0, n).forEach(([dx, dy, rx, ry], i) => {
      g.ellipse(spot.x + dx, spot.y + dy, rx, ry).fill(i % 2 ? ROCK_LIGHT : ROCK);
      g.ellipse(spot.x + dx, spot.y + dy, rx, ry).stroke({
        width: 0.8,
        color: STONE_DARK,
        alpha: 0.6
      });
    });
  };
  draw(0);
  g.zIndex = spot.y;
  return {
    g,
    max: tiers.length,
    set: draw
  };
}

// a flat rock to kneel by and pray, in the sand
export function drawPrayRock(spot) {
  const g = new Graphics();
  g.ellipse(spot.x, spot.y - 1, 21, 7).fill({ color: 0x000000, alpha: 0.18 });
  g.ellipse(spot.x, spot.y - 4, 18, 6.4).fill(ROCK);
  g.ellipse(spot.x - 2, spot.y - 6, 13, 3.6).fill({ color: ROCK_LIGHT, alpha: 0.9 });
  g.zIndex = spot.y - 10;
  return g;
}

// the ring of light that spreads round someone at prayer: the engine grows and fades it
export function makeHalo(x, y) {
  const g = new Graphics();
  g.ellipse(0, 0, 26, 9).fill({ color: 0xfff1b0, alpha: 0.25 });
  g.ellipse(0, 0, 26, 9).stroke({ width: 1.6, color: 0xfff6d0, alpha: 0.9 });
  g.position.set(x, y);
  return g;
}

// The light that stands for Jesus: a warm glow on the sand, with a brighter heart. It is not a person and not drawn like
// one. The engine moves it across the wilderness and fades it.
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

// The tempter: only a shadow, a wisp of dusk-coloured smoke that drifts beside the light. It has no face and no shape of a
// person. The engine moves it, sways it, and fades it away.
export function makeTempter() {
  const g = new Graphics();
  g.poly([-9, 4, -3, 30, 0, 44, 4, 28, 10, 6]).fill({ color: 0x2a2338, alpha: 0.2 });
  [
    [22, 30, 0.14],
    [16, 24, 0.2],
    [11, 17, 0.28],
    [6, 10, 0.4]
  ].forEach(([rx, ry, a]) => g.ellipse(0, 0, rx, ry).fill({ color: 0x2a2338, alpha: a }));
  g.alpha = 0;
  return { g };
}

// An angel, drawn as a pale glow with two soft wings and no more detail than that. The engine lets it down from above.
export function makeAngel() {
  const g = new Graphics();
  g.circle(0, 0, 22).fill({ color: 0xe8f4ff, alpha: 0.18 });
  g.circle(0, 0, 14).fill({ color: 0xf2f9ff, alpha: 0.3 });
  [-1, 1].forEach(d => {
    g.poly([d * 3, -2, d * 17, -14, d * 21, -6, d * 16, 2, d * 8, 5]).fill({
      color: 0xffffff,
      alpha: 0.85
    });
  });
  g.ellipse(0, 1, 4, 8).fill(0xffffff);
  g.circle(0, -9, 3.4).fill(0xfffbe8);
  g.alpha = 0;
  return { g };
}

// what the angels brought: a loaf and a jar of water on the sand. Drawn around (0, 0); the engine places it.
export function makeProvision() {
  const g = new Graphics();
  g.ellipse(0, 2, 22, 6).fill({ color: 0x000000, alpha: 0.16 });
  g.ellipse(-8, -3, 10, 5.6).fill(0xc98a46);
  g.ellipse(-9, -5, 6, 2.6).fill({ color: 0xe6b374, alpha: 0.9 });
  g.moveTo(-12, -6).lineTo(-10, -1);
  g.moveTo(-7, -7).lineTo(-5, -1);
  g.stroke({ width: 0.9, color: 0x8a5a2a, alpha: 0.7 });
  g.roundRect(8, -14, 10, 14, 4).fill(0xb5683a);
  g.rect(10, -17, 6, 4).fill(0x8a4f2a);
  g.alpha = 0;
  return { g };
}
