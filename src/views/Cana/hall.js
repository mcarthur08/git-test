import { Graphics } from "pixi.js";
import {
  WORLD,
  WALL_Y,
  HEAD_TABLE,
  GUEST_TABLES,
  JARS,
  CISTERN,
  PLANTS,
  DANCE_FLOOR
} from "@/lib/cana/layout.js";

// The courtyard drawn with simple shapes: a tiled floor, the back wall with its arches, tables, the dance floor,
// the cistern, plants and a string of lanterns. The things people use (the six pots) are separate pieces so they
// can fill up and turn to wine.
export const mix = (a, b, t) => {
  const ch = (c, s) => (c >> s) & 255;
  const m = s => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};

const WATER = 0x5aa6d6;
const WINE = 0x7a1230;

export function drawFloor() {
  const g = new Graphics();
  g.rect(0, 0, WORLD.w, WORLD.h).fill(0xcfa977);
  const t = 30;
  for (let y = WALL_Y; y < WORLD.h; y += t) {
    for (let x = 0; x < WORLD.w; x += t) {
      if (((x / t + y / t) | 0) % 2 === 0) {
        g.rect(x, y, t, t).fill({ color: 0xd9b98a, alpha: 0.7 });
      }
    }
  }
  // the dance floor: a ring of colour
  g.ellipse(DANCE_FLOOR.x, DANCE_FLOOR.y, DANCE_FLOOR.rx, DANCE_FLOOR.ry).fill(0xb8864e);
  g.ellipse(DANCE_FLOOR.x, DANCE_FLOOR.y, DANCE_FLOOR.rx - 6, DANCE_FLOOR.ry - 4).fill(0xe6cfa0);
  g.ellipse(DANCE_FLOOR.x, DANCE_FLOOR.y, DANCE_FLOOR.rx - 22, DANCE_FLOOR.ry - 14).fill(0xc99a5c);
  g.ellipse(DANCE_FLOOR.x, DANCE_FLOOR.y, DANCE_FLOOR.rx - 28, DANCE_FLOOR.ry - 18).fill(0xe6cfa0);
  // a rug under the head table
  g.rect(HEAD_TABLE.x - 20, HEAD_TABLE.y - 8, HEAD_TABLE.w + 40, HEAD_TABLE.h + 36).fill({
    color: 0x8e3b2e,
    alpha: 0.55
  });
  // the back wall with three arches
  g.rect(0, 0, WORLD.w, WALL_Y).fill(0xb98f5f);
  g.rect(0, WALL_Y - 8, WORLD.w, 8).fill(0x8d6a40);
  [70, 180, 290].forEach(cx => {
    const base = WALL_Y - 8;
    const top = base - 28;
    const pts = [cx - 28, base, cx - 28, top];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI - (k / 12) * Math.PI;
      pts.push(cx + Math.cos(a) * 28, top - Math.sin(a) * 22);
    }
    pts.push(cx + 28, top, cx + 28, base);
    g.poly(pts).fill(0x6a4a2e);
    g.poly(pts.map((v, i) => (i % 2 ? v + 3 : v))).fill({ color: 0x3a2a1c, alpha: 0.6 });
  });
  // the soft dark at the edges
  g.rect(0, WALL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.18 });
  g.rect(WORLD.w - 8, WALL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.18 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.2 });
  return g;
}

// A string of lanterns across the courtyard, drawn over everything. Returns the glow circles so they can pulse.
export function drawLanterns() {
  const g = new Graphics();
  g.moveTo(8, 20).quadraticCurveTo(180, 70, 352, 20).stroke({ width: 1.2, color: 0x2a2018 });
  const glows = [];
  [40, 90, 135, 180, 225, 270, 320].forEach(x => {
    const t = (x - 8) / 344;
    const y = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 70 + t * t * 20;
    g.circle(x, y + 5, 4.2).fill(0xffd46a);
    glows.push({ x, y: y + 5 });
  });
  return { g, glows };
}

export function drawHeadTable() {
  const g = new Graphics();
  const t = HEAD_TABLE;
  g.roundRect(t.x, t.y, t.w, t.h, 6).fill(0x8a5e34);
  g.roundRect(t.x + 3, t.y + 3, t.w - 6, t.h - 8, 5).fill(0xf4ead2);
  g.rect(t.x + 3, t.y + t.h - 10, t.w - 6, 4).fill({ color: 0xc9a04b, alpha: 0.9 });
  // food and cups on the cloth
  [18, 44, 72, 100, 122].forEach((dx, i) => {
    g.circle(t.x + dx, t.y + 11, 3.4).fill(i % 2 ? 0xd9a25a : 0xc9a04b);
  });
  g.zIndex = t.y + t.h;
  return g;
}

