// Journey map geometry: where each stop is, how far along the road a player stands, and the static map artwork.
import { STOPS, DAYS } from "./data.js";
import { qpt } from "./util.js";
import { avatarSVG } from "./avatar.js";

export function segCtrl(k) {
  const a = STOPS[k];
  const b = STOPS[k + 1];
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const off = (k % 2 ? 1 : -1) * Math.min(28, len * 0.16);
  return { x: mx - (dy / len) * off, y: my + (dx / len) * off };
}

export function journeyPos(n) {
  n = Math.max(0, Math.min(DAYS, n));
  for (let k = 0; k < STOPS.length - 1; k++) {
    if (n < STOPS[k + 1].day) {
      const t = (n - STOPS[k].day) / (STOPS[k + 1].day - STOPS[k].day);
      return { k, t, ...qpt(STOPS[k], segCtrl(k), STOPS[k + 1], t) };
    }
  }
  const last = STOPS[STOPS.length - 1];
  return { k: STOPS.length - 1, t: 0, x: last.x, y: last.y };
}

export function routePath(n) {
  const p = journeyPos(n);
  let d = `M${STOPS[0].x} ${STOPS[0].y}`;
  for (let k = 0; k < p.k && k < STOPS.length - 1; k++) {
    const c = segCtrl(k);
    d += ` Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${STOPS[k + 1].x} ${STOPS[k + 1].y}`;
  }
  if (p.k < STOPS.length - 1 && p.t > 0) {
    const a = STOPS[p.k];
    const c = segCtrl(p.k);
    const c1 = { x: a.x + (c.x - a.x) * p.t, y: a.y + (c.y - a.y) * p.t };
    d += ` Q${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
}

export const fullRoute = () => routePath(DAYS);
export const placeAvatar = (svg, x, y, w) =>
  svg.replace(
    "<svg ",
    `<svg x="${(x - w / 2).toFixed(1)}" y="${(y - (w * 4) / 3 + 3).toFixed(
      1
    )}" width="${w}" height="${((w * 4) / 3).toFixed(1)}" `
  );

export const MAP_W = 360;
export const MAP_H = 560;

// Hills, trees, waves, land, rivers, labels and the dotted road never change, so they are built once.
const hills = [
  [200, 250],
  [225, 262],
  [188, 372],
  [210, 384],
  [176, 470],
  [196, 490],
  [232, 300],
  [168, 410],
  [245, 345],
  [320, 300],
  [330, 420],
  [312, 120],
  [205, 120]
]
  .map(
    ([x, y]) =>
      `<path d="M${x - 9} ${y} L${x} ${y - 9} L${
        x + 9
      } ${y} Z" fill="var(--hill)"/><path d="M${x} ${y - 9} L${x + 9} ${y} L${
        x + 3
      } ${y} Z" fill="var(--hill-2)"/>`
  )
  .join("");
const trees = [
  [240, 230],
  [250, 238],
  [190, 210],
  [300, 260],
  [306, 268],
  [232, 335],
  [180, 340],
  [258, 120],
  [315, 175],
  [150, 400]
]
  .map(
    ([x, y]) =>
      `<rect x="${
        x - 1
      }" y="${y}" width="2" height="5" fill="var(--map-ink)" opacity=".5"/><circle cx="${x}" cy="${
        y - 2
      }" r="5" fill="var(--tree)"/>`
  )
  .join("");
const waves = [
  [60, 120],
  [40, 200],
  [80, 330],
  [30, 420],
  [50, 500],
  [110, 60]
]
  .map(
    ([x, y]) =>
      `<path d="M${x} ${y} q5 -4 10 0 t10 0" fill="none" stroke="var(--sea-ink)" stroke-width="1.4" opacity=".45"/>`
  )
  .join("");
