import { Container, Graphics } from "pixi.js";

// The Sea of Galilee drawn with simple shapes: open water with rows of waves, the boat (hull, planks, mast, and the
// pillow where he slept), puddles of water on the deck, the other little ships, and the weather that comes and goes: dark
// cloud, rain and lightning. Colours are soft so the characters stand out. Nothing here is redrawn once it is made: the
// weather and waves only move, fade or show, which keeps it light on a phone.
const SEA = 0x2f7391;
const WAVE = 0x8cc8dc;
const WOOD = 0xb08552;
const WOOD_DARK = 0x7d5a32;

// a number from 0 to 1 that is always the same for the same i, so the sea looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Open water, with three rows of waves that the engine slides along. `rows` are the containers to move.
export function makeSea(layout) {
  const { WORLD } = layout;
  const g = new Container();
  const base = new Graphics();
  base.rect(0, 0, WORLD.w, WORLD.h).fill(SEA);
  for (let i = 0; i < 18; i++) {
    base
      .ellipse(
        rnd(i) * WORLD.w,
        rnd(i + 30) * WORLD.h,
        50 + rnd(i + 60) * 70,
        16 + rnd(i + 90) * 20
      )
      .fill({ color: i % 2 ? 0x3a82a2 : 0x286680, alpha: 0.4 });
  }
  g.addChild(base);
  const rows = [0, 1, 2].map(r => {
    const row = new Container();
    const line = new Graphics();
    // crests a little longer than the picture, so the row can slide without a gap showing
    const count = Math.ceil(WORLD.w / 34) + 4;
    for (let i = 0; i < count; i++) {
      const x = i * 34;
      const y = ((i * 37 + r * 53) % 11) * 4;
      line.moveTo(x, y).quadraticCurveTo(x + 9, y - 5 - r * 2, x + 18, y);
    }
    line.stroke({ width: 1.4 + r * 0.5, color: WAVE, alpha: 0.35 + r * 0.1 });
    // each row is repeated down the picture
    const second = line.clone();
    second.y = WORLD.h / 1.6;
    row.addChild(line, second);
    row.y = (r + 0.5) * (WORLD.h / 3.2);
    row.baseY = row.y;
    return row;
  });
  rows.forEach(r => g.addChild(r));
  return { g, rows };
}

// The boat: an outline round the deck, with a pointed bow. It lies along the long side of the picture, bow to the right
// in the wide place and at the top in the tall one.
export function drawBoat(layout) {
  const { DECK, kind } = layout;
  const g = new Graphics();
  const e = 14;
  const x = DECK.x - e;
  const y = DECK.y - e;
  const w = DECK.w + e * 2;
  const h = DECK.h + e * 2;
  // shadow on the water
  g.roundRect(x + 4, y + 8, w, h, 30).fill({ color: 0x000000, alpha: 0.2 });
  // the hull and the bow
  if (kind === "landscape") {
    g.roundRect(x, y, w, h, 24).fill(WOOD_DARK);
    g.poly([x + w - 8, y, x + w + 54, y + h / 2, x + w - 8, y + h]).fill(WOOD_DARK);
    g.roundRect(x + 5, y + 5, w - 10, h - 10, 20).fill(WOOD);
    g.poly([x + w - 12, y + 5, x + w + 40, y + h / 2, x + w - 12, y + h - 5]).fill(WOOD);
  } else {
    g.roundRect(x, y, w, h, 24).fill(WOOD_DARK);
    g.poly([x, y + 8, x + w / 2, y - 54, x + w, y + 8]).fill(WOOD_DARK);
    g.roundRect(x + 5, y + 5, w - 10, h - 10, 20).fill(WOOD);
    g.poly([x + 5, y + 12, x + w / 2, y - 40, x + w - 5, y + 12]).fill(WOOD);
  }
  // the deck planks
  g.rect(DECK.x, DECK.y, DECK.w, DECK.h).fill(0xc9a06a);
  if (kind === "landscape") {
    for (let py = DECK.y + 19; py < DECK.y + DECK.h; py += 19) {
      g.rect(DECK.x, py, DECK.w, 1.4).fill({ color: WOOD_DARK, alpha: 0.5 });
    }
  } else {
    for (let px = DECK.x + 20; px < DECK.x + DECK.w; px += 20) {
      g.rect(px, DECK.y, 1.4, DECK.h).fill({ color: WOOD_DARK, alpha: 0.5 });
    }
  }
  // a rail round the deck
  g.rect(DECK.x - 4, DECK.y - 4, DECK.w + 8, DECK.h + 8).stroke({ width: 3, color: WOOD_DARK });
  return g;
}

