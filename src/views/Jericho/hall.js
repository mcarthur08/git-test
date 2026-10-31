import { Graphics } from "pixi.js";

// The street in Jericho drawn with simple shapes: a wall of flat-roofed houses along the back, packed earth with the road
// across it, palms, the sycamore (its trunk and leaves are separate, so someone up in it is hidden among the leaves), and
// the light that stands for Jesus passing by. Colours are warm and sandy so the characters stand out.
const SAND = 0xe0c590;
const EARTH = 0xcfb07a;
const ROAD = 0xe6d2a4;

// a number from 0 to 1 that is always the same for the same i, so the street looks the same every time
const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// the houses, the earth and the road. The last house on the right is Zacchaeus's: its door is `door`.
export function drawTown(layout) {
  const { WORLD, WALL_Y, ROAD: road, HOUSE_DOOR: door } = layout;
  const g = new Graphics();
  // sky above the roofs
  g.rect(0, 0, WORLD.w, WALL_Y).fill(0xbfe3f2);
  g.rect(0, WALL_Y * 0.55, WORLD.w, WALL_Y * 0.2).fill(0xe6f2f4);
  // houses: boxes of different heights with a dark door and small windows
  let x = -10;
  let i = 0;
  while (x < WORLD.w) {
    const w = 52 + Math.round(rnd(i) * 30);
    const h = WALL_Y - 34 - Math.round(rnd(i + 20) * 26);
    const mine = door.x >= x && door.x < x + w;
    const fill = mine ? 0xf0d9a6 : [0xe3c993, 0xd9bb82, 0xeed7a8][i % 3];
    g.rect(x, WALL_Y - h, w, h).fill(fill);
    g.rect(x, WALL_Y - h, w, 5).fill({ color: 0xa8895a, alpha: 0.55 });
    g.rect(x + w - 4, WALL_Y - h, 4, h).fill({ color: 0x000000, alpha: 0.08 });
    const dx = mine ? door.x : x + w / 2;
    g.roundRect(dx - 8, WALL_Y - 26, 16, 26, 7).fill(mine ? 0x6a3f22 : 0x5d4630);
    if (h > 50) {
      g.rect(x + 8, WALL_Y - h + 14, 9, 11).fill(0x6b5538);
      g.rect(x + w - 17, WALL_Y - h + 14, 9, 11).fill(0x6b5538);
    }
    x += w + 3;
    i++;
  }
  // packed earth in front of the houses, with the road lighter across it
  g.rect(0, WALL_Y, WORLD.w, WORLD.h - WALL_Y).fill(EARTH);
  for (let k = 0; k < 24; k++) {
    g.ellipse(
      rnd(k + 5) * WORLD.w,
      WALL_Y + rnd(k + 45) * (WORLD.h - WALL_Y),
      30 + rnd(k + 85) * 40,
      8 + rnd(k + 125) * 12
    ).fill({
      color: k % 2 ? 0xd9bd88 : 0xc4a46c,
      alpha: 0.35
    });
  }
  g.rect(0, road.y, WORLD.w, road.h).fill(ROAD);
  g.rect(0, road.y, WORLD.w, 3).fill({ color: 0xb5976a, alpha: 0.7 });
  g.rect(0, road.y + road.h - 3, WORLD.w, 3).fill({ color: 0xb5976a, alpha: 0.7 });
  // wheel ruts and pebbles in the road
  for (let k = 0; k < 40; k++) {
    g.ellipse(rnd(k + 200) * WORLD.w, road.y + 8 + rnd(k + 300) * (road.h - 16), 2.2, 1.4).fill({
      color: 0xb09a72,
      alpha: 0.7
    });
  }
  // the soft dark at the edges
  g.rect(0, WALL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(WORLD.w - 8, WALL_Y, 8, WORLD.h).fill({ color: 0x000000, alpha: 0.12 });
  g.rect(0, WORLD.h - 10, WORLD.w, 10).fill({ color: 0x000000, alpha: 0.16 });
  return g;
}

// The sycamore: the trunk and a canopy behind, and (separately) a patch of leaves drawn in front of whoever is climbing, at
// the height they climb to, so they look to be up among the branches.
export function drawSycamore(tree) {
  const { trunk, base, lift } = tree;
  const cx = trunk.x + trunk.w / 2;
  const top = trunk.y - 62;
  const back = new Graphics();
  back.ellipse(cx, base.y, 24, 6).fill({ color: 0x000000, alpha: 0.2 });
  back.roundRect(cx - 7, top + 18, 14, trunk.y + trunk.h - top - 18, 5).fill(0x6a4a2e);
  back.roundRect(cx - 7, top + 18, 5, trunk.y + trunk.h - top - 18, 3).fill(0x84603c);
  // two limbs to hold on to
  back
    .poly([cx - 5, top + 46, cx - 30, top + 30, cx - 30, top + 38, cx - 4, top + 56])
    .fill(0x6a4a2e);
  back
    .poly([cx + 5, top + 40, cx + 28, top + 26, cx + 28, top + 34, cx + 4, top + 50])
    .fill(0x6a4a2e);
  // the canopy
  back.ellipse(cx, top + 6, 54, 34).fill(0x4f7f34);
  back.ellipse(cx - 22, top + 18, 34, 22).fill(0x5f8f3f);
  back.ellipse(cx + 24, top + 16, 34, 22).fill(0x5f8f3f);
  back.ellipse(cx - 4, top - 6, 38, 22).fill(0x6fa04a);
  back.zIndex = trunk.y + trunk.h;
  // the leaves in front: a band across the height they climb to
  const front = new Graphics();
  const fy = base.y - lift;
  front.ellipse(cx - 18, fy - 6, 26, 14).fill(0x5f8f3f);
  front.ellipse(cx + 14, fy - 2, 28, 15).fill(0x4f7f34);
  front.ellipse(cx - 2, fy + 2, 30, 12).fill(0x6fa04a);
  front.ellipse(cx - 34, fy + 2, 16, 10).fill(0x4f7f34);
  front.zIndex = base.y + 1;
  return { back, front };
}

// The light that stands for Jesus: a warm glow on the road, with a brighter heart. It is not a person and not drawn like
// one. The engine moves it along the street and fades it.
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

// the lamp-light at Zacchaeus's door, which comes on when he takes Jesus in
export function makeLamp(door) {
  const g = new Graphics();
  [
    [34, 22, 0.1],
    [22, 15, 0.16],
    [12, 9, 0.24]
  ].forEach(([rx, ry, a]) =>
    g.ellipse(door.x, door.y - 8, rx, ry).fill({ color: 0xffd98a, alpha: a })
  );
  g.alpha = 0;
  return { g };
}
