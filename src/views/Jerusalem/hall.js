import { Graphics } from "pixi.js";

// The upper room drawn with simple shapes: a plaster back wall with arched windows, lamps and a door, a stone floor with a
// rug under a long low table, the great water jar on its stand, a place laid for each guest (a plate, a loaf and a cup that
// can be filled), and the light that stands for Jesus at the head of the table. Colours are soft and warm so the
// characters stand out.
const PLASTER = 0xe4d2ac;
const WOOD = 0x8a5e34;
const WOOD_DARK = 0x5f4126;
const CLOTH = 0xf5ecd4;
const BREAD = 0xdcae66;
const GOLD = 0xd9b25a;
const WINE = 0x8a1f35;

// a number from 0 to 1 that is always the same for the same i, so the room looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawRoom(layout) {
  const { WORLD, WALL_Y, DOOR, TABLE } = layout;
  const g = new Graphics();
  // the wall, with a darker band along the top and a shadow where it meets the floor
  g.rect(0, 0, WORLD.w, WALL_Y).fill(PLASTER);
  g.rect(0, 0, WORLD.w, 10).fill({ color: 0x8a6a42, alpha: 0.5 });
  g.rect(0, WALL_Y - 8, WORLD.w, 8).fill({ color: 0x000000, alpha: 0.12 });
  // arched windows along the wall, with the evening sky in them
  const step = WORLD.w > 500 ? 150 : 100;
  for (let x = DOOR.x + step; x < WORLD.w - 40; x += step) {
    const top = WALL_Y - 62;
    g.roundRect(x - 15, top, 30, 52, 15).fill(0xf3c98a);
    g.rect(x - 15, top + 18, 30, 34).fill(0xf3c98a);
    g.roundRect(x - 15, top, 30, 52, 15).stroke({ width: 2, color: 0x8a6a42 });
    g.rect(x - 1, top + 6, 2, 46).fill({ color: 0x8a6a42, alpha: 0.8 });
  }
  // the door, where the stairs come up
  g.roundRect(DOOR.x - 22, WALL_Y - 58, 44, 64, 20).fill(WOOD_DARK);
  g.rect(DOOR.x - 22, WALL_Y - 40, 44, 46).fill(WOOD_DARK);
  g.roundRect(DOOR.x - 16, WALL_Y - 52, 32, 56, 15).fill(0x2a1c10);
  g.rect(DOOR.x - 16, WALL_Y - 36, 32, 40).fill(0x2a1c10);
  // the floor, with its flagstones
  g.rect(0, WALL_Y, WORLD.w, WORLD.h - WALL_Y).fill(0xcfae78);
  for (let y = WALL_Y + 30; y < WORLD.h; y += 36) {
    g.rect(0, y, WORLD.w, 1.2).fill({ color: 0x8a6a42, alpha: 0.18 });
  }
  for (let i = 0; i < 40; i++) {
    g.ellipse(
      rnd(i) * WORLD.w,
      WALL_Y + 10 + rnd(i + 40) * (WORLD.h - WALL_Y - 20),
      24 + rnd(i + 80) * 36,
      6 + rnd(i + 120) * 10
    ).fill({ color: i % 2 ? 0xdcc08c : 0xbf9d68, alpha: 0.3 });
  }
  // the rug under the table, with a border
  const rug = { x: TABLE.x - 44, y: TABLE.y - 38, w: TABLE.w + 88, h: TABLE.h + 90 };
  g.roundRect(rug.x, rug.y, rug.w, rug.h, 10).fill(0x8a3b32);
  g.roundRect(rug.x + 6, rug.y + 6, rug.w - 12, rug.h - 12, 7).stroke({
    width: 2,
    color: GOLD,
    alpha: 0.85
  });
  g.roundRect(rug.x + 14, rug.y + 14, rug.w - 28, rug.h - 28, 5).stroke({
    width: 1,
    color: 0xe8c9a0,
    alpha: 0.5
  });
  // lamps on the wall: a small flame with a soft glow
  [WORLD.w * 0.36, WORLD.w * 0.64].forEach(x => {
    g.ellipse(x, WALL_Y - 40, 22, 16).fill({ color: 0xffd46a, alpha: 0.2 });
    g.ellipse(x, WALL_Y - 40, 11, 8).fill({ color: 0xffd46a, alpha: 0.3 });
    g.roundRect(x - 5, WALL_Y - 34, 10, 6, 2).fill(WOOD_DARK);
    g.ellipse(x, WALL_Y - 40, 2.4, 4.2).fill(0xfff1b0);
  });
  g.rect(0, WALL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(WORLD.w - 8, WALL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// the long low table under a white cloth that hangs over the front edge
export function drawTable(t) {
  const g = new Graphics();
  const bottom = t.y + t.h;
  g.ellipse(t.x + t.w / 2, bottom + 12, t.w / 2 + 10, 9).fill({ color: 0x000000, alpha: 0.2 });
  g.roundRect(t.x - 4, t.y - 4, t.w + 8, t.h + 14, 6).fill(0xe2d6b8);
  g.roundRect(t.x - 4, t.y - 4, t.w + 8, t.h + 14, 6).stroke({ width: 1, color: 0xb9a888 });
  g.roundRect(t.x, t.y, t.w, t.h, 4).fill(CLOTH);
  g.rect(t.x + 6, t.y + 5, t.w - 12, 1.4).fill({ color: GOLD, alpha: 0.7 });
  g.rect(t.x + 6, bottom - 6, t.w - 12, 1.4).fill({ color: GOLD, alpha: 0.7 });
  g.zIndex = bottom + 10;
  return g;
}

// the great water jar on its stand, by the wall
export function drawJar(j) {
  const g = new Graphics();
  const cx = j.x + j.w / 2;
  g.ellipse(cx, j.y + j.h + 2, j.w / 2 + 4, 6).fill({ color: 0x000000, alpha: 0.2 });
  g.rect(j.x + 4, j.y + j.h - 14, j.w - 8, 14).fill(WOOD_DARK);
  g.ellipse(cx, j.y + j.h - 20, j.w / 2 - 2, j.h / 2 - 2).fill(0xb5683a);
  g.ellipse(cx, j.y + 8, j.w / 2 - 12, 5).fill(0x7a4527);
  g.ellipse(cx, j.y + 8, j.w / 2 - 15, 3).fill(0x4a6a80);
  g.zIndex = j.y + j.h;
  return g;
}

// A place laid at the table: a bare mat until it is set, then a plate with a loaf and a cup. When the cup is shared the cup
// is filled with wine, and when the bread is shared the loaf is shown broken. `z` is where it sits among the drawing.
export function makeSetting(seat, z) {
  const g = new Graphics();
  const s = {
    g,
    on: false,
    cup: false,
    bread: false,
    draw() {
      g.clear();
      if (!s.on) {
        g.roundRect(-14, -6, 28, 12, 3).fill({ color: 0xcdbf9c, alpha: 0.35 });
        return;
      }
      g.ellipse(0, 0, 14, 5.4).fill({ color: 0xffffff, alpha: 0.95 });
      g.ellipse(0, 0, 14, 5.4).stroke({ width: 0.8, color: 0xb9a888 });
      if (s.bread) {
        g.ellipse(-5, 0.6, 4.2, 2.6).fill(BREAD);
        g.ellipse(3, -1, 4.2, 2.6).fill(BREAD);
        g.circle(-0.5, 2, 0.7).fill(BREAD);
      } else {
        g.ellipse(-1, 0, 7, 3.2).fill(BREAD);
        g.rect(-4, -1.8, 1, 3).fill({ color: 0xb98a4b, alpha: 0.8 });
        g.rect(0, -1.8, 1, 3).fill({ color: 0xb98a4b, alpha: 0.8 });
      }
      g.circle(12, -5, 3.6).fill(GOLD);
      g.circle(12, -5, 3.6).stroke({ width: 0.7, color: 0x8a6a2e });
      g.circle(12, -5, s.cup ? 2.4 : 1.7).fill(s.cup ? WINE : 0xf0e2b8);
    },
    set(v) {
      s.on = v;
      if (!v) {
        s.cup = false;
        s.bread = false;
      }
      s.draw();
    },
    // `kind` is "cup" or "bread"
    mark(kind) {
      s[kind] = true;
      s.draw();
    }
  };
  g.position.set(seat.px, seat.py);
  g.zIndex = z;
  s.draw();
  return s;
}

// The light that stands for Jesus: a warm glow on the floor, with a brighter heart. It is not a person and not drawn like
// one. The engine moves it, fades it, and swells it at the last.
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