// the mast, with the sail furled along its beam
export function drawMast(m, layout) {
  const g = new Graphics();
  const cx = m.x + m.w / 2;
  g.ellipse(cx, m.y + m.h, m.w / 2 + 3, 4).fill({ color: 0x000000, alpha: 0.25 });
  g.rect(cx - 3, m.y - 56, 6, m.h + 56).fill(WOOD_DARK);
  g.rect(cx - 3, m.y - 56, 2, m.h + 56).fill(WOOD);
  const long = layout.kind === "landscape";
  const bx = long ? cx - 6 : cx - 34;
  const by = long ? m.y - 40 : m.y - 40;
  g.roundRect(bx, by, long ? 12 : 68, long ? 68 : 10, 4).fill(0xe8dcc0);
  g.roundRect(bx, by, long ? 12 : 68, long ? 68 : 10, 4).stroke({ width: 1, color: 0xb9a888 });
  g.zIndex = m.y + m.h;
  return g;
}

// the pillow at the back of the boat, with the cloak folded beside it: he is not drawn, only the place he rests
export function drawPillow(p, layout) {
  const g = new Graphics();
  const wide = layout.kind === "portrait";
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  g.ellipse(cx, cy + p.h / 2, p.w / 2 + 4, 6).fill({ color: 0x000000, alpha: 0.22 });
  // a folded cloak, then a pillow on it
  g.roundRect(p.x, p.y + 4, p.w, p.h - 4, 8).fill(0x8a4f3a);
  g.roundRect(p.x + 2, p.y + 6, p.w - 4, 6, 4).fill(0xa66550);
  const pw = wide ? p.w * 0.6 : p.w * 0.7;
  const ph = wide ? p.h * 0.55 : p.h * 0.34;
  g.roundRect(cx - pw / 2, cy - ph / 2 - 2, pw, ph, 6).fill(0xf0e8d6);
  g.roundRect(cx - pw / 2, cy - ph / 2 - 2, pw, ph, 6).stroke({ width: 1, color: 0xc9bfa8 });
  g.zIndex = p.y + p.h;
  return g;
}

// the soft light that rests on the pillow once the sea is calm
export function makePillowGlow(p) {
  const g = new Graphics();
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  [
    [60, 34, 0.08],
    [42, 24, 0.12],
    [26, 15, 0.16]
  ].forEach(([rx, ry, a]) => g.ellipse(cx, cy, rx, ry).fill({ color: 0xfff1b0, alpha: a }));
  g.alpha = 0;
  return { g };
}

// the water that has come over the side: a sheet over the whole deck (more or less see-through as the boat fills) and
// puddles to bail out one by one
export function makeWater(layout) {
  const { DECK, PUDDLES } = layout;
  const sheet = new Graphics();
  sheet.rect(DECK.x, DECK.y, DECK.w, DECK.h).fill(0x3b86a8);
  sheet.alpha = 0;
  const puddles = PUDDLES.map(def => {
    const g = new Graphics();
    g.ellipse(def.x, def.y, 17, 7).fill({ color: 0x3b86a8, alpha: 0.85 });
    g.ellipse(def.x - 4, def.y - 1.5, 9, 3).fill({ color: 0x9fd4e8, alpha: 0.7 });
    g.visible = false;
    return { def, g, wet: false, claimed: false };
  });
  return { sheet, puddles };
}

// one of the other little ships that were with them (Mark 4:36), drawn small on the water
export function drawShip(s) {
  const g = new Container();
  const hull = new Graphics();
  hull.ellipse(0, 4, 30, 8).fill({ color: 0x000000, alpha: 0.2 });
  hull.poly([-28, -2, 28, -2, 20, 9, -20, 9]).fill(WOOD_DARK);
  hull.rect(-2, -30, 3, 30).fill(WOOD_DARK);
  hull.poly([2, -29, 22, -6, 2, -6]).fill(0xe8dcc0);
  g.addChild(hull);
  g.position.set(s.x, s.y);
  g.scale.set(s.s);
  return g;
}

// The weather: a dark shade over everything, a warm shade for the evening, streaks of rain that slide down, and a white
// flash for lightning. All are made once and only faded or moved.
export function makeWeather(layout) {
  const { WORLD } = layout;
  const shade = new Graphics();
  shade.rect(0, 0, WORLD.w, WORLD.h).fill(0xffffff);
  shade.tint = 0x0b1a2a;
  shade.alpha = 0;
  const rain = new Container();
  const tile = new Graphics();
  for (let i = 0; i < 70; i++) {
    const x = rnd(i + 500) * (WORLD.w + 40);
    const y = rnd(i + 700) * WORLD.h;
    tile.moveTo(x, y).lineTo(x - 5, y + 14);
  }
  tile.stroke({ width: 1.1, color: 0xcfe6f2, alpha: 0.55 });
  const tile2 = tile.clone();
  tile2.y = -WORLD.h;
  rain.addChild(tile, tile2);
  rain.alpha = 0;
  const flash = new Graphics();
  flash.rect(0, 0, WORLD.w, WORLD.h).fill(0xf4fbff);
  flash.alpha = 0;
  return { shade, rain, flash, rainTiles: [tile, tile2] };
}
