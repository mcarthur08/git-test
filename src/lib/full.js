// The full-body character (200 x 400): an outlined, cel-shaded storybook figure. The head comes from buildParts
// (the same face, hair, beard, headwear and jewelry as the portrait); the body is drawn here.
import { SKINS, UNLOCK, MANTLES, JEWELS } from "./data.js";
import { shade } from "./util.js";
import { buildParts } from "./portrait.js";

const INK = "#2B1B12";
// Arm poses for the scenes: [the arm on the left of the picture, the one on the right], in degrees about the shoulder.
export const POSES = { wave: [120, 0], wave2: [150, 0], up: [155, 155], up2: [135, 135] };
// The portrait's head (about 100 units tall) is scaled to about a sixth of the figure's height.
const HEAD = "translate(34 -21) scale(.66)";

export function fullSVG(look, n, opts = {}) {
  const { L, u, defs, hairBack, coverBack, head } = buildParts(look, n, { outline: true });
  const f = L.g === "f";
  const skin = SKINS[L.skin];
  const skinD = shade(skin, -0.16);
  const tunic = UNLOCK.tunic[L.tunic][1];
  const tunicD = shade(tunic, -0.2);
  const tunicDD = shade(tunic, -0.32);
  const sash = UNLOCK.sash[L.sash][1];
  const [, mantle, accent] = MANTLES[L.g][L.mantle];
  const mantleD = shade(mantle, -0.2);
  const item = UNLOCK.item[L.item][1];
  const trim = accent || shade(tunic, 0.35);

  const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const PO = (d, fill, w = 2, extra = "") =>
    P(
      d,
      fill,
      `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}`
    );
  const S = (d, c, w, extra = "") =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const mirror = svg => `<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;

  const sw = f ? 30 : 40; // shoulder half-width
  const nw = f ? 11 : 14; // neck half-width at the collar
  const hw = f ? 47 : 44; // hem half-width
  const ww = 21; // waist half-width (women)
  const by = f ? 178 : 176; // top of the sash
  const bh = f ? 14 : 16; // height of the sash
  // A work tunic is hitched up to the knee (men) or the calf (women), so the legs show.
  const short = L.hem === 1;
  const H = short ? (f ? 328 : 298) : 372; // hem of the tunic
  const Y = y => (short ? Math.round(200 + ((y - 200) * (H - 200)) / 172) : y);
  const hwH = short ? (f ? 44 : 40.5) : hw; // half-width at the hem
  const my = f ? 262 : short ? 258 : 318; // hem of the outer garment (men), inner hem of the shawl (women)

  // Patterns in the garments' own colours: a twill weave, a zigzag trim and a diamond embroidery.
  const edge = accent || shade(mantle, 0.3);
  const patterns =
    `<defs>` +
    `<pattern id="wv${u}" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 4 L4 0 M-1 1 L1 -1 M3 5 L5 3" fill="none" stroke="#000" stroke-width=".7" opacity=".1"/></pattern>` +
    `<pattern id="zh${u}" y="${
      H - 18
    }" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M0 8 L6 2 L12 8" fill="none" stroke="${trim}" stroke-width="1.8" stroke-linejoin="round"/></pattern>` +
    `<pattern id="zz${u}" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M0 8 L6 2 L12 8" fill="none" stroke="${trim}" stroke-width="1.8" stroke-linejoin="round"/></pattern>` +
    `<pattern id="dm${u}" x="95.5" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M4.5 1 L8 4.5 L4.5 8 L1 4.5 Z" fill="none" stroke="${edge}" stroke-width="1.2"/><circle cx="4.5" cy="4.5" r="1" fill="${edge}"/></pattern>` +
    `</defs>`;
  const weave = d => P(d, `url(#wv${u})`);

  // ---- tunic: the long inner robe ----
  const tunicPath = f
    ? `M${100 - nw} 78 Q${100 - 20} 77 ${100 - sw} 90 L${100 - sw - 1} 126 Q${100 - sw - 2} 152 ${
        100 - ww - 2
      } 176 Q${100 - ww} 190 ${100 - ww - 1} 204 Q${100 - 33} 232 ${100 - 35} 262 Q${
        100 - hwH + (short ? -1 : 4)
      } ${short ? 298 : 320} ${100 - hwH} ${H} Q100 ${H + 10} ${100 + hwH} ${H} Q${
        100 + hwH + (short ? 1 : -4)
      } ${short ? 298 : 320} ${100 + 35} 262 Q${100 + 33} 232 ${100 + ww + 1} 204 Q${
        100 + ww
      } 190 ${100 + ww + 2} 176 Q${100 + sw + 2} 152 ${100 + sw + 1} 126 L${100 + sw} 90 Q${
        100 + 20
      } 77 ${100 + nw} 78 Z`
    : `M${100 - nw} 78 Q${100 - 24} 77 ${100 - sw} 90 L${100 - sw - 2} 140 Q${100 - sw + 2} 180 ${
        100 - sw + 4
      } 202 L${100 - hwH} ${H} Q100 ${H + 9} ${100 + hwH} ${H} L${100 + sw - 4} 202 Q${
        100 + sw - 2
      } 180 ${100 + sw + 2} 140 L${100 + sw} 90 Q${100 + 24} 77 ${100 + nw} 78 Z`;
  const folds = f
    ? S(
        `M${100 - 12} ${Y(252)} Q${100 - 17} ${Y(312)} ${100 - 24} ${H}`,
        INK,
        1.4,
        'opacity=".22"'
      ) +
      S(
        `M${100 + 6} ${Y(246)} Q${100 + 8} ${Y(312)} ${100 + 14} ${H + 2}`,
        INK,
        1.4,
        'opacity=".22"'
      ) +
      S(`M${100 - 31} ${Y(272)} Q${100 - 38} ${Y(322)} ${100 - 43} ${H}`, INK, 1.4, 'opacity=".16"')
    : S(
        `M${100 - 10} ${Y(226)} Q${100 - 14} ${Y(300)} ${100 - 18} ${H}`,
        INK,
        1.4,
        'opacity=".22"'
      ) +
      S(
        `M${100 + 4} ${Y(214)} Q${100 + 2} ${Y(300)} ${100 + 8} ${H + 4}`,
        INK,
        1.4,
        'opacity=".22"'
      ) +
      S(
        `M${100 - 32} ${Y(250)} Q${100 - 36} ${Y(310)} ${100 - 40} ${H}`,
        INK,
        1.4,
        'opacity=".16"'
      );
  let body =
    patterns +
    `<clipPath id="ct${u}"><path d="${tunicPath}"/></clipPath>` +
    PO(tunicPath, tunic) +
    `<g clip-path="url(#ct${u})">` +
    // the shaded side, the weave, the folds and a patterned hem
    P(`M108 76 Q102 220 112 392 L260 392 L260 70 Z`, tunicD) +
    weave("M0 0 H200 V400 H0 Z") +
    folds +
    P(`M0 ${H - 22} L200 ${H - 22} L200 400 L0 400 Z`, tunicDD) +
    P(`M0 ${H - 18} H200 V${H - 8} H0 Z`, `url(#zh${u})`) +
    S(`M0 ${H - 22} L200 ${H - 22}`, INK, 1.4, 'opacity=".5"') +
    S(`M0 ${H - 6} L200 ${H - 6}`, INK, 1, 'opacity=".3"') +
    // women: an embroidered placket down the front
    (f
      ? P(`M95.5 98 H104.5 V${by} H95.5 Z`, tunicDD) +
        P(`M95.5 98 H104.5 V${by} H95.5 Z`, `url(#dm${u})`) +
        S(`M95.5 98 V${by} M104.5 98 V${by}`, INK, 0.9, 'opacity=".5"')
      : "") +
    // sash
    P(`M0 ${by} L200 ${by} L200 ${by + bh} L0 ${by + bh} Z`, sash) +
    P(`M108 ${by} L200 ${by} L200 ${by + bh} L108 ${by + bh} Z`, "#000", 'opacity=".22"') +
    S(
      `M0 ${by + 3.5} L200 ${by + 3.5} M0 ${by + bh - 3.5} L200 ${by + bh - 3.5}`,
      "#fff",
      0.9,
      'opacity=".28"'
    ) +
    S(`M0 ${by} L200 ${by}`, INK, 1.4) +
    S(`M0 ${by + bh} L200 ${by + bh}`, INK, 1.4) +
    `</g>`;
  // neckline
  body += f
    ? PO(
        `M${100 - nw + 1} 78 Q100 104 ${100 + nw - 1} 78 Q100 86 ${100 - nw + 1} 78 Z`,
        skin,
        1.6
      ) + S(`M${100 - nw - 1} 80 Q100 108 ${100 + nw + 1} 80`, trim, 2.4)
    : PO(
        `M${100 - nw + 1} 78 L100 112 L${100 + nw - 1} 78 Q100 86 ${100 - nw + 1} 78 Z`,
        skin,
        1.6
      ) + S(`M${100 - nw - 1} 79 L100 114 L${100 + nw + 1} 79`, trim, 2.4);

  if (f && JEWELS[L.jewel][1] === "beads") {
    body += [...Array(9)]
      .map((_, i) => {
        const t = (i + 1) / 10;
        const x = 100 - nw - 1 + (2 * nw + 2) * t;
        const y = 80 + 56 * t * (1 - t) * 1.0;
        const c = i % 3 === 0 ? "#E2B24E" : i % 3 === 1 ? "#2D6E7E" : "#8E2A24";
        return `<circle cx="${x.toFixed(1)}" cy="${(y + 1).toFixed(
          1
        )}" r="2" fill="${c}" stroke="${INK}" stroke-width=".8"/>`;
      })
      .join("");
  }

  // ---- outer garment: a mantle (men) or a draped shawl (women), in two panels ----
  // oy / iy are where the outer and inner corners of a panel's hem hang.
  const panelFor = (oy, iy) =>
    `M${100 - 13} 80 Q${100 - 22} 80 ${100 - sw + 5} 92 L${100 - sw + 3} 150 Q${100 - sw + 2} ${
      oy - 70
    } ${100 - sw - 1} ${oy}` +
    // a shawl ends in a diagonal edge with a corner; a mantle has a softly rounded hem
    (f ? ` L${100 - 15} ${iy}` : ` Q${100 - 28} ${iy + 8} ${100 - 15} ${iy}`) +
    ` Q${100 - 12} ${iy - 80} ${100 - 12} 170 Z`;
  // Stripes on striped mantles, embroidery on embroidered shawls, a plain edge otherwise.
  const decorate = (d, key, oy, iy) => {
    const cid = `cp${key}${u}`;
    let o = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g clip-path="url(#${cid})">`;
    if (!f && accent) {
      [
        [8, 3.8],
        [15, 1.8],
        [22, 3.8]
      ].forEach(([off, w]) => {
        const x0 = 100 - sw + off;
        o += P(`M${x0} 84 L${x0 + w} 84 L${x0 + w - 5} ${oy + 12} L${x0 - 5} ${oy + 12} Z`, accent);
      });
    }
    if (f && accent) {
      o +=
        P(
          `M${100 - 27} 84 L${100 - 15} 84 L${100 - 17} ${iy + 10} L${100 - 29} ${iy + 10} Z`,
          `url(#dm${u})`
        ) +
        P(
          `M${100 - sw - 6} ${oy - 12} L${100 - 12} ${iy - 12} L${100 - 12} ${iy + 14} L${
            100 - sw - 6
          } ${oy + 14} Z`,
          `url(#dm${u})`
        );
    }
    if (f && !accent) {
      o += S(`M${100 - 14} 84 Q${100 - 13} 160 ${100 - 14} ${iy - 6}`, shade(mantle, 0.28), 2.2);
    }
    return o + `</g>`;
  };
  const leftD = panelFor(f ? 236 : my, f ? 262 : my);
  const rightD = panelFor(f ? 262 : my, f ? 298 : my);
  const cloakFold = `M${100 - sw + 6} 200 Q${100 - 34} ${my - 40} ${100 - sw} ${my - 8}`;
  const cloak =
    PO(leftD, mantle) +
    weave(leftD) +
    decorate(leftD, "l", f ? 236 : my, f ? 262 : my) +
    mirror(
      PO(rightD, mantleD) +
        weave(rightD) +
        decorate(rightD, "r", f ? 262 : my, f ? 298 : my) +
        `<path d="${rightD}" fill="#000" opacity=".1"/>`
    ) +
    S(cloakFold, INK, 1.4, 'opacity=".25"') +
    mirror(S(cloakFold, INK, 1.4, 'opacity=".25"'));

  // ---- arms and hands ----
  // Women's arms are the same shape, slimmer, scaled across their own centre line.
  const armX = 100 - sw - 1;
  const arm = fill =>
    `<g${f ? ` transform="translate(${armX} 0) scale(.78 1) translate(${-armX} 0)"` : ""}>` +
    PO(
      `M${100 - sw + 8} 84 Q${100 - sw - 8} 84 ${100 - sw - 9} 104 L${100 - sw - 11} 150 Q${
        100 - sw - 12
      } 182 ${100 - sw - 8} 200 L${100 - sw + 5} 200 Q${100 - sw + 6} 180 ${100 - sw + 6} 150 Q${
        100 - sw + 8
      } 118 ${100 - sw + 10} 100 Z`,
      fill
    ) +
    P(
      `M${100 - sw - 9} 190 L${100 - sw + 5} 190 L${100 - sw + 5} 200 L${100 - sw - 9} 200 Z`,
      tunicDD
    ) +
    P(
      `M${100 - sw - 9} 190 L${100 - sw + 5} 190 L${100 - sw + 5} 200 L${100 - sw - 9} 200 Z`,
      `url(#zz${u})`
    ) +
    S(`M${100 - sw - 9} 190 L${100 - sw + 5} 190`, INK, 1.2) +
    `<ellipse cx="${
      100 - sw - 1
    }" cy="209" rx="6.4" ry="8" fill="${skin}" stroke="${INK}" stroke-width="1.8"/>` +
    `</g>`;
  // Poses lift an arm (or both) about the shoulder: a wave, or the arms thrown up when cheering or dancing.
  const lift = (a, svg) => (a ? `<g transform="rotate(${a} ${100 - sw + 6} 88)">${svg}</g>` : svg);
  const [liftL, liftR] = POSES[opts.pose] || [0, 0];
  const arms = lift(liftL, arm(tunic)) + mirror(lift(liftR, arm(tunicD)));

  // ---- feet and sandals ----
  const foot =
    `<path d="M80 384 Q72 386 70 393 Q80 398 92 395 L95 384 Z" fill="${skin}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
    S("M70 395 Q82 400 95 396", "#6B4A2A", 3.4) +
    S("M80 386 L89 393 M88 385 L90 393", "#6B4A2A", 1.4);
  const mid = Math.round((H + 368) / 2);
  const leg =
    `<path d="M77 ${H - 8} Q75 ${mid} 80 368 L92 368 Q95 ${mid} 93 ${H - 8} Z" fill="${skin}"/>` +
    `<path d="M87 ${H - 8} Q92 ${mid} 92 368 L87 368 Z" fill="${skinD}" opacity=".55"/>` +
    S("M79 366 L93 371 M93 366 L79 371", "#6B4A2A", 1.3);
  const legs = short ? leg + mirror(leg) : "";
  const feet =
    legs +
    `<rect x="80" y="364" width="12" height="24" fill="${skin}"/><rect x="108" y="364" width="12" height="24" fill="${skin}"/>` +
    foot +
    mirror(foot);

  // ---- held items ----
  // The right hand is at (hx, hy). Items the hand wraps around are drawn behind the arm; the rest go on top of it.
  const hx = 100 + sw + 1;
  const hy = 209;
  const wood = "#8A5E34";
  const line = (d, color, w) => S(d, INK, w + 2.4) + S(d, color, w);
  let itemBack = "";
  let itemFront = "";
  if (item === "staff") {
    const hook = `M${hx} 48 Q${hx} 28 ${hx + 14} 30 Q${hx + 21} 34 ${hx + 17} 44`;
    itemBack = line(`M${hx} 392 L${hx} 48`, wood, 3.4) + line(hook, wood, 3.4);
  }
  if (item === "sword") {
    // held upright in the hand and tilted outward, so the blade clears the arm
    itemFront =
      `<g transform="rotate(14 ${hx} ${hy})">` +
      PO(
        `M${hx - 2.8} 104 L${hx - 2.8} 196 L${hx + 2.8} 196 L${hx + 2.8} 104 L${hx} 92 Z`,
        "#D8DEE4",
        1.6
      ) +
      S(`M${hx} 106 L${hx} 192`, "#9AA3AB", 1) +
      PO(`M${hx - 10} 196 L${hx + 10} 196 L${hx + 10} 201.5 L${hx - 10} 201.5 Z`, "#C9A04B", 1.6) +
      PO(
        `M${hx - 2.4} 201.5 L${hx + 2.4} 201.5 L${hx + 2.4} 222 L${hx - 2.4} 222 Z`,
        "#5B3A21",
        1.4
      ) +
      `<circle cx="${hx}" cy="225" r="3.8" fill="#C9A04B" stroke="${INK}" stroke-width="1.4"/>` +
      `</g>`;
  }
  if (item === "scroll") {
    itemFront =
      `<g transform="rotate(-16 ${hx} ${hy - 4})">` +
      PO(
        `M${hx - 7} ${hy - 20} L${hx + 7} ${hy - 20} L${hx + 7} ${hy + 6} L${hx - 7} ${hy + 6} Z`,
        "#E9DAB6",
        1.6
      ) +
      PO(
        `M${hx - 8.5} ${hy - 21} L${hx + 8.5} ${hy - 21} L${hx + 8.5} ${hy - 17} L${hx - 8.5} ${
          hy - 17
        } Z`,
        "#C9B27A",
        1.4
      ) +
      PO(
        `M${hx - 8.5} ${hy + 2} L${hx + 8.5} ${hy + 2} L${hx + 8.5} ${hy + 6} L${hx - 8.5} ${
          hy + 6
        } Z`,
        "#C9B27A",
        1.4
      ) +
      S(
        `M${hx - 4} ${hy - 12} L${hx + 4} ${hy - 12} M${hx - 4} ${hy - 8} L${hx + 4} ${hy - 8} M${
          hx - 4
        } ${hy - 4} L${hx + 2} ${hy - 4}`,
        "#9C7A45",
        1
      ) +
      `</g>`;
  }
  if (item === "sling") {
    itemFront =
      line(`M${hx} ${hy + 4} Q${hx + 8} ${hy + 30} ${hx + 3} ${hy + 52}`, "#6B4A2A", 1.8) +
      `<circle cx="${hx + 3}" cy="${
        hy + 55
      }" r="4.6" fill="#8F8F8F" stroke="${INK}" stroke-width="1.5"/>`;
  }
  if (item === "shofar") {
    itemFront =
      PO(
        `M${hx - 7} ${hy - 2} Q${hx + 14} ${hy - 6} ${hx + 19} ${hy - 32} Q${hx + 21} ${hy - 38} ${
          hx + 27
        } ${hy - 36} Q${hx + 25} ${hy - 4} ${hx - 7} ${hy + 8} Z`,
        "#E1CC9C",
        1.8
      ) + S(`M${hx - 3} ${hy} Q${hx + 14} ${hy - 6} ${hx + 20} ${hy - 30}`, "#B79F68", 1.2);
  }
  if (item === "lamp") {
    const fx = hx + 12;
    itemFront =
      `<circle cx="${fx}" cy="${hy - 14}" r="17" fill="#FFB52E" opacity=".18"/>` +
      PO(
        `M${hx - 10} ${hy - 1} Q${hx + 2} ${hy - 6} ${hx + 14} ${hy - 1} Q${hx + 10} ${
          hy + 8
        } ${hx} ${hy + 8} Q${hx - 8} ${hy + 8} ${hx - 10} ${hy - 1} Z`,
        "#B87333",
        1.6
      ) +
      S(`M${hx - 10} ${hy - 1} Q${hx - 16} ${hy - 1} ${hx - 14} ${hy + 5}`, INK, 1.6) +
      `<path class="flame" d="M${fx} ${hy - 4} Q${fx - 5} ${hy - 13} ${fx} ${hy - 24} Q${fx + 5} ${
        hy - 13
      } ${fx} ${hy - 4} Z" fill="#FFB52E" stroke="${INK}" stroke-width="1.2"/>` +
      `<path d="M${fx} ${hy - 6} Q${fx - 2} ${hy - 12} ${fx} ${hy - 17} Q${fx + 2} ${
        hy - 12
      } ${fx} ${hy - 6} Z" fill="#FFE49A"/>`;
  }
  if (item === "shield") {
    const cx = 100 - sw - 7;
    const cy = 192;
    itemFront =
      PO(
        `M${cx - 17} ${cy - 26} Q${cx} ${cy - 32} ${cx + 17} ${cy - 26} L${cx + 16} ${cy + 6} Q${
          cx + 13
        } ${cy + 26} ${cx} ${cy + 34} Q${cx - 13} ${cy + 26} ${cx - 16} ${cy + 6} Z`,
        "#B8892B",
        2
      ) +
      P(
        `M${cx + 1} ${cy - 29} Q${cx + 9} ${cy - 30} ${cx + 17} ${cy - 26} L${cx + 16} ${cy + 6} Q${
          cx + 13
        } ${cy + 26} ${cx} ${cy + 34} Z`,
        "#8F6A1E"
      ) +
      `<rect x="${cx - 2.2}" y="${
        cy - 22
      }" width="4.4" height="46" fill="#F1E7CC" stroke="${INK}" stroke-width="1"/>` +
      `<rect x="${cx - 12}" y="${
        cy - 8
      }" width="24" height="4.4" fill="#F1E7CC" stroke="${INK}" stroke-width="1"/>`;
  }
  if (item === "harp") {
    // a kinnor: two arms, a crossbar, a sound box in the hand and four strings
    const lx = hx + 6;
    const top = hy - 46;
    const bot = hy - 2;
    itemFront =
      `<g transform="rotate(-8 ${hx} ${hy})">` +
      line(`M${lx - 14} ${top} Q${lx - 19} ${hy - 12} ${lx - 7} ${bot}`, wood, 3.4) +
      line(`M${lx + 14} ${top} Q${lx + 19} ${hy - 12} ${lx + 7} ${bot}`, wood, 3.4) +
      [-8, -3, 3, 8]
        .map(o => S(`M${lx + o} ${top + 3} L${lx + o * 0.7} ${hy - 8}`, "#EADFB4", 1))
        .join("") +
      line(`M${lx - 17} ${top} L${lx + 17} ${top}`, wood, 3.4) +
      PO(
        `M${lx - 10} ${hy - 10} Q${lx - 10} ${bot + 3} ${lx} ${bot + 3} Q${lx + 10} ${bot + 3} ${
          lx + 10
        } ${hy - 10} Z`,
        "#A8743C",
        1.6
      ) +
      `</g>`;
  }
  if (item === "hammer") {
    itemFront =
      `<g transform="rotate(10 ${hx} ${hy})">` +
      PO(
        `M${hx - 2.4} ${hy - 34} L${hx + 2.4} ${hy - 34} L${hx + 2.4} ${hy + 16} L${hx - 2.4} ${
          hy + 16
        } Z`,
        wood,
        1.4
      ) +
      PO(
        `M${hx - 14} ${hy - 47} L${hx + 10} ${hy - 47} Q${hx + 14} ${hy - 40} ${hx + 10} ${
          hy - 33
        } L${hx - 14} ${hy - 33} Z`,
        "#8F9AA3",
        1.8
      ) +
      P(
        `M${hx - 14} ${hy - 47} L${hx - 6} ${hy - 47} L${hx - 6} ${hy - 33} L${hx - 14} ${
          hy - 33
        } Z`,
        "#6F7A83"
      ) +
      S(`M${hx - 3} ${hy - 44} L${hx + 8} ${hy - 44}`, "#D8DEE4", 1.2) +
      `</g>`;
  }
  if (item === "spear") {
    const blade = `M${hx} 10 Q${hx + 9} 30 ${hx + 2.6} 52 L${hx - 2.6} 52 Q${hx - 9} 30 ${hx} 10 Z`;
    itemBack =
      line(`M${hx} 392 L${hx} 50`, wood, 3.4) +
      PO(
        `M${hx + 1.5} 57 Q${hx + 14} 52 ${hx + 23} 60 Q${hx + 14} 66 ${hx + 1.5} 72 Z`,
        "#9A2A22",
        1.4
      ) +
      PO(blade, "#D8DEE4", 1.8) +
      S(`M${hx} 16 L${hx} 50`, "#9AA3AB", 1) +
      PO(`M${hx - 4} 51 L${hx + 4} 51 L${hx + 4} 56 L${hx - 4} 56 Z`, "#C9A04B", 1.4);
  }
  if (item === "net") {
    // a cast net with floats along the hem, hung from the hand
    itemFront =
      `<defs><pattern id="nt${u}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H7 M0 0 V7" fill="none" stroke="#6E5A36" stroke-width="1"/></pattern></defs>` +
      PO(
        `M${hx - 3} ${hy + 2} L${hx - 17} ${hy + 50} Q${hx} ${hy + 58} ${hx + 17} ${hy + 50} L${
          hx + 3
        } ${hy + 2} Z`,
        "#D9C9A0",
        1.6
      ) +
      P(
        `M${hx - 3} ${hy + 2} L${hx - 17} ${hy + 50} Q${hx} ${hy + 58} ${hx + 17} ${hy + 50} L${
          hx + 3
        } ${hy + 2} Z`,
        `url(#nt${u})`
      ) +
      [-14, -5, 5, 14]
        .map(
          o =>
            `<circle cx="${hx + o}" cy="${
              hy + 52 - Math.abs(o) * 0.1
            }" r="2.4" fill="#C9A04B" stroke="${INK}" stroke-width="1"/>`
        )
        .join("");
  }
  if (item === "cloth") {
    // a roll of woven goat-hair cloth, for a tentmaker
    itemFront =
      PO(
        `M${hx - 12} ${hy - 22} L${hx + 12} ${hy - 22} L${hx + 12} ${hy + 6} L${hx - 12} ${
          hy + 6
        } Z`,
        "#4A3A2E",
        1.6
      ) +
      S(
        `M${hx - 6} ${hy - 20} V${hy + 4} M${hx} ${hy - 20} V${hy + 4} M${hx + 6} ${hy - 20} V${
          hy + 4
        }`,
        "#8B7355",
        1.2
      ) +
      PO(
        `M${hx - 12} ${hy - 22} Q${hx} ${hy - 28} ${hx + 12} ${hy - 22} Q${hx} ${hy - 17} ${
          hx - 12
        } ${hy - 22} Z`,
        "#6B5640",
        1.4
      ) +
      S(`M${hx + 8} ${hy - 22} L${hx + 17} ${hy - 38}`, "#E9DAB6", 1.6);
  }
  if (item === "saw") {
    const blade = `M${hx - 4} ${hy - 10} L${hx + 10} ${hy - 10} L${hx + 6} ${hy - 56} L${hx - 4} ${
      hy - 56
    } Z`;
    const teeth = [...Array(9)]
      .map(
        (_, i) =>
          `L${hx + 10 - i * 0.45 - 2} ${hy - 12 - i * 5} L${hx + 10 - i * 0.45 + 1.5} ${
            hy - 15 - i * 5
          }`
      )
      .join(" ");
    itemFront =
      `<g transform="rotate(12 ${hx} ${hy})">` +
      PO(blade, "#B8C0C8", 1.6) +
      S(`M${hx + 10} ${hy - 10} ${teeth}`, INK, 1.1) +
      PO(
        `M${hx - 5} ${hy - 10} L${hx + 11} ${hy - 10} L${hx + 10} ${hy + 12} L${hx - 4} ${
          hy + 12
        } Z`,
        wood,
        1.6
      ) +
      `<ellipse cx="${hx + 3}" cy="${
        hy + 1
      }" rx="3" ry="4.4" fill="${skin}" stroke="${INK}" stroke-width="1"/>` +
      `</g>`;
  }
  if (item === "sickle") {
    itemFront =
      `<g transform="rotate(12 ${hx} ${hy})">` +
      PO(
        `M${hx - 2.4} ${hy - 16} L${hx + 2.4} ${hy - 16} L${hx + 2.4} ${hy + 14} L${hx - 2.4} ${
          hy + 14
        } Z`,
        wood,
        1.4
      ) +
      PO(
        `M${hx - 1} ${hy - 16} Q${hx + 3} ${hy - 46} ${hx + 28} ${hy - 46} Q${hx + 13} ${hy - 38} ${
          hx + 9
        } ${hy - 16} Z`,
        "#B8C0C8",
        1.6
      ) +
      `</g>`;
  }
  if (item === "purse") {
    itemFront =
      S(`M${hx} ${hy} L${hx + 1} ${hy + 8}`, "#5B3A21", 1.6) +
      PO(
        `M${hx - 5} ${hy + 6} Q${hx - 16} ${hy + 20} ${hx - 10} ${hy + 31} Q${hx} ${hy + 37} ${
          hx + 12
        } ${hy + 31} Q${hx + 17} ${hy + 20} ${hx + 7} ${hy + 6} Z`,
        "#8A5E34",
        1.8
      ) +
      PO(
        `M${hx - 6} ${hy + 6} L${hx + 8} ${hy + 6} L${hx + 8} ${hy + 10} L${hx - 6} ${hy + 10} Z`,
        "#C9A04B",
        1.4
      ) +
      `<circle cx="${hx + 1}" cy="${
        hy + 22
      }" r="5" fill="#E2B24E" stroke="${INK}" stroke-width="1.2"/>` +
      S(`M${hx + 1} ${hy + 19.5} V${hy + 24.5}`, "#9C7A45", 1);
  }
  if (item === "censer") {
    itemFront =
      S(`M${hx} ${hy} L${hx + 2} ${hy + 30}`, INK, 2.8) +
      S(`M${hx} ${hy} L${hx + 2} ${hy + 30}`, "#C9A04B", 1.2) +
      S(
        `M${hx + 2} ${hy + 27} Q${hx - 5} ${hy + 18} ${hx + 2} ${hy + 10} Q${hx + 8} ${hy + 3} ${
          hx + 3
        } ${hy - 6}`,
        "#DDD6C8",
        2.2,
        'opacity=".55"'
      ) +
      PO(
        `M${hx - 8} ${hy + 34} Q${hx - 8} ${hy + 48} ${hx + 2} ${hy + 48} Q${hx + 12} ${hy + 48} ${
          hx + 12
        } ${hy + 34} Z`,
        "#C9A04B",
        1.8
      ) +
      PO(`M${hx - 6} ${hy + 34} Q${hx + 2} ${hy + 25} ${hx + 10} ${hy + 34} Z`, "#E2B24E", 1.6);
  }
  if (item === "timbrel") {
    const cx = hx + 4;
    const cy = hy - 20;
    itemFront =
      `<circle cx="${cx}" cy="${cy}" r="16" fill="#E9DAB6" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="${wood}" stroke-width="3.6"/>` +
      `<circle cx="${cx}" cy="${cy}" r="8.5" fill="none" stroke="#B79F68" stroke-width="1" stroke-dasharray="2 2"/>` +
      [0, 90, 180, 270]
        .map(a => {
          const r = (a * Math.PI) / 180;
          return `<circle cx="${(cx + 14 * Math.cos(r)).toFixed(1)}" cy="${(
            cy +
            14 * Math.sin(r)
          ).toFixed(1)}" r="2.3" fill="#E2B24E" stroke="${INK}" stroke-width="1"/>`;
        })
        .join("");
  }
  if (item === "infant") {
    itemFront =
      `<g transform="rotate(-12 ${hx} ${hy})">` +
      PO(
        `M${hx - 11} ${hy} Q${hx - 17} ${hy - 18} ${hx - 5} ${hy - 30} Q${hx + 9} ${hy - 33} ${
          hx + 14
        } ${hy - 18} Q${hx + 17} ${hy - 2} ${hx + 5} ${hy + 6} Z`,
        "#EDE4CE",
        1.8
      ) +
      S(
        `M${hx - 14} ${hy - 12} Q${hx} ${hy - 8} ${hx + 16} ${hy - 14} M${hx - 12} ${hy - 4} Q${
          hx + 2
        } ${hy} ${hx + 12} ${hy - 4}`,
        "#C9B58A",
        1.4
      ) +
      `<circle cx="${hx}" cy="${
        hy - 26
      }" r="6.6" fill="${skin}" stroke="${INK}" stroke-width="1.6"/>` +
      S(`M${hx - 3.4} ${hy - 26} h2.2 M${hx + 1.2} ${hy - 26} h2.2`, INK, 0.9) +
      `</g>`;
  }
  if (item === "basin") {
    itemFront =
      PO(
        `M${hx - 12} ${hy - 6} L${hx - 19} ${hy + 22} L${hx - 9} ${hy + 20} L${hx - 4} ${hy - 4} Z`,
        "#EDE4CE",
        1.4
      ) +
      PO(
        `M${hx - 17} ${hy - 6} Q${hx - 15} ${hy + 10} ${hx + 2} ${hy + 10} Q${hx + 19} ${hy + 10} ${
          hx + 21
        } ${hy - 6} Z`,
        "#A8743C",
        1.8
      ) +
      `<ellipse cx="${hx + 2}" cy="${
        hy - 6
      }" rx="19" ry="4.4" fill="#7FB3C8" stroke="${INK}" stroke-width="1.6"/>` +
      S(`M${hx - 8} ${hy - 6} Q${hx + 2} ${hy - 4} ${hx + 8} ${hy - 7}`, "#D6EBF3", 1);
  }
  if (item === "jar") {
    const cx = hx + 3;
    itemFront =
      line(`M${cx - 6} ${hy - 33} Q${cx - 18} ${hy - 34} ${cx - 14} ${hy - 22}`, "#B5683A", 2.2) +
      line(`M${cx + 6} ${hy - 33} Q${cx + 18} ${hy - 34} ${cx + 14} ${hy - 22}`, "#B5683A", 2.2) +
      PO(
        `M${cx - 6} ${hy - 26} Q${cx - 19} ${hy - 18} ${cx - 15} ${hy - 2} Q${cx - 11} ${
          hy + 10
        } ${cx} ${hy + 10} Q${cx + 11} ${hy + 10} ${cx + 15} ${hy - 2} Q${cx + 19} ${hy - 18} ${
          cx + 6
        } ${hy - 26} Z`,
        "#B5683A",
        1.8
      ) +
      S(`M${cx - 16} ${hy - 12} Q${cx} ${hy - 8} ${cx + 16} ${hy - 12}`, "#8E4A28", 1.6) +
      PO(
        `M${cx - 6} ${hy - 26} L${cx - 5} ${hy - 35} L${cx + 5} ${hy - 35} L${cx + 6} ${hy - 26} Z`,
        "#B5683A",
        1.6
      ) +
      PO(
        `M${cx - 8} ${hy - 39} L${cx + 8} ${hy - 39} L${cx + 8} ${hy - 34} L${cx - 8} ${hy - 34} Z`,
        "#8E4A28",
        1.4
      );
  }
  if (item === "scales") {
    const cx = hx + 8;
    const top = hy - 40;
    itemFront =
      line(`M${cx} ${hy - 2} L${cx} ${top}`, "#C9A04B", 1.6) +
      line(`M${cx - 20} ${top + 4} L${cx + 20} ${top + 4}`, "#C9A04B", 1.6) +
      S(
        `M${cx - 20} ${top + 4} L${cx - 27} ${hy - 20} M${cx - 20} ${top + 4} L${cx - 13} ${
          hy - 20
        } M${cx + 20} ${top + 4} L${cx + 13} ${hy - 20} M${cx + 20} ${top + 4} L${cx + 27} ${
          hy - 20
        }`,
        INK,
        1
      ) +
      PO(`M${cx - 29} ${hy - 20} Q${cx - 20} ${hy - 11} ${cx - 11} ${hy - 20} Z`, "#C9A04B", 1.5) +
      PO(`M${cx + 11} ${hy - 20} Q${cx + 20} ${hy - 11} ${cx + 29} ${hy - 20} Z`, "#C9A04B", 1.5) +
      `<circle cx="${cx}" cy="${top}" r="2.6" fill="#E2B24E" stroke="${INK}" stroke-width="1"/>`;
  }
  if (item === "spindle") {
    itemFront =
      line(`M${hx - 2} ${hy + 4} L${hx + 4} ${hy - 36}`, wood, 2) +
      `<ellipse cx="${hx}" cy="${
        hy - 8
      }" rx="6.4" ry="2.6" fill="#8A5E34" stroke="${INK}" stroke-width="1.2"/>` +
      `<circle cx="${hx + 4.6}" cy="${
        hy - 40
      }" r="7.4" fill="#EDE4CE" stroke="${INK}" stroke-width="1.5"/>` +
      S(
        `M${hx - 0.6} ${hy - 42} Q${hx + 4.6} ${hy - 36} ${hx + 10} ${hy - 42} M${hx + 0.4} ${
          hy - 38
        } Q${hx + 4.6} ${hy - 34} ${hx + 9} ${hy - 38}`,
        "#C9B58A",
        1
      ) +
      S(`M${hx + 3} ${hy - 31} Q${hx + 12} ${hy - 14} ${hx + 9} ${hy + 8}`, "#EDE4CE", 0.9);
  }
  if (item === "sheaf") {
    itemFront =
      `<g transform="rotate(10 ${hx} ${hy})">` +
      [-12, -6, 0, 6, 12]
        .map(
          dx =>
            S(`M${hx + dx / 3} ${hy - 8} L${hx + dx} ${hy - 40}`, "#D8B04A", 2) +
            S(`M${hx + dx / 3} ${hy - 8} L${hx + dx / 2} ${hy + 14}`, "#D8B04A", 2)
        )
        .join("") +
      [-12, -6, 0, 6, 12]
        .map(
          dx =>
            `<ellipse cx="${hx + dx}" cy="${
              hy - 44
            }" rx="3" ry="7" fill="#E2B24E" stroke="${INK}" stroke-width=".9" transform="rotate(${
              dx * 2
            } ${hx + dx} ${hy - 44})"/>`
        )
        .join("") +
      PO(
        `M${hx - 6} ${hy - 12} L${hx + 6} ${hy - 12} L${hx + 6} ${hy - 6} L${hx - 6} ${hy - 6} Z`,
        wood,
        1.2
      ) +
      `</g>`;
  }
  if (item === "star") {
    const cx = hx + 2;
    const cy = hy - 46;
    const pts = [...Array(10)]
      .map((_, i) => {
        const a = ((-90 + i * 36) * Math.PI) / 180;
        const r = i % 2 ? 4.8 : 12;
        return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
      })
      .join(" L");
    itemFront =
      line(`M${hx} ${hy + 16} L${cx} ${cy + 8}`, wood, 2.2) +
      `<circle cx="${cx}" cy="${cy}" r="17" fill="#FFE49A" opacity=".22"/>` +
      PO(`M${pts} Z`, "#F2D58C", 1.6);
  }
  if (item === "square") {
    itemFront =
      `<g transform="rotate(-8 ${hx} ${hy})">` +
      PO(
        `M${hx - 4} ${hy - 42} L${hx + 2.4} ${hy - 42} L${hx + 2.4} ${hy - 6} L${hx + 24} ${
          hy - 6
        } L${hx + 24} ${hy} L${hx - 4} ${hy} Z`,
        "#B98A4B",
        1.6
      ) +
      S(
        `M${hx - 4} ${hy - 34} h3 M${hx - 4} ${hy - 26} h3 M${hx - 4} ${hy - 18} h3 M${
          hx + 6
        } ${hy} v-3 M${hx + 14} ${hy} v-3`,
        INK,
        1
      ) +
      `</g>`;
  }
  if (item === "dove") {
    const cx = hx + 2;
    const cy = hy - 12;
    itemFront =
      PO(`M${cx - 20} ${cy - 2} L${cx - 9} ${cy - 5} L${cx - 9} ${cy + 3} Z`, "#E8E2D6", 1.3) +
      `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="7" fill="#F6F2EA" stroke="${INK}" stroke-width="1.6"/>` +
      `<circle cx="${cx + 10}" cy="${
        cy - 8
      }" r="4.8" fill="#F6F2EA" stroke="${INK}" stroke-width="1.5"/>` +
      PO(
        `M${cx + 14.4} ${cy - 9} L${cx + 19} ${cy - 7.6} L${cx + 14.4} ${cy - 6.4} Z`,
        "#E39A3A",
        1
      ) +
      `<circle cx="${cx + 11}" cy="${cy - 9}" r="1" fill="${INK}"/>` +
      S(`M${cx - 6} ${cy - 3} Q${cx - 1} ${cy - 14} ${cx + 6} ${cy - 5}`, "#C9C2B4", 1.6) +
      S(`M${cx - 2} ${cy + 7} v3 M${cx + 3} ${cy + 7} v3`, "#E39A3A", 1.2);
  }
  if (item === "stone") {
    itemFront =
      PO(
        `M${hx - 11} ${hy - 4} Q${hx - 13} ${hy - 14} ${hx - 5} ${hy - 19} Q${hx + 4} ${hy - 24} ${
          hx + 11
        } ${hy - 16} Q${hx + 15} ${hy - 8} ${hx + 9} ${hy - 3} Q${hx} ${hy} ${hx - 11} ${hy - 4} Z`,
        "#9A948A",
        1.8
      ) +
      P(
        `M${hx - 5} ${hy - 19} Q${hx + 4} ${hy - 24} ${hx + 11} ${hy - 16} Q${hx + 3} ${hy - 15} ${
          hx - 5
        } ${hy - 19} Z`,
        "#B7B1A6"
      ) +
      S(`M${hx - 2} ${hy - 12} l4 3 l-2 4`, INK, 1, 'opacity=".5"');
  }
  if (item === "cup") {
    itemFront =
      PO(
        `M${hx - 10} ${hy - 26} L${hx + 10} ${hy - 26} Q${hx + 10} ${hy - 10} ${hx} ${hy - 8} Q${
          hx - 10
        } ${hy - 10} ${hx - 10} ${hy - 26} Z`,
        "#C9A04B",
        1.8
      ) +
      `<ellipse cx="${hx}" cy="${
        hy - 26
      }" rx="10" ry="3" fill="#8E1F2D" stroke="${INK}" stroke-width="1.4"/>` +
      PO(
        `M${hx - 2} ${hy - 9} L${hx + 2} ${hy - 9} L${hx + 2} ${hy - 2} L${hx - 2} ${hy - 2} Z`,
        "#B8892B",
        1.2
      ) +
      PO(
        `M${hx - 7} ${hy - 3} L${hx + 7} ${hy - 3} L${hx + 5} ${hy + 1} L${hx - 5} ${hy + 1} Z`,
        "#C9A04B",
        1.4
      );
  }
  if (item === "fish") {
    itemFront =
      `<g transform="rotate(8 ${hx} ${hy})">` +
      PO(`M${hx} ${hy + 2} L${hx - 7} ${hy + 14} L${hx + 7} ${hy + 14} Z`, "#7FA2B8", 1.4) +
      `<ellipse cx="${hx}" cy="${
        hy + 30
      }" rx="8" ry="17" fill="#9DBFD3" stroke="${INK}" stroke-width="1.6"/>` +
      P(
        `M${hx - 7} ${hy + 34} Q${hx} ${hy + 46} ${hx + 7} ${hy + 34} Q${hx} ${hy + 41} ${hx - 7} ${
          hy + 34
        } Z`,
        "#E9F2F6"
      ) +
      S(`M${hx - 6} ${hy + 22} q6 3 12 0 M${hx - 7} ${hy + 28} q7 3 14 0`, "#6C90A6", 1) +
      `<circle cx="${hx + 3}" cy="${hy + 40}" r="1.6" fill="${INK}"/>` +
      `</g>`;
  }
  if (item === "oar") {
    itemBack =
      line(`M${hx} 392 L${hx} 70`, wood, 3.2) +
      PO(
        `M${hx - 6.5} 36 Q${hx - 9} 58 ${hx - 4} 84 L${hx + 4} 84 Q${hx + 9} 58 ${
          hx + 6.5
        } 36 Q${hx} 30 ${hx - 6.5} 36 Z`,
        "#C69A5B",
        1.8
      ) +
      S(`M${hx} 40 L${hx} 80`, "#A67A3E", 1);
  }
  if (item === "loaves") {
    itemFront =
      [-8, 0, 8]
        .map(
          o =>
            `<ellipse cx="${hx + o}" cy="${
              hy - 15 - (o === 0 ? 3 : 0)
            }" rx="6.4" ry="4.6" fill="#D9A25A" stroke="${INK}" stroke-width="1.3"/>`
        )
        .join("") +
      PO(
        `M${hx - 16} ${hy - 12} L${hx + 16} ${hy - 12} L${hx + 12} ${hy + 8} L${hx - 12} ${
          hy + 8
        } Z`,
        "#B98A4B",
        1.8
      ) +
      S(
        `M${hx - 14} ${hy - 6} H${hx + 14} M${hx - 13} ${hy} H${hx + 13} M${hx - 6} ${hy - 12} V${
          hy + 8
        } M${hx + 6} ${hy - 12} V${hy + 8}`,
        "#8A6230",
        1
      );
  }
  if (item === "keys") {
    const key = a =>
      `<g transform="rotate(${a} ${hx} ${hy + 8})">` +
      S(`M${hx} ${hy + 18} V${hy + 42}`, "#C9A04B", 2.2) +
      PO(`M${hx} ${hy + 34} h6 v3 h-6 M${hx} ${hy + 40} h5 v3 h-5`, "#C9A04B", 1) +
      `<circle cx="${hx}" cy="${
        hy + 14
      }" r="4.4" fill="none" stroke="#C9A04B" stroke-width="2.2"/>` +
      `</g>`;
    itemFront =
      `<circle cx="${hx}" cy="${hy + 6}" r="5" fill="none" stroke="#8F7430" stroke-width="2"/>` +
      key(-14) +
      key(14);
  }
  if (item === "bucket") {
    itemFront =
      S(`M${hx} ${hy} L${hx} ${hy + 8}`, "#C9B27A", 1.8) +
      S(`M${hx - 11} ${hy + 10} Q${hx} ${hy - 6} ${hx + 11} ${hy + 10}`, "#C9B27A", 1.8) +
      PO(
        `M${hx - 11} ${hy + 10} L${hx + 11} ${hy + 10} L${hx + 8} ${hy + 30} L${hx - 8} ${
          hy + 30
        } Z`,
        "#8A5E34",
        1.8
      ) +
      S(`M${hx - 10} ${hy + 16} H${hx + 10} M${hx - 9} ${hy + 24} H${hx + 9}`, "#5B3A21", 1.2) +
      `<ellipse cx="${hx}" cy="${
        hy + 10
      }" rx="11" ry="2.8" fill="#7FB3C8" stroke="${INK}" stroke-width="1.3"/>`;
  }
  if (item === "sycamore") {
    const leaves = [
      [-9, -22, -30],
      [8, -30, 25],
      [-10, -38, -35],
      [9, -46, 30],
      [-6, -52, -20],
      [3, -60, 10]
    ];
    itemFront =
      line(`M${hx} ${hy + 6} Q${hx + 3} ${hy - 30} ${hx - 1} ${hy - 62}`, wood, 2.2) +
      leaves
        .map(
          ([dx, dy, r]) =>
            `<ellipse cx="${hx + dx}" cy="${
              hy + dy
            }" rx="7" ry="4.2" fill="#6E8A3E" stroke="${INK}" stroke-width="1.2" transform="rotate(${r} ${
              hx + dx
            } ${hy + dy})"/>`
        )
        .join("") +
      [
        [-3, -34],
        [5, -42]
      ]
        .map(
          ([dx, dy]) =>
            `<circle cx="${hx + dx}" cy="${
              hy + dy
            }" r="2.8" fill="#A86A4A" stroke="${INK}" stroke-width="1"/>`
        )
        .join("");
  }
  if (item === "alabaster") {
    itemFront =
      PO(
        `M${hx - 3.5} ${hy - 34} L${hx + 3.5} ${hy - 34} L${hx + 4} ${hy - 26} L${hx - 4} ${
          hy - 26
        } Z`,
        "#E9DFC9",
        1.4
      ) +
      PO(
        `M${hx - 4} ${hy - 26} Q${hx - 15} ${hy - 16} ${hx - 10} ${hy - 2} Q${hx - 6} ${
          hy + 2
        } ${hx} ${hy + 2} Q${hx + 6} ${hy + 2} ${hx + 10} ${hy - 2} Q${hx + 15} ${hy - 16} ${
          hx + 4
        } ${hy - 26} Z`,
        "#F3ECDC",
        1.8
      ) +
      S(`M${hx - 12} ${hy - 14} Q${hx} ${hy - 9} ${hx + 12} ${hy - 14}`, "#C9A04B", 1.6) +
      `<ellipse cx="${hx}" cy="${
        hy - 34
      }" rx="4.4" ry="1.8" fill="#C9A04B" stroke="${INK}" stroke-width="1"/>`;
  }
  if (item === "palm") {
    const at = t => ({
      x: (1 - t) * (1 - t) * hx + 2 * (1 - t) * t * (hx + 2) + t * t * (hx + 16),
      y: (1 - t) * (1 - t) * (hy + 6) + 2 * (1 - t) * t * (hy - 34) + t * t * (hy - 64)
    });
    const leaflets = [...Array(9)]
      .map((_, i) => {
        const p = at(0.28 + i * 0.09);
        const len = 14 - i * 0.8;
        return S(
          `M${p.x.toFixed(1)} ${p.y.toFixed(1)} l${-len} -5 M${p.x.toFixed(1)} ${p.y.toFixed(
            1
          )} l${len} -5`,
          "#5C8A3A",
          2.4
        );
      })
      .join("");
    itemFront =
      line(`M${hx} ${hy + 6} Q${hx + 2} ${hy - 34} ${hx + 16} ${hy - 64}`, "#7A5B2E", 2) + leaflets;
  }
  // tail of the sash, hanging in the opening of the mantle
  const tails =
    PO(`M101 ${by + 8} L112 ${by + 12} L118 ${by + 56} L107 ${by + 52} Z`, sash, 1.6) +
    PO(`M97 ${by + 8} L106 ${by + 10} L102 ${by + 58} L93 ${by + 52} Z`, sash, 1.6) +
    PO(
      `M92 ${by + 2} Q104 ${by - 2} 112 ${by + 4} L110 ${by + 16} Q101 ${by + 20} 94 ${by + 14} Z`,
      sash,
      1.6
    );

  const outline = `<filter id="ol${u}" x="-12%" y="-6%" width="124%" height="112%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.7" result="d"/><feFlood flood-color="${INK}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const neck =
    P(
      `M${100 - nw + 3} 54 L${100 - nw + 3} 84 Q100 92 ${100 + nw - 3} 84 L${100 + nw - 3} 54 Z`,
      skin
    ) +
    P(
      `M${100 - nw + 3} 60 Q100 74 ${100 + nw - 3} 60 L${100 + nw - 3} 70 Q100 84 ${
        100 - nw + 3
      } 70 Z`,
      skinD
    );
  const d = opts.live ? ` style="--d:${(-Math.random() * 4).toFixed(2)}s"` : "";
  return `<svg class="fb av${opts.live ? " live" : ""}${
    opts.cheer ? " cheer" : ""
  }" viewBox="${opts.vb || "0 0 200 400"}" aria-hidden="true"${d}>${defs}${outline}
    <ellipse cx="100" cy="395" rx="50" ry="5" fill="#000" opacity=".3"/>
    <g class="fb-body" filter="url(#ol${u})">
      <g transform="${HEAD}">${hairBack}${coverBack}</g>
      ${itemBack}${feet}${neck}${body}${cloak}${tails}${arms}${itemFront}
      <g class="fb-head"><g transform="${HEAD}">${head}</g></g>
    </g></svg>`;
}
