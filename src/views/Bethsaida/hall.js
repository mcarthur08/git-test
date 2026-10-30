import { Graphics } from "pixi.js";

// The hillside at Bethsaida drawn with simple shapes: sky, the lake and far hills, a field of long grass ("there was much
// grass in the place", John 6:10), five rings where the companies sit, a flat rock for the bread, trees, baskets, and the
// grass people sit in. Colours are warm and soft so the characters stand out.
const GRASS = 0x93b25c;

// a number from 0 to 1 that is always the same for the same i, so the field looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawField(layout) {
  const { WORLD, HILL_Y, GROUPS } = layout;
  const g = new Graphics();
  // the sky, the far hills and the lake
  g.rect(0, 0, WORLD.w, HILL_Y).fill(0xbfe3f2);
  g.rect(0, HILL_Y * 0.4, WORLD.w, HILL_Y * 0.3).fill(0xe6f2f4);
  g.poly([
    0,
    HILL_Y * 0.62,
    WORLD.w * 0.18,
    HILL_Y * 0.3,
    WORLD.w * 0.4,
    HILL_Y * 0.55,
    WORLD.w * 0.62,
    HILL_Y * 0.25,
    WORLD.w * 0.86,
    HILL_Y * 0.5,
    WORLD.w,
    HILL_Y * 0.34,
    WORLD.w,
    HILL_Y,
    0,
    HILL_Y
  ]).fill(0xa9c4a0);
  g.rect(0, HILL_Y * 0.7, WORLD.w, HILL_Y * 0.14).fill(0x6fa6c4);
  for (let i = 0; i < 9; i++) {
    g.rect(WORLD.w * (0.05 + i * 0.11), HILL_Y * 0.76, 14, 1.4).fill({
      color: 0xffffff,
      alpha: 0.55
    });
  }
  // the near slope, with a scalloped crest
  g.rect(0, HILL_Y - 4, WORLD.w, WORLD.h - HILL_Y + 4).fill(GRASS);
  for (let x = -10; x < WORLD.w + 20; x += 34) {
    g.ellipse(x + 17, HILL_Y - 3, 24, 9).fill(0x84a44f);
  }
  // soft light and dark patches in the grass
  for (let i = 0; i < 26; i++) {
    const x = rnd(i) * WORLD.w;
    const y = HILL_Y + rnd(i + 40) * (WORLD.h - HILL_Y);
    g.ellipse(x, y, 30 + rnd(i + 80) * 40, 12 + rnd(i + 120) * 16).fill({
      color: i % 2 ? 0xa4c26a : 0x82a24d,
      alpha: 0.35
    });
  }
  // blades of long grass, and a few flowers
  for (let i = 0; i < 170; i++) {
    const x = 10 + rnd(i + 200) * (WORLD.w - 20);
    const y = HILL_Y + 8 + rnd(i + 400) * (WORLD.h - HILL_Y - 20);
    const h = 5 + rnd(i + 600) * 6;
    g.poly([x - 1.4, y, x, y - h, x + 1.4, y]).fill(i % 3 ? 0x6f9440 : 0xa9c76f);
    if (i % 17 === 0) {
      g.circle(x + 3, y - h, 1.5).fill([0xfff2a8, 0xffffff, 0xf0a0a0][i % 3]);
    }
  }
  // the five companies: a lighter ring of grass for each
  GROUPS.forEach(c => {
    g.ellipse(c.x, c.y + 4, c.rx + 14, c.ry + 14).fill({ color: 0xb9d27a, alpha: 0.45 });
    g.ellipse(c.x, c.y + 4, c.rx + 14, c.ry + 14).stroke({
      width: 1.2,
      color: 0xe8f0b8,
      alpha: 0.6
    });
  });
  // the soft dark at the edges
  g.rect(0, HILL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.14 });
  g.rect(WORLD.w - 8, HILL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.14 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.18 });
  return g;
}

export function drawTree(t) {
  const g = new Graphics();
  const cx = t.x + t.w / 2;
  g.ellipse(cx, t.y + t.h - 2, t.w / 2 + 6, 5).fill({ color: 0x000000, alpha: 0.2 });
  g.rect(cx - 2.4, t.y + 6, 4.8, t.h - 6).fill(0x6a4a2e);
  g.ellipse(cx, t.y + 2, t.w / 2 + 10, t.h / 2 + 8).fill(0x5f8a3a);
  g.ellipse(cx - 6, t.y - 2, t.w / 2 + 2, t.h / 2 + 2).fill(0x73a04a);
  g.zIndex = t.y + t.h;
  return g;
}