// Palms along the Jordan, wheat in the Galilee valleys, dunes in the south and a snowy Hermon in the north.
const palmAt = (x, y) =>
  `<path d="M${x} ${y} q1 -5 0 -10" fill="none" stroke="#5a4326" stroke-width="1.5" stroke-linecap="round"/><path d="M${x} ${
    y - 10
  } q-5 -2 -7 2 M${x} ${y - 10} q-6 -5 -9 -1 M${x} ${y - 10} q5 -2 7 2 M${x} ${
    y - 10
  } q6 -5 9 -1" fill="none" stroke="#4f7a34" stroke-width="1.5" stroke-linecap="round"/>`;
const terrain =
  [
    [262, 300],
    [266, 352],
    [262, 440],
    [286, 232]
  ]
    .map(([x, y]) => palmAt(x, y))
    .join("") +
  [
    [196, 205],
    [206, 214],
    [188, 214],
    [214, 226],
    [200, 226]
  ]
    .map(
      ([x, y]) =>
        `<path d="M${x} ${y} v-6 M${x + 2} ${y} v-5 M${
          x - 2
        } ${y} v-5" stroke="#c4a23c" stroke-width="1.2" stroke-linecap="round"/>`
    )
    .join("") +
  [
    [140, 505],
    [168, 522],
    [200, 538],
    [232, 522],
    [150, 548]
  ]
    .map(
      ([x, y]) =>
        `<path d="M${
          x - 12
        } ${y} q6 -7 12 -2 q6 -5 12 2" fill="none" stroke="var(--land-2)" stroke-width="2.2" stroke-linecap="round"/>`
    )
    .join("") +
  `<path d="M318 96 L334 64 L350 96 Z" fill="var(--hill)"/><path d="M334 64 l5 9 l-3 -2 l-2 4 l-3 -4 l-3 2 z" fill="#f4f6f8"/>`;
export const MAP_BASE = `
    <rect width="360" height="560" fill="var(--sea)"/>${waves}
    <path d="M150 0 Q165 40 168 88 Q170 120 158 132 Q174 140 150 154 Q140 190 130 230 Q118 290 102 350 Q88 410 74 470 Q62 520 52 560 L360 560 L360 0 Z" fill="var(--land)"/>
    <path d="M150 0 Q165 40 168 88 Q170 120 158 132 Q174 140 150 154 Q140 190 130 230 Q118 290 102 350 Q88 410 74 470 Q62 520 52 560" fill="none" stroke="var(--land-2)" stroke-width="6" opacity=".9"/>
    <path d="M300 0 Q340 140 320 260 Q345 380 330 560 L360 560 L360 0 Z" fill="var(--land-2)" opacity=".55"/>
    ${hills}${trees}${terrain}
    <path d="M292 62 Q285 85 282 101 M282 115 Q279 138 276 153 M275 197 Q262 230 276 262 Q262 300 274 340 Q262 380 270 430" fill="none" stroke="var(--sea-ink)" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="282" cy="108" rx="5" ry="7" fill="var(--sea)" stroke="var(--sea-ink)" stroke-width="1.5"/>
    <path d="M276 152 C292 152 291 175 287 188 C283 198 270 200 267 190 C262 176 264 156 276 152 Z" fill="var(--sea)" stroke="var(--sea-ink)" stroke-width="1.5"/>
    <path d="M270 430 C286 430 288 470 285 505 C283 530 270 540 264 525 C258 500 258 445 270 430 Z" fill="var(--sea)" stroke="var(--sea-ink)" stroke-width="1.5"/>
    <text x="74" y="270" class="m-sea" transform="rotate(-72 74 270)">THE GREAT SEA</text>
    <text x="298" y="214" class="m-water">Sea of</text><text x="298" y="224" class="m-water">Galilee</text>
    <text x="294" y="482" class="m-water">Salt Sea</text><text x="294" y="492" class="m-water">(Dead Sea)</text>
    <text x="284" y="318" class="m-water" transform="rotate(80 284 318)">Jordan</text>
    <text x="205" y="132" class="m-region">GALILEE</text><text x="168" y="290" class="m-region">SAMARIA</text>
    <text x="132" y="512" class="m-region">JUDAEA</text><text x="318" y="360" class="m-region" text-anchor="middle">PERAEA</text>
    <text x="316" y="240" class="m-region" text-anchor="middle">DECAPOLIS</text>
    <g transform="translate(30 40)"><circle r="16" fill="var(--surface)" opacity=".85"/><path d="M0 -12 L4 0 L0 -3 L-4 0 Z" fill="var(--flame)"/><path d="M0 12 L4 0 L0 3 L-4 0 Z" fill="var(--map-ink)" opacity=".5"/><text y="-17" text-anchor="middle" class="m-n">N</text></g>
    <path d="${fullRoute()}" fill="none" stroke="var(--map-ink)" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round" opacity=".55"/>
`;

const esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

// Everyone else on the road. Zoomed out (named = false): up to five per spot. Zoomed in: all of them, in rows, with names.
export function buildCrowd(people, meId, named) {
  const buckets = new Map();
  people.forEach(p => {
    if (meId && p.id === meId) {
      return;
    }
    const key = p.s.n;
    (buckets.get(key) || buckets.set(key, []).get(key)).push(p);
  });
  let crowd = "";
  buckets.forEach((ps, n) => {
    const pos = journeyPos(n);
    const shown = named ? ps : ps.slice(0, 5);
    const rows = [];
    const per = named ? 4 : 5;
    shown.forEach((p, j) => {
      (rows[Math.floor(j / per)] = rows[Math.floor(j / per)] || []).push(p);
    });
    rows
      .slice()
      .reverse()
      .forEach((row, ri) => {
        const r = rows.length - 1 - ri;
        row.forEach((p, j) => {
          const ox = named
            ? (j - (row.length - 1) / 2) * 16
            : (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 9;
          const oy = -r * (named ? 24 : 12);
          const x = pos.x + ox;
          const y = pos.y + oy;
          const first = p.alias.split(" ")[0];
          const label = first.length > 10 ? first.slice(0, 9) + "…" : first;
          crowd +=
            `<g class="m-person"><title>${esc(p.alias)} · ${p.s.n} days</title>${placeAvatar(
              avatarSVG(p.look, p.s.n),
              x,
              y,
              22
            )}` +
            (named
              ? `<text x="${x.toFixed(1)}" y="${(y + 5.5).toFixed(
                  1
                )}" text-anchor="middle" class="m-name">${esc(label)}</text>`
              : "") +
            `</g>`;
        });
      });
    if (!named && ps.length > 5) {
      crowd += `<text x="${pos.x + 26}" y="${pos.y - 18}" class="m-more">+${ps.length - 5}</text>`;
    }
  });
  return crowd;
}

// The player's own character, with the "You" tag. The big map animates it; the mini map keeps it still.
export function buildMe(look, myN, live) {
  const pos = journeyPos(myN);
  return `<g class="m-me">${placeAvatar(avatarSVG(look, myN, { live }), pos.x, pos.y, 34)}
      <g transform="translate(${pos.x.toFixed(1)} ${(pos.y - 52).toFixed(
    1
  )})"><rect x="-17" y="-9" width="34" height="14" rx="7" fill="var(--flame)"/><text x="0" y="1.5" text-anchor="middle" class="m-you">You</text></g></g>`;
}

// The mini map is a fixed window around the player; the big map uses the camera in the store.
export function miniViewBox(myN) {
  const p = journeyPos(myN);
  const w = 170;
  const h = 120;
  return `${Math.max(0, Math.min(360 - w, p.x - w / 2)).toFixed(0)} ${Math.max(
    0,
    Math.min(560 - h, p.y - h / 2 - 12)
  ).toFixed(0)} ${w} ${h}`;
}