export function drawGuestTable(t) {
  const g = new Graphics();
  const cx = t.x + t.w / 2;
  const cy = t.y + t.h / 2;
  g.ellipse(cx, cy + 5, t.w / 2 + 3, t.h / 2 - 2).fill({ color: 0x000000, alpha: 0.18 });
  g.ellipse(cx, cy + 2, t.w / 2, t.h / 2 - 3).fill(0x8a5e34);
  g.ellipse(cx, cy - 2, t.w / 2, t.h / 2 - 5).fill(0xf4ead2);
  g.ellipse(cx, cy - 2, t.w / 2 - 6, t.h / 2 - 11).fill(0xe8d9b4);
  [-10, 0, 10].forEach((dx, i) =>
    g.circle(cx + dx, cy - 2 + (i === 1 ? -2 : 1), 3).fill(i === 1 ? 0xc9a04b : 0xd9a25a)
  );
  g.zIndex = t.y + t.h - 6;
  return g;
}

export function drawPlant(p) {
  const g = new Graphics();
  g.ellipse(p.x + 8, p.y + 14, 9, 4).fill({ color: 0x000000, alpha: 0.2 });
  g.roundRect(p.x + 2, p.y + 6, 12, 10, 3).fill(0xa8583a);
  [-1, 0, 1].forEach(k => {
    g.poly([p.x + 8, p.y + 8, p.x + 8 + k * 11, p.y - 8, p.x + 8 + k * 4, p.y + 6]).fill(0x5f7a3a);
  });
  g.zIndex = p.y + 16;
  return g;
}

export function drawCistern() {
  const g = new Graphics();
  const c = CISTERN;
  g.ellipse(c.x + c.w / 2, c.y + c.h - 2, c.w / 2 + 4, 8).fill({ color: 0x000000, alpha: 0.2 });
  g.roundRect(c.x, c.y + 10, c.w, c.h - 12, 8).fill(0xa39a8a);
  g.ellipse(c.x + c.w / 2, c.y + 12, c.w / 2, 11).fill(0xbfb6a4);
  g.ellipse(c.x + c.w / 2, c.y + 12, c.w / 2 - 5, 8).fill(0x3f7aa0);
  g.rect(c.x + 2, c.y - 12, 3, 26).fill(0x4a3421);
  g.rect(c.x + c.w - 5, c.y - 12, 3, 26).fill(0x4a3421);
  g.rect(c.x - 2, c.y - 14, c.w + 4, 4).fill(0x4a3421);
  g.zIndex = c.y + c.h;
  return g;
}

// One of the six stone pots. It starts empty, takes water (level 0 to 1), then turns to wine (wine 0 to 1).
export class Jar {
  constructor(def) {
    this.def = def;
    this.level = 0;
    this.wine = 0;
    this.assigned = null;
    this.g = new Graphics();
    this.g.zIndex = def.y + 16;
    this.draw();
  }

  get full() {
    return this.level >= 1;
  }

  draw() {
    const { x, y } = this.def;
    const g = this.g;
    g.clear();
    g.ellipse(x, y + 14, 17, 5).fill({ color: 0x000000, alpha: 0.2 });
    g.poly([
      x - 9,
      y - 10,
      x - 15,
      y - 2,
      x - 14,
      y + 8,
      x - 8,
      y + 14,
      x + 8,
      y + 14,
      x + 14,
      y + 8,
      x + 15,
      y - 2,
      x + 9,
      y - 10
    ]).fill(0xa39580);
    g.poly([
      x + 2,
      y - 10,
      x + 9,
      y - 10,
      x + 15,
      y - 2,
      x + 14,
      y + 8,
      x + 8,
      y + 14,
      x + 3,
      y + 14
    ]).fill({ color: 0x000000, alpha: 0.14 });
    g.ellipse(x, y - 10, 9.5, 3.4).fill(0x7f735f);
    const inner = this.level > 0 ? mix(WATER, WINE, this.wine) : 0x3a3228;
    g.ellipse(x, y - 10, 7.6, 2.4).fill(inner);
    if (this.level > 0) {
      g.ellipse(x - 2, y - 10.6, 3, 0.9).fill({ color: 0xffffff, alpha: 0.35 });
    }
    // a dark band round the belly of the pot
    g.rect(x - 14.4, y + 1, 28.8, 2).fill({ color: 0x5a4f3f, alpha: 0.5 });
  }

  setLevel(v) {
    this.level = Math.max(0, Math.min(1, v));
    this.draw();
  }

  setWine(v) {
    this.wine = Math.max(0, Math.min(1, v));
    this.draw();
  }
}

export const makeJars = () => JARS.map(d => new Jar(d));
export const tables = () => [drawHeadTable(), ...GUEST_TABLES.map(drawGuestTable)];
export const plants = () => PLANTS.map(drawPlant);