// the flat rock where the bread is laid and blessed
export function drawRock(r) {
  const g = new Graphics();
  g.ellipse(r.x + r.w / 2, r.y + r.h, r.w / 2 + 8, 7).fill({ color: 0x000000, alpha: 0.2 });
  g.roundRect(r.x, r.y + 8, r.w, r.h - 8, 8).fill(0x9c9486);
  g.roundRect(r.x + 3, r.y + 8, r.w - 6, 7, 5).fill(0x7f786b);
  g.ellipse(r.x + r.w / 2, r.y + 12, r.w / 2, 11).fill(0xbdb5a6);
  g.ellipse(r.x + r.w / 2 - 4, r.y + 10, r.w / 2 - 12, 7).fill(0xd2cbbb);
  g.zIndex = r.y + r.h - 2;
  return g;
}

// the five barley loaves and two small fishes, laid on the rock one at a time
export function makeOffering(r) {
  const g = new Graphics();
  const cx = r.x + r.w / 2;
  const cy = r.y + 11;
  const items = [
    ["loaf", -20, 0],
    ["loaf", -10, -3],
    ["loaf", 0, 0],
    ["loaf", 10, -3],
    ["loaf", 20, 0],
    ["fish", -14, 5],
    ["fish", 14, 5]
  ];
  let shown = 0;
  const draw = () => {
    g.clear();
    items.slice(0, shown).forEach(([kind, dx, dy]) => {
      const x = cx + dx;
      const y = cy + dy;
      if (kind === "loaf") {
        g.ellipse(x, y, 6.4, 4.2).fill(0xc9904a);
        g.ellipse(x - 1, y - 1.4, 4, 2).fill(0xdfae6a);
      } else {
        g.ellipse(x, y, 7, 2.8).fill(0x8fb0c4);
        g.poly([x + 6, y, x + 11, y - 3, x + 11, y + 3]).fill(0x7f9fb4);
        g.circle(x - 4, y - 0.6, 0.7).fill(0x2a1c0e);
      }
    });
  };
  draw();
  g.zIndex = r.y + r.h + 1;
  return {
    g,
    get shown() {
      return shown;
    },
    show(n) {
      shown = Math.max(0, Math.min(items.length, n));
      draw();
    },
    total: items.length
  };
}

// a soft light round the rock while the bread is blessed
export function makeGlow(r) {
  const g = new Graphics();
  const cx = r.x + r.w / 2;
  const cy = r.y + 12;
  [
    [74, 36, 0.1],
    [54, 26, 0.14],
    [36, 18, 0.18]
  ].forEach(([rx, ry, a]) => g.ellipse(cx, cy, rx, ry).fill({ color: 0xfff1b0, alpha: a }));
  g.alpha = 0;
  return { g };
}

// a basket of bread, or (once full) the fragments left over
export class Basket {
  constructor(def, full) {
    this.def = def;
    this.full = full;
    this.state = "idle";
    this.g = new Graphics();
    this.draw();
    this.g.zIndex = def.y + 4;
    this.g.visible = false;
  }

  draw() {
    const { x, y } = this.def;
    const g = this.g;
    g.clear();
    g.ellipse(x, y + 4, 11, 3.4).fill({ color: 0x000000, alpha: 0.2 });
    // the bread heaped above the rim
    const loaves = this.full ? 4 : 3;
    for (let k = 0; k < loaves; k++) {
      g.ellipse(x - 6 + k * 4.2, y - 6 - (k % 2) * 2.4, 4.4, 3).fill(k % 2 ? 0xdfae6a : 0xc9904a);
    }
    g.roundRect(x - 10, y - 6, 20, 11, 4).fill(0xb98a4b);
    g.rect(x - 9, y - 2, 18, 1.6).fill(0x8a6230);
    g.rect(x - 9, y + 1.6, 18, 1.6).fill(0x8a6230);
    g.ellipse(x, y - 6, 10.4, 2.6).fill(0xd2a560);
  }

  show() {
    this.g.visible = true;
  }

  hide() {
    this.g.visible = false;
  }
}

// the long grass a person sits in: a mound drawn in front of them, so they seem to sit on the ground
export function makeTuft(seat) {
  const g = new Graphics();
  const { x, y } = seat;
  g.ellipse(x, y - 4, 21, 14).fill(0x7a9c48);
  g.ellipse(x - 5, y - 8, 14, 9).fill(0x8aae55);
  for (let k = -4; k <= 4; k++) {
    g.poly([
      x + k * 4.2 - 1.6,
      y - 8,
      x + k * 4.2 + (k % 2 ? 2.4 : -2.4),
      y - 20 - (k % 3) * 2,
      x + k * 4.2 + 1.6,
      y - 8
    ]).fill(k % 2 ? 0x6f9440 : 0x8aae55);
  }
  g.zIndex = y + 1;
  g.visible = false;
  return g;
}
