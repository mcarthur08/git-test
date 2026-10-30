// The full-body character (200 x 400): an outlined, cel-shaded storybook figure. The head comes from buildParts
// (the same face, hair, beard, headwear and jewelry as the portrait); the body is drawn here.
import { SKINS, UNLOCK, MANTLES, JEWELS } from "./data.js";
import { shade } from "./util.js";
import { buildParts } from "./portrait.js";

const INK = "#2B1B12";
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

  const sw = f ? 33 : 40; // shoulder half-width
  const nw = f ? 11 : 14; // neck half-width at the collar
  const hw = f ? 46 : 44; // hem half-width
  const ww = 26; // waist half-width (women)
  const by = f ? 182 : 176; // top of the sash
  const my = f ? 262 : 318; // hem of the outer garment

  // ---- tunic: the long inner robe ----
  const tunicPath = f
    ? `M${100 - nw} 78 Q${100 - 22} 77 ${100 - sw} 90 L${100 - sw - 1} 130 Q${100 - ww} 166 ${
        100 - ww
      } 192 Q${100 - ww - 2} 232 ${100 - hw} 372 Q100 381 ${100 + hw} 372 Q${100 + ww + 2} 232 ${
        100 + ww
      } 192 Q${100 + ww} 166 ${100 + sw + 1} 130 L${100 + sw} 90 Q${100 + 22} 77 ${100 + nw} 78 Z`
    : `M${100 - nw} 78 Q${100 - 24} 77 ${100 - sw} 90 L${100 - sw - 2} 140 Q${100 - sw + 2} 180 ${
        100 - sw + 4
      } 202 L${100 - hw} 372 Q100 381 ${100 + hw} 372 L${100 + sw - 4} 202 Q${100 + sw - 2} 180 ${
        100 + sw + 2
      } 140 L${100 + sw} 90 Q${100 + 24} 77 ${100 + nw} 78 Z`;
  let body =
    `<clipPath id="ct${u}"><path d="${tunicPath}"/></clipPath>` +
    PO(tunicPath, tunic) +
    `<g clip-path="url(#ct${u})">` +
    // shade side, folds, hem band
    P(`M108 76 Q102 220 112 392 L260 392 L260 70 Z`, tunicD) +
    S(`M${100 - 10} 226 Q${100 - 14} 300 ${100 - 18} 372`, INK, 1.4, 'opacity=".22"') +
    S(`M${100 + 4} 214 Q${100 + 2} 300 ${100 + 8} 376`, INK, 1.4, 'opacity=".22"') +
    S(`M${100 - 32} 250 Q${100 - 36} 310 ${100 - 40} 372`, INK, 1.4, 'opacity=".16"') +
    P("M0 350 L200 350 L200 400 L0 400 Z", tunicDD) +
    S("M0 350 L200 350", INK, 1.4, 'opacity=".5"') +
    S("M0 360 L200 360", trim, 2.2, 'stroke-dasharray="4 3"') +
    // sash
    P(`M0 ${by} L200 ${by} L200 ${by + 16} L0 ${by + 16} Z`, sash) +
    P(`M108 ${by} L200 ${by} L200 ${by + 16} L108 ${by + 16} Z`, "#000", 'opacity=".22"') +
    S(`M0 ${by} L200 ${by}`, INK, 1.4) +
    S(`M0 ${by + 16} L200 ${by + 16}`, INK, 1.4) +
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

  // ---- outer garment: a mantle (men) or shawl (women) hanging in two panels ----
  const panel = `M${100 - 13} 80 Q${100 - 24} 80 ${100 - sw + 6} 92 L${100 - sw + 4} 160 Q${
    100 - sw + 2
  } ${my - 70} ${100 - sw - 2} ${my} Q${100 - 30} ${my + 8} ${100 - 17} ${my} Q${100 - 14} ${
    my - 80
  } ${100 - 13} 170 Z`;
  let cloak = PO(panel, mantle) + mirror(PO(panel, mantleD));
  if (accent) {
    cloak +=
      S(`M${100 - sw + 14} 96 Q${100 - sw + 12} ${my - 100} ${100 - sw + 8} ${my - 6}`, accent, 3) +
      S(
        `M${100 - sw + 22} 96 Q${100 - sw + 20} ${my - 100} ${100 - sw + 17} ${my - 6}`,
        accent,
        1.4
      ) +
      mirror(
        S(
          `M${100 - sw + 14} 96 Q${100 - sw + 12} ${my - 100} ${100 - sw + 8} ${my - 6}`,
          accent,
          3,
          'opacity=".8"'
        ) +
          S(
            `M${100 - sw + 22} 96 Q${100 - sw + 20} ${my - 100} ${100 - sw + 17} ${my - 6}`,
            accent,
            1.4,
            'opacity=".8"'
          )
      );
  }
  cloak +=
    S(
      `M${100 - sw + 6} 200 Q${100 - 34} ${my - 40} ${100 - sw} ${my - 8}`,
      INK,
      1.4,
      'opacity=".25"'
    ) +
    mirror(
      S(
        `M${100 - sw + 6} 200 Q${100 - 34} ${my - 40} ${100 - sw} ${my - 8}`,
        INK,
        1.4,
        'opacity=".25"'
      )
    );

  // ---- arms and hands ----
  const arm = fill =>
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
      trim,
      'opacity=".85"'
    ) +
    S(`M${100 - sw - 9} 190 L${100 - sw + 5} 190`, INK, 1.2) +
    `<ellipse cx="${
      100 - sw - 1
    }" cy="209" rx="6.4" ry="8" fill="${skin}" stroke="${INK}" stroke-width="1.8"/>`;
  const arms = arm(tunic) + mirror(arm(tunicD));

  // ---- feet and sandals ----
  const foot =
    `<path d="M80 384 Q72 386 70 393 Q80 398 92 395 L95 384 Z" fill="${skin}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
    S("M70 395 Q82 400 95 396", "#6B4A2A", 3.4) +
    S("M80 386 L89 393 M88 385 L90 393", "#6B4A2A", 1.4);
  const feet =
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
  }" viewBox="0 0 200 400" aria-hidden="true"${d}>${defs}${outline}
    <ellipse cx="100" cy="395" rx="50" ry="5" fill="#000" opacity=".3"/>
    <g class="fb-body" filter="url(#ol${u})">
      <g transform="${HEAD}">${hairBack}${coverBack}</g>
      ${itemBack}${feet}${neck}${body}${cloak}${tails}${arms}${itemFront}
      <g class="fb-head"><g transform="${HEAD}">${head}</g></g>
    </g></svg>`;
}
