import { Graphics } from "pixi.js";

// The foot of the cliffs at Caesarea Philippi drawn with simple shapes: sky and the snow of Mount Hermon, the rock wall
// with its cave and carved niches, the pool the spring runs into, open grass and stony ground, the great rock, stones to
// lay on it, and the light that stands for Jesus. Colours are soft and warm so the characters stand out.
const ROCK = 0xa59b8a;
const ROCK_DARK = 0x7d7466;
const ROCK_LIGHT = 0xc4baa6;
const GRASS = 0xb6c486;

// a number from 0 to 1 that is always the same for the same i, so the place looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawCliffs(layout) {
  const { WORLD, CLIFF_Y, SPRING } = layout;
  const g = new Graphics();
  const sky = CLIFF_Y * 0.34;
  g.rect(0, 0, WORLD.w, sky + 4).fill(0xbfe3f2);
  g.rect(0, sky * 0.5, WORLD.w, sky * 0.5).fill(0xe6f2f4);
  // Mount Hermon with its snow
  const peakX = WORLD.w * 0.62;
  g.poly([WORLD.w * 0.3, sky + 4, peakX, 4, WORLD.w * 0.95, sky + 4]).fill(0x9aa3ae);
  g.poly([
    peakX - WORLD.w * 0.09,
    sky * 0.45,
    peakX,
    4,
    peakX + WORLD.w * 0.08,
    sky * 0.42,
    peakX + WORLD.w * 0.03,
    sky * 0.58,
    peakX - WORLD.w * 0.02,
    sky * 0.5
  ]).fill(0xf4f6f8);
  // the rock wall: bands of stone with cracks
  g.rect(0, sky, WORLD.w, CLIFF_Y - sky).fill(ROCK);
  for (let i = 0; i < 9; i++) {
    const y = sky + (i / 9) * (CLIFF_Y - sky);
    g.rect(0, y, WORLD.w, (CLIFF_Y - sky) / 9).fill({
      color: i % 2 ? ROCK_DARK : ROCK_LIGHT,
      alpha: 0.28
    });
  }
  for (let i = 0; i < 26; i++) {
    const x = rnd(i) * WORLD.w;
    const y = sky + 6 + rnd(i + 40) * (CLIFF_Y - sky - 24);
    g.moveTo(x, y).lineTo(x + (rnd(i + 80) - 0.5) * 14, y + 10 + rnd(i + 120) * 16);
  }
  g.stroke({ width: 1.2, color: ROCK_DARK, alpha: 0.55 });
  // the cave above the pool, and little arched niches carved in the wall
  const cx = SPRING.x + SPRING.w / 2;
  const cw = SPRING.w * 0.7;
  g.poly([
    cx - cw / 2,
    SPRING.y,
    cx - cw / 2,
    SPRING.y - 34,
    cx - cw * 0.3,
    SPRING.y - 56,
    cx + cw * 0.3,
    SPRING.y - 56,
    cx + cw / 2,
    SPRING.y - 34,
    cx + cw / 2,
    SPRING.y
  ]).fill(0x2f2a26);
  [WORLD.w * 0.47, WORLD.w * 0.62, WORLD.w * 0.8].forEach(x => {
    g.roundRect(x, CLIFF_Y - 50, 16, 24, 7).fill(0x4a4238);
    g.roundRect(x, CLIFF_Y - 50, 16, 24, 7).stroke({ width: 1, color: ROCK_DARK });
  });
  g.rect(0, CLIFF_Y - 6, WORLD.w, 8).fill({ color: 0x000000, alpha: 0.18 });
  // grass and stony ground below
  g.rect(0, CLIFF_Y, WORLD.w, WORLD.h - CLIFF_Y).fill(GRASS);
  for (let i = 0; i < 22; i++) {
    g.ellipse(
      rnd(i + 200) * WORLD.w,
      CLIFF_Y + 14 + rnd(i + 240) * (WORLD.h - CLIFF_Y - 24),
      30 + rnd(i + 280) * 40,
      8 + rnd(i + 320) * 12
    ).fill({ color: i % 2 ? 0xc9d39a : 0x9fae70, alpha: 0.4 });
  }
  for (let i = 0; i < 50; i++) {
    g.ellipse(
      rnd(i + 400) * WORLD.w,
      CLIFF_Y + 10 + rnd(i + 460) * (WORLD.h - CLIFF_Y - 20),
      2.2,
      1.5
    ).fill({ color: 0x8d8678, alpha: 0.7 });
  }
  // the pool: a stone rim, clear water, and ripples where the spring runs in
  g.roundRect(SPRING.x - 4, SPRING.y - 4, SPRING.w + 8, SPRING.h + 8, 10).fill(ROCK_DARK);
  g.roundRect(SPRING.x, SPRING.y, SPRING.w, SPRING.h, 8).fill(0x4f9fc0);
  for (let i = 0; i < 5; i++) {
    g.ellipse(
      SPRING.x + 16 + rnd(i + 500) * (SPRING.w - 32),
      SPRING.y + 8 + rnd(i + 540) * (SPRING.h - 16),
      10 + rnd(i + 580) * 10,
      2.4
    ).stroke({ width: 1, color: 0xffffff, alpha: 0.55 });
  }
  g.rect(0, CLIFF_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(WORLD.w - 8, CLIFF_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// the great rock on the open ground: a rounded mass of stone with a flat top where the church is laid
export function drawRock(r) {
  const g = new Graphics();
  const bottom = r.y + r.h;
  g.ellipse(r.x + r.w / 2, bottom + 2, r.w / 2 + 8, 8).fill({ color: 0x000000, alpha: 0.2 });
  g.poly([
    r.x,
    bottom,
    r.x + 4,
    r.y + 16,
    r.x + 20,
    r.y,
    r.x + r.w - 18,
    r.y,
    r.x + r.w - 2,
    r.y + 18,
    r.x + r.w,
    bottom
  ]).fill(ROCK);
  g.poly([r.x + 20, r.y, r.x + r.w - 18, r.y, r.x + r.w - 26, r.y + 12, r.x + 28, r.y + 12]).fill(
    ROCK_LIGHT
  );
  g.moveTo(r.x + 30, r.y + 18).lineTo(r.x + 38, bottom - 6);
  g.moveTo(r.x + r.w - 34, r.y + 16).lineTo(r.x + r.w - 42, bottom - 4);
  g.stroke({ width: 1.2, color: ROCK_DARK, alpha: 0.6 });
  g.zIndex = bottom;
  return g;
}

// a stone that lies on the ground until it is laid on the rock, where it is drawn again as part of a low wall
export function makeStone(spot, i, rock) {
  const g = new Graphics();
  const slot = (rock.w - 20) / 4;
  const draw = laid => {
    g.clear();
    if (laid) {
      const x = rock.x + 10 + i * slot;
      g.roundRect(x, rock.y - 11, slot - 2, 11, 2).fill(0xd8cfb8);
      g.roundRect(x, rock.y - 11, slot - 2, 11, 2).stroke({ width: 1, color: ROCK_DARK });
      g.zIndex = rock.y + rock.h + 1;
    } else {
      g.ellipse(spot.x, spot.y - 4, 12, 4).fill({ color: 0x000000, alpha: 0.18 });
      g.roundRect(spot.x - 11, spot.y - 14, 22, 12, 4).fill(0xc8bea8);
      g.roundRect(spot.x - 11, spot.y - 14, 22, 12, 4).stroke({ width: 1, color: ROCK_DARK });
      g.zIndex = spot.y - 2;
    }
  };
  draw(false);
  return {
    g,
    laid: false,
    set(v) {
      this.laid = v;
      draw(v);
    }
  };
}

// The light that stands for Jesus: a warm glow on the ground, with a brighter heart. It is not a person and not drawn like
// one. The engine moves it among the disciples and fades it.
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
