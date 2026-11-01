import { Graphics } from "pixi.js";

// The village of Bethany drawn with simple shapes: sky, hills with olive trees, packed earth with grass, the rock with the
// grave cut into it, the stone that closes it, the house of Mary and Martha, the long table with its dishes, the
// graveclothes Lazarus is bound in, and the light that stands for Jesus. Colours are soft and warm so the characters stand
// out.
const EARTH = 0xdcc79a;
const WOOD = 0xb08552;
const WOOD_DARK = 0x7d5a32;
const ROCK = 0x9c9484;
const ROCK_DARK = 0x6f685a;
const CLOTH = 0xefe6d0;

// a number from 0 to 1 that is always the same for the same i, so the village looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const olive = (g, x, y, s) => {
  g.rect(x - 2 * s, y - 14 * s, 4 * s, 14 * s).fill(0x6b4e30);
  g.ellipse(x, y - 20 * s, 15 * s, 10 * s).fill(0x7f9660);
  g.ellipse(x - 6 * s, y - 17 * s, 9 * s, 6 * s).fill({ color: 0xa9bd86, alpha: 0.8 });
};

export function drawVillage(layout) {
  const { WORLD, RIDGE_Y, TOMB, HOUSE, DOOR } = layout;
  const g = new Graphics();
  g.rect(0, 0, WORLD.w, RIDGE_Y).fill(0xcfe6f3);
  g.rect(0, RIDGE_Y * 0.4, WORLD.w, RIDGE_Y * 0.25).fill(0xeaf3f1);
  // the hills behind, one behind the other
  g.poly([
    0,
    RIDGE_Y,
    0,
    RIDGE_Y * 0.55,
    WORLD.w * 0.25,
    RIDGE_Y * 0.4,
    WORLD.w * 0.55,
    RIDGE_Y * 0.62,
    WORLD.w * 0.8,
    RIDGE_Y * 0.38,
    WORLD.w,
    RIDGE_Y * 0.5,
    WORLD.w,
    RIDGE_Y
  ]).fill(0xb4bf92);
  g.poly([
    0,
    RIDGE_Y,
    0,
    RIDGE_Y * 0.8,
    WORLD.w * 0.3,
    RIDGE_Y * 0.66,
    WORLD.w * 0.62,
    RIDGE_Y * 0.84,
    WORLD.w,
    RIDGE_Y * 0.7,
    WORLD.w,
    RIDGE_Y
  ]).fill(0x93a577);
  for (let i = 0; i < 9; i++) {
    olive(g, 20 + rnd(i) * (WORLD.w - 40), RIDGE_Y - 2 - rnd(i + 20) * 8, 0.8 + rnd(i + 40) * 0.5);
  }
  // packed earth, with patches of grass and a few stones
  g.rect(0, RIDGE_Y, WORLD.w, WORLD.h - RIDGE_Y).fill(EARTH);
  for (let i = 0; i < 20; i++) {
    g.ellipse(
      rnd(i + 200) * WORLD.w,
      RIDGE_Y + 20 + rnd(i + 240) * (WORLD.h - RIDGE_Y - 30),
      30 + rnd(i + 280) * 40,
      8 + rnd(i + 320) * 12
    ).fill({ color: i % 2 ? 0xe9d6a8 : 0xc9b684, alpha: 0.4 });
  }
  for (let i = 0; i < 14; i++) {
    g.ellipse(
      rnd(i + 500) * WORLD.w,
      RIDGE_Y + 40 + rnd(i + 540) * (WORLD.h - RIDGE_Y - 60),
      14 + rnd(i + 580) * 16,
      5 + rnd(i + 620) * 5
    ).fill({ color: 0x9fb06f, alpha: 0.5 });
  }
  for (let i = 0; i < 50; i++) {
    g.ellipse(
      rnd(i + 400) * WORLD.w,
      RIDGE_Y + 10 + rnd(i + 460) * (WORLD.h - RIDGE_Y - 20),
      1.8,
      1.2
    ).fill({ color: 0xa8916a, alpha: 0.7 });
  }
  // the rock with the grave cut into it: a broken outline, and the dark mouth of the cave
  const bottom = TOMB.y + TOMB.h;
  g.poly([
    TOMB.x - 8,
    bottom,
    TOMB.x + 4,
    TOMB.y + 24,
    TOMB.x + TOMB.w * 0.3,
    TOMB.y + 4,
    TOMB.x + TOMB.w * 0.6,
    TOMB.y + 12,
    TOMB.x + TOMB.w * 0.85,
    TOMB.y,
    TOMB.x + TOMB.w + 8,
    TOMB.y + 30,
    TOMB.x + TOMB.w + 10,
    bottom
  ]).fill(ROCK);
  g.poly([
    TOMB.x + TOMB.w * 0.62,
    TOMB.y + 12,
    TOMB.x + TOMB.w * 0.85,
    TOMB.y,
    TOMB.x + TOMB.w + 8,
    TOMB.y + 30,
    TOMB.x + TOMB.w + 10,
    bottom,
    TOMB.x + TOMB.w * 0.7,
    bottom
  ]).fill({ color: ROCK_DARK, alpha: 0.35 });
  g.ellipse(TOMB.x + TOMB.w / 2, bottom + 1, TOMB.w / 2 + 12, 6).fill({
    color: 0x000000,
    alpha: 0.18
  });
  const cx = layout.MOUTH.x;
  g.roundRect(cx - 21, bottom - 46, 42, 46, 18).fill(0x1c1712);
  g.rect(cx - 21, bottom - 12, 42, 12).fill(0x1c1712);
  // the house: a flat-roofed house of mud brick, with a low roof wall, a dark door and two small windows
  const hb = HOUSE.y + HOUSE.h;
  g.ellipse(HOUSE.x + HOUSE.w / 2, hb + 1, HOUSE.w / 2 + 6, 6).fill({
    color: 0x000000,
    alpha: 0.18
  });
  g.rect(HOUSE.x, HOUSE.y, HOUSE.w, HOUSE.h).fill(0xe9d8b2);
  g.rect(HOUSE.x - 4, HOUSE.y, HOUSE.w + 8, 9).fill(0xcdb98c);
  g.rect(HOUSE.x, HOUSE.y + 9, HOUSE.w, 3).fill({ color: 0x000000, alpha: 0.1 });
  for (let k = 0; k < 6; k++) {
    g.rect(HOUSE.x + 8 + k * (HOUSE.w / 6), HOUSE.y + 22, 1, HOUSE.h - 30).fill({
      color: 0xc9b684,
      alpha: 0.5
    });
  }
  g.roundRect(DOOR.x - 14, hb - 52, 28, 52, 12).fill(0x4a3320);
  g.rect(DOOR.x - 14, hb - 14, 28, 14).fill(0x4a3320);
  [HOUSE.x + 22, HOUSE.x + HOUSE.w - 36].forEach(wx => {
    g.rect(wx, HOUSE.y + 32, 14, 18).fill(0x5a4129);
    g.rect(wx + 5, HOUSE.y + 32, 4, 18).fill({ color: 0xffcf70, alpha: 0.5 });
  });
  g.rect(0, RIDGE_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(WORLD.w - 8, RIDGE_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// the long table for the supper, seen from the front, with a cloth along it
export function drawTable(t) {
  const g = new Graphics();
  const bottom = t.y + t.h;
  g.ellipse(t.x + t.w / 2, bottom + 2, t.w / 2 + 6, 6).fill({ color: 0x000000, alpha: 0.2 });
  g.rect(t.x + 6, t.y + 10, 5, t.h - 8).fill(WOOD_DARK);
  g.rect(t.x + t.w - 11, t.y + 10, 5, t.h - 8).fill(WOOD_DARK);
  g.roundRect(t.x, t.y, t.w, 14, 3).fill(WOOD);
  g.roundRect(t.x, t.y, t.w, 14, 3).stroke({ width: 1, color: WOOD_DARK });
  g.rect(t.x + 4, t.y + 2, t.w - 8, 9).fill(0xf3ead2);
  g.rect(t.x + 4, t.y + 11, t.w - 8, 3).fill({ color: 0x7a1f2c, alpha: 0.7 });
  g.zIndex = bottom;
  return g;
}

// the dishes on the table: `set(n)` shows the first n of them (bread, a bowl, a cup, fruit), as Martha serves
export function makeDishes(t) {
  const g = new Graphics();
  const spots = [0.14, 0.34, 0.54, 0.74, 0.9];
  const draw = n => {
    g.clear();
    spots.slice(0, n).forEach((f, i) => {
      const x = t.x + t.w * f;
      const y = t.y + 6;
      if (i % 3 === 0) {
        g.ellipse(x, y, 9, 3.4).fill(0xd9a25a);
        g.ellipse(x, y - 1.6, 6, 2.6).fill(0xe9bf7a);
      } else if (i % 3 === 1) {
        g.ellipse(x, y, 8, 3.2).fill(0x8a5e34);
        g.ellipse(x, y - 1, 6, 2).fill(0xb98a4b);
      } else {
        g.circle(x - 3, y - 2, 2.6).fill(0x7a3b4e);
        g.circle(x + 2, y - 1.4, 2.4).fill(0x9c5a2e);
      }
    });
  };
  draw(0);
  g.zIndex = t.y + t.h + 1;
  return {
    g,
    set: draw
  };
}

// the stone that closes the grave: a round stone in front of the mouth. `set(t)` (0 closed, 1 rolled right away) rolls it.
export function makeStone(layout) {
  const { TOMB, MOUTH } = layout;
  const g = new Graphics();
  g.circle(0, 0, 19).fill(0x8f897b);
  g.circle(0, 0, 19).stroke({ width: 1.4, color: ROCK_DARK });
  g.ellipse(-5, -6, 8, 5).fill({ color: 0xffffff, alpha: 0.18 });
  g.moveTo(-8, 6).lineTo(2, 12).moveTo(6, -4).lineTo(12, 4);
  g.stroke({ width: 1, color: ROCK_DARK, alpha: 0.6 });
  const y = TOMB.y + TOMB.h - 18;
  const away = 58;
  g.zIndex = TOMB.y + TOMB.h - 1;
  const set = t => {
    g.position.set(MOUTH.x + away * t, y + 6 * t);
    g.rotation = t * Math.PI * 2.2;
  };
  set(0);
  return { g, set, away };
}

// the graveclothes Lazarus comes out in: bands round the body and a napkin round the face, drawn on him (with his feet at
// 0, 0) and taken off when he is loosed
export function makeWraps() {
  const g = new Graphics();
  g.roundRect(-10, -52, 20, 48, 5).fill({ color: CLOTH, alpha: 0.95 });
  for (let k = 0; k < 5; k++) {
    g.moveTo(-10, -48 + k * 9).lineTo(10, -42 + k * 9);
  }
  g.stroke({ width: 1, color: 0xb9a888 });
  g.ellipse(0, -63, 7.4, 6.4).fill({ color: CLOTH, alpha: 0.95 });
  g.ellipse(0, -63, 7.4, 6.4).stroke({ width: 1, color: 0xb9a888 });
  return g;
}

// A band of cloth let fall on the ground where the graveclothes were taken off.
export function drawCloth(x, y) {
  const g = new Graphics();
  g.ellipse(x, y + 3, 16, 5).fill({ color: CLOTH, alpha: 0.9 });
  g.moveTo(x - 12, y + 3).lineTo(x + 10, y + 1);
  g.stroke({ width: 1, color: 0xb9a888 });
  return g;
}

// The light that stands for Jesus: a warm glow on the ground, with a brighter heart. It is not a person and not drawn
// like one. The engine moves it along the road and fades it.
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
