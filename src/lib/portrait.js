// The head-and-shoulders portrait (200 x 240), drawn as an SVG string. avatarSVG crops it to a bust.
import {
  SKINS,
  HAIRC,
  HAIRS,
  FACES,
  EYES,
  EYEC,
  BROWS,
  MOUTHS,
  BEARDS,
  COVERS,
  MANTLES,
  JEWELS,
  UNLOCK
} from "./data.js";
import { shade } from "./util.js";
import { normLook, mixHex } from "./look.js";

let AVN = 0;

// Every drawn piece of a character, in the 200 x 240 portrait space. The portrait and the full-body figure both assemble from these.
export function buildParts(look, n, { outline = false } = {}) {
  const L = normLook(look, n);
  const u = "p" + ++AVN;
  const f = L.g === "f";
  const skin = SKINS[L.skin];
  const sD = shade(skin, -0.13); // the one flat shadow tone on skin
  const sDD = shade(skin, -0.3); // nose, ear and eye-socket marks
  const hc = HAIRC[L.hairColor];
  const hL = shade(hc, 0.2);
  const hD = shade(hc, -0.28);
  const tunic = UNLOCK.tunic[L.tunic][1];
  const tunicD = shade(tunic, -0.2);
  const [, mantle, accent] = MANTLES[L.g][L.mantle];
  const mantleD = shade(mantle, -0.2);
  const gold = "#E2B24E";
  const goldD = "#B98A2C";
  const cover = COVERS[L.g][L.cover][1];
  const hat = UNLOCK.hat[L.hat][1];
  const hair = HAIRS[L.hair][1];
  const beard = BEARDS[L.beard][1];
  let [fw, cw, jw, cy, chw] = FACES[L.face][1];
  if (f) {
    jw -= 3;
    chw -= 2;
    cw -= 1;
    cy -= 1;
  } else {
    jw += 2;
    chw += 1;
  }
  const faceD = `M100 50 C${100 + fw * 0.62} 50 ${100 + fw} 58 ${100 + fw} 72 C${100 + fw} 83 ${
    100 + cw
  } 88 ${100 + cw} 98 C${100 + cw} 110 ${100 + jw + 3} 116 ${100 + jw} 122 C${100 + jw - 5} 129 ${
    100 + chw
  } ${cy} 100 ${cy} C${100 - chw} ${cy} ${100 - jw + 5} 129 ${100 - jw} 122 C${100 - jw - 3} 116 ${
    100 - cw
  } 110 ${100 - cw} 98 C${100 - cw} 88 ${100 - fw} 83 ${100 - fw} 72 C${100 - fw} 58 ${
    100 - fw * 0.62
  } 50 100 50 Z`;
  const S = (d, c, w, extra = "") =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
  // With the outline on, the main shapes of the head (face, ears, hair, beard, headwear) get a dark edge.
  const ol = outline ? `stroke="#2B1B12" stroke-width="2.6" stroke-linejoin="round"` : "";
  const PO = (d, fill, extra = "") => P(d, fill, `${ol} ${extra}`);
  const fold = (d, w = 2.4, o = 0.22) => S(d, "#000", w * 0.7, `opacity="${o}"`);
  const sw = f ? 68 : 80; // shoulder half-width

  const defs = `<defs><clipPath id="fc${u}"><path d="${faceD}"/></clipPath></defs>`;

  // ---- garments ----
  const torso = `M${100 - 14} 148 Q${100 - sw * 0.45} 156 ${100 - sw + 14} 166 Q${
    100 - sw - 2
  } 176 ${100 - sw - 6} 204 L${100 - sw - 10} 240 L${100 + sw + 10} 240 L${100 + sw + 6} 204 Q${
    100 + sw + 2
  } 176 ${100 + sw - 14} 166 Q${100 + sw * 0.45} 156 ${100 + 14} 148 Z`;
  let body =
    P(torso, tunic) +
    `<clipPath id="tc${u}"><path d="${torso}"/></clipPath><g clip-path="url(#tc${u})">${P(
      "M110 146 Q104 196 112 244 L260 244 L260 140 Z",
      tunicD
    )}</g>`;
  if (f) {
    // round neckline with an embroidered band
    body +=
      P("M84 150 Q100 166 116 150 L114 147 Q100 160 86 147 Z", skin) +
      S("M83 151 Q100 168 117 151", accent || "#C9A04B", 3.2, 'opacity=".9"') +
      [...Array(7)]
        .map((_, i) => {
          const t = (i + 1) / 8;
          const x = 83 + 34 * t;
          const y = 151 + 34 * t * (1 - t) * 1.0;
          return `<circle cx="${x.toFixed(1)}" cy="${(y + 0.4).toFixed(
            1
          )}" r=".9" fill="#F3E2B0" opacity=".8"/>`;
        })
        .join("");
    // shawl over both shoulders
    const shawlL = `M${100 - 20} 132 Q${100 - 24} 150 ${100 - sw + 10} 166 Q${100 - sw - 4} 178 ${
      100 - sw - 8
    } 206 L${100 - sw - 12} 240 L${100 - 22} 240 Q${100 - 20} 200 ${100 - 26} 172 Q${
      100 - 24
    } 150 ${100 - 20} 132 Z`;
    body +=
      P(shawlL, mantle) + `<g transform="translate(200 0) scale(-1 1)">${P(shawlL, mantleD)}</g>`;
    body +=
      fold(`M${100 - sw + 6} 190 Q${100 - 40} 200 ${100 - 34} 236`) +
      fold(`M${100 + sw - 6} 186 Q${100 + 42} 204 ${100 + 36} 238`, 3, 0.28);
    if (accent) {
      body +=
        S(
          `M${100 - 22} 240 Q${100 - 20} 200 ${100 - 26} 172`,
          accent,
          2.2,
          'stroke-dasharray="2 2.5"'
        ) +
        S(
          `M${100 + 22} 240 Q${100 + 20} 200 ${100 + 26} 172`,
          accent,
          2.2,
          'stroke-dasharray="2 2.5"'
        );
    }
  } else {
    // slit neckline of the tunic, then the mantle over both shoulders
    body +=
      P("M90 148 L100 172 L110 148 Z", sD) +
      P("M91 148 L100 168 L109 148 Z", skin) +
      S("M89 147 L100 173 L111 147", shade(tunic, -0.4), 1.4);
    const mantL = `M${100 - 16} 149 Q${100 - sw * 0.5} 156 ${100 - sw + 12} 166 Q${
      100 - sw - 3
    } 177 ${100 - sw - 7} 204 L${100 - sw - 11} 240 L${100 - 30} 240 Q${100 - 32} 205 ${
      100 - 26
    } 178 Q${100 - 22} 160 ${100 - 16} 149 Z`;
    body +=
      P(mantL, mantle) + `<g transform="translate(200 0) scale(-1 1)">${P(mantL, mantleD)}</g>`;
    if (accent) {
      body += [-1, 1]
        .map(
          s =>
            S(
              `M${100 + s * 36} 240 Q${100 + s * 37} 206 ${100 + s * 31} 180`,
              accent,
              3.2,
              'opacity=".9"'
            ) +
            S(
              `M${100 + s * 44} 240 Q${100 + s * 46} 208 ${100 + s * 40} 182`,
              accent,
              1.6,
              'opacity=".8"'
            )
        )
        .join("");
    }
    body +=
      fold(`M${100 - sw + 2} 196 Q${100 - 52} 206 ${100 - 46} 238`) +
      fold(`M${100 + sw - 2} 192 Q${100 + 54} 206 ${100 + 48} 238`, 3, 0.3);
  }
  // neck, with the shadow the chin throws on it
  const nw = f ? 11 : 14;
  const neck =
    P(
      `M${100 - nw} 114 L${100 - nw - 1} 152 Q100 160 ${100 + nw + 1} 152 L${100 + nw} 114 Z`,
      skin
    ) +
    P(
      `M${100 - nw} 116 Q100 ${cy + 12} ${100 + nw} 116 L${100 + nw} 134 Q100 ${cy + 18} ${
        100 - nw
      } 134 Z`,
      sD
    );

  // ---- hair (back layer) ----
  let hairBack = "";
  if (hair === "long") {
    hairBack = PO(
      `M${100 - fw - 8} 70 Q${100 - fw - 12} 120 ${100 - fw - (f ? 10 : 6)} ${f ? 196 : 150} L${
        100 + fw + (f ? 10 : 6)
      } ${f ? 196 : 150} Q${100 + fw + 12} 120 ${100 + fw + 8} 70 Q100 30 ${100 - fw - 8} 70 Z`,
      hc
    );
  }
  if (hair === "curly") {
    hairBack = PO(
      `M${100 - fw - 12} 74 Q${100 - fw - 18} 110 ${100 - fw - 10} ${f ? 150 : 120} L${
        100 + fw + 10
      } ${f ? 150 : 120} Q${100 + fw + 18} 110 ${100 + fw + 12} 74 Q100 22 ${100 - fw - 12} 74 Z`,
      hc
    );
  }
  if (hair === "bun") {
    hairBack = `<ellipse cx="100" cy="40" rx="15" ry="12" fill="${hc}" ${ol}/>`;
  }
  if (COVERS[L.g][L.cover][1] !== "none" && hair !== "braids") {
    hairBack = "";
  }
  // ---- head coverings (back layer) ----
  let coverBack = "";
  let coverFront = "";
  const veilCol = mantle;
  if (cover === "veil" || cover === "coins") {
    coverBack = PO(
      `M${100 - fw - 14} 70 Q${100 - fw - 18} 130 ${100 - sw + 2} 172 L${100 + sw - 2} 172 Q${
        100 + fw + 18
      } 130 ${100 + fw + 14} 70 Q100 18 ${100 - fw - 14} 70 Z`,
      veilCol
    );
    coverFront =
      PO(
        `M${100 - fw - 14} 70 Q100 18 ${100 + fw + 14} 70 Q${100 + fw + 16} 110 ${
          100 + cw + 8
        } 140 L${100 + cw + 2} 140 Q${100 + fw + 4} 100 ${100 + fw - 2} 74 Q100 44 ${
          100 - fw + 2
        } 74 Q${100 - fw - 4} 100 ${100 - cw - 2} 140 L${100 - cw - 8} 140 Q${100 - fw - 16} 110 ${
          100 - fw - 14
        } 70 Z`,
        veilCol
      ) + fold(`M${100 + fw + 6} 80 Q${100 + fw + 10} 110 ${100 + cw + 4} 136`, 2.6, 0.32);
    if (accent) {
      coverFront += S(
        `M${100 - fw + 1} 75 Q100 45 ${100 + fw - 1} 75`,
        accent,
        1.8,
        'stroke-dasharray="2 2"'
      );
    }
    if (cover === "coins") {
      coverFront +=
        `<path d="M${100 - fw + 2} 66 Q100 52 ${
          100 + fw - 2
        } 66" fill="none" stroke="#5A3B20" stroke-width="1.4"/>` +
        [...Array(11)]
          .map((_, i) => {
            const t = i / 10;
            const x =
              (100 - fw + 2) * (1 - t) ** 2 + 2 * (1 - t) * t * 100 + t * t * (100 + fw - 2);
            const y = 66 * (1 - t) ** 2 + 2 * (1 - t) * t * 52 + t * t * 66;
            return `<circle cx="${x.toFixed(1)}" cy="${(y + 3.2).toFixed(
              1
            )}" r="2.5" fill="${gold}" stroke="#7A5420" stroke-width=".5"/>`;
          })
          .join("");
    }
  }
  if (cover === "scarf") {
    coverBack = PO(
      `M${100 - fw - 10} 72 Q${100 - fw - 12} 108 ${100 - cw - 4} 128 L${100 + cw + 4} 128 Q${
        100 + fw + 12
      } 108 ${100 + fw + 10} 72 Q100 22 ${100 - fw - 10} 72 Z`,
      veilCol
    );
    coverFront =
      PO(
        `M${100 - fw - 10} 72 Q100 22 ${100 + fw + 10} 72 Q${100 + fw + 10} 96 ${
          100 + cw + 2
        } 112 L${100 + fw - 1} 80 Q100 46 ${100 - fw + 1} 80 L${100 - cw - 2} 112 Q${
          100 - fw - 10
        } 96 ${100 - fw - 10} 72 Z`,
        veilCol
      ) +
      P(
        `M${100 - cw - 2} 112 Q${100 - jw} ${cy + 4} 100 ${cy + 7} Q${100 + jw} ${cy + 4} ${
          100 + cw + 2
        } 112 L${100 + cw + 4} 118 Q${100 + jw + 2} ${cy + 10} 100 ${cy + 12} Q${100 - jw - 2} ${
          cy + 10
        } ${100 - cw - 4} 118 Z`,
        mantle
      ) +
      `<ellipse cx="100" cy="${cy + 12}" rx="6" ry="4.4" fill="${shade(mantle, -0.22)}"/>` +
      P(
        `M97 ${cy + 15} L92 ${cy + 34} L99 ${cy + 32} Z M103 ${cy + 15} L109 ${cy + 33} L102 ${
          cy + 32
        } Z`,
        shade(mantle, -0.12)
      );
  }
  if (cover === "cloth") {
    const cloth = "#E4DAC4";
    coverBack =
      P(
        `M${100 - fw - 12} 70 Q${100 - fw - 16} 120 ${100 - fw - 20} 168 L${100 + fw + 20} 168 Q${
          100 + fw + 16
        } 120 ${100 + fw + 12} 70 Q100 20 ${100 - fw - 12} 70 Z`,
        cloth
      ) + fold(`M${100 + fw + 10} 90 Q${100 + fw + 14} 130 ${100 + fw + 16} 164`, 3, 0.25);
    coverFront =
      PO(
        `M${100 - fw - 12} 70 Q100 20 ${100 + fw + 12} 70 Q${100 + fw + 12} 92 ${
          100 + fw + 6
        } 112 L${100 + fw} 112 Q${100 + fw + 2} 88 ${100 + fw - 2} 72 Q100 52 ${100 - fw + 2} 72 Q${
          100 - fw - 2
        } 88 ${100 - fw} 112 L${100 - fw - 6} 112 Q${100 - fw - 12} 92 ${100 - fw - 12} 70 Z`,
        cloth
      ) +
      (accent
        ? S(`M${100 - fw - 6} 64 Q100 34 ${100 + fw + 6} 64`, accent, 1.4, 'opacity=".7"')
        : "") +
      `<path d="M${100 - fw - 11} 62 Q100 40 ${
        100 + fw + 11
      } 62" fill="none" stroke="#231C17" stroke-width="5" stroke-linecap="round"/><path d="M${
        100 - fw - 11
      } 62 Q100 40 ${
        100 + fw + 11
      } 62" fill="none" stroke="#4A3D33" stroke-width="1.2" stroke-linecap="round" transform="translate(0 -1.4)"/>`;
  }
  if (cover === "turban") {
    const tc = mantle;
    coverFront =
      `<ellipse cx="100" cy="54" rx="${fw + 9}" ry="24" fill="${mantle}" ${ol}/>` +
      [0, 1, 2, 3]
        .map(i =>
          S(
            `M${100 - fw - 8 + i * 2} ${66 - i * 7} Q100 ${44 - i * 7} ${100 + fw + 8 - i * 2} ${
              62 - i * 7
            }`,
            shade(tc, -0.35),
            1.4,
            'opacity=".6"'
          )
        )
        .join("") +
      S(`M${100 - fw - 6} 70 Q100 56 ${100 + fw + 6} 70`, shade(tc, -0.4), 3, 'opacity=".55"');
  }

  // ---- face ----
  const ears = [-1, 1]
    .map(
      s =>
        `<ellipse cx="${100 + s * (cw + 1.5)}" cy="98" rx="4.8" ry="9" fill="${skin}" ${ol}/>` +
        S(
          `M${100 + s * (cw + 2.4)} 93 Q${100 + s * (cw + 4.6)} 98 ${100 + s * (cw + 2.4)} 104`,
          sD,
          1.8
        )
    )
    .join("");
  // Flat shading: one shadow crescent down the right cheek, and a soft blush on women.
  const shading = `<g clip-path="url(#fc${u})">
      <ellipse cx="${100 + cw + 13}" cy="98" rx="17" ry="46" fill="${sD}"/>
      ${
        f
          ? `<circle cx="80" cy="107" r="6.4" fill="#E8645A" opacity=".26"/><circle cx="120" cy="107" r="6.4" fill="#E8645A" opacity=".22"/>`
          : ""
      }
      ${
        beard === "stubble" || (beard !== "none" && !f)
          ? `<path d="M${100 - cw} 102 Q${100 - jw - 2} 126 100 ${cy + 2} Q${100 + jw + 2} 126 ${
              100 + cw
            } 102 L${100 + cw} 140 L${100 - cw} 140 Z" fill="${hc}" opacity="${
              beard === "stubble" ? 0.26 : 0.16
            }"/>`
          : ""
      }
    </g>`;
  const face = PO(faceD, skin) + shading;

  // eyes
  const kind = EYES[L.eyes][1];
  const ink = "#1A120D";
  const eye = (cx, s) => {
    let up = -6.2;
    let lo = 3.4;
    let tilt = 0;
    let ir = 4.7; // iris radius
    if (kind === "round") {
      up = -7.6;
      lo = 4.8;
      ir = 5.2;
    }
    if (kind === "almond") {
      up = -5.8;
      lo = 3;
      tilt = -0.8;
    }
    if (kind === "deep") {
      up = -5.4;
      lo = 3;
      ir = 4.2;
    }
    if (kind === "hooded") {
      up = -5.6;
      lo = 3.2;
    }
    if (kind === "up") {
      up = -6;
      lo = 3;
      tilt = -2.2;
    }
    if (!f) {
      up *= 0.92;
    }
    const y = 92;
    const ox = cx + s * 8.5;
    const oy = y + tilt;
    const ix = cx - s * 7.5;
    const iy = y + 0.8;
    const top = `M${ix} ${iy} Q${cx - s} ${y + up * 1.3} ${ox} ${oy}`;
    const open = `${top} Q${cx} ${y + lo * 1.35} ${ix} ${iy} Z`;
    const cid = `e${s > 0 ? "r" : "l"}${u}`;
    let o = `<clipPath id="${cid}"><path d="${open}"/></clipPath>`;
    if (kind === "deep") {
      o += `<ellipse cx="${cx}" cy="${y - 5.2}" rx="10.5" ry="4.6" fill="${sD}"/>`;
    }
    o +=
      P(open, "#FBF7EF") +
      `<g clip-path="url(#${cid})"><circle cx="${cx}" cy="${y - 0.4}" r="${ir}" fill="${
        EYEC[L.eyeColor]
      }"/><circle cx="${cx}" cy="${y - 0.4}" r="${(ir * 0.46).toFixed(1)}" fill="#0B0806"/></g>` +
      `<circle cx="${cx - 1.5}" cy="${y - 2.3}" r="1.15" fill="#fff"/>`;
    if (kind === "hooded") {
      o += P(
        `M${ix} ${iy - 0.3} Q${cx - s} ${y + up * 1.3 - 3.5} ${ox} ${oy - 0.3} Q${cx} ${
          y + up * 0.85
        } ${ix} ${iy - 0.3} Z`,
        skin
      );
    }
    // the lid crease, then the lash line
    o += S(
      `M${ix} ${iy - 3.4} Q${cx - s} ${y + up * 1.3 - (kind === "hooded" ? 6 : 4.4)} ${ox} ${
        oy - 3.2
      }`,
      sDD,
      1.2
    );
    o += S(top, ink, f ? 2.3 : 1.9);
    if (f) {
      o += S(`M${ox} ${oy} l${s * 2.8} -1.8`, ink, 1.7);
    }
    return o;
  };
  const eyes = `<g class="pt-eyes">${eye(85, -1)}${eye(115, 1)}</g>`;

  // brows
  const [, peak, thick0, angular] = BROWS[L.brows];
  const thick = thick0 * (f ? 0.8 : 1.3);
  const pk = peak - (f ? 1 : 0);
  const bc = shade(hc, -0.05);
  const brow = s => {
    const cx = 100 + s * 15;
    const ix = cx - s * 9;
    const py = 81 + pk;
    const px = cx + s * 3;
    const tx = cx + s * 11.5;
    const ty = 83.5;
    const topE = angular
      ? `L${px} ${py - thick * 0.5} L${tx} ${ty - 0.2}`
      : `Q${px} ${py - thick * 0.8} ${tx} ${ty - 0.2}`;
    const botE = angular
      ? `L${px} ${py + thick * 0.5} L${ix} ${82 + thick * 0.25}`
      : `Q${px} ${py + thick * 0.55} ${ix} ${82 + thick * 0.25}`;
    return P(`M${ix} ${82 - thick * 0.75} ${topE} ${botE} Z`, bc);
  };
  const brows = brow(-1) + brow(1);

  // nose
  const nwid = f ? 5 : 6.6;
  const noseC = shade(skin, -0.24);
  const nose = S(`M101.4 96 L102 103.4 Q101.8 106.8 98 106.2`, noseC, f ? 1.7 : 2);

  // mouth
  const mk = MOUTHS[L.mouth][1];
  const w = f ? 9 : 10.5;
  const lipU = f ? mixHex(skin, "#8E2F33", 0.66) : mixHex(skin, "#7E3A32", 0.55);
  const lipLo = f ? mixHex(skin, "#B34A4C", 0.62) : mixHex(skin, "#9A5045", 0.42);
  let cl = 0;
  let cr = 0;
  let open = 0;
  let teeth = false;
  if (mk === "soft") {
    cl = cr = -1.6;
  }
  if (mk === "warm") {
    cl = cr = -2.8;
    open = 1.6;
    teeth = true;
  }
  if (mk === "smirk") {
    cl = 0.4;
    cr = -2.6;
  }
  if (mk === "laugh") {
    cl = cr = -3;
    open = 5;
    teeth = true;
  }
  if (mk === "parted") {
    open = 1.8;
  }
  const my = 119;
  const full = f ? 1.8 : 1;
  const lx = 100 - w;
  const ly = my + cl;
  const rx = 100 + w;
  const ry = my + cr;
  let mouth = "";
  if (open) {
    mouth +=
      P(
        `M${lx} ${ly} Q100 ${my + 1} ${rx} ${ry} Q100 ${my + 2 + open * 1.4} ${lx} ${ly} Z`,
        "#3A1614"
      ) +
      (teeth
        ? P(
            `M${lx + 2.5} ${ly + 0.6} Q100 ${my + 1.6} ${rx - 2.5} ${ry + 0.6} Q100 ${
              my + 2.4 + Math.min(open, 2.4)
            } ${lx + 2.5} ${ly + 0.6} Z`,
            "#EDE5D6"
          )
        : "");
  }
  mouth += P(
    `M${lx} ${ly} Q${100 - 4} ${my - 3} ${100 - 1.4} ${my - 2.2} Q100 ${my - 1.6} ${100 + 1.4} ${
      my - 2.2
    } Q${100 + 4} ${my - 3} ${rx} ${ry} Q100 ${my + 0.6} ${lx} ${ly} Z`,
    lipU
  );
  mouth += P(
    `M${lx + 1} ${ly + 0.4} Q100 ${my + 0.8 + open * 1.4} ${rx - 1} ${ry + 0.4} Q${100 + 3} ${
      my + 4.6 + full + open
    } 100 ${my + 5 + full + open} Q${100 - 3} ${my + 4.6 + full + open} ${lx + 1} ${ly + 0.4} Z`,
    lipLo
  );
  mouth += S(
    `M${lx} ${ly} Q100 ${my + 0.8 + (open ? 0 : 0.2)} ${rx} ${ry}`,
    shade(lipU, -0.45),
    0.9
  );
  if (cl < -1 || cr < -1) {
    mouth +=
      S(`M${lx - 1} ${ly - 0.6} q-1.4 1.6 -0.4 3.2`, sD, 0.9, 'opacity=".5"') +
      S(`M${rx + 1} ${ry - 0.6} q1.4 1.6 0.4 3.2`, sD, 0.9, 'opacity=".5"');
  }

  // beard
  let beardSVG = "";
  if (!f && (beard === "trim" || beard === "full" || beard === "long")) {
    const drop = beard === "trim" ? 2 : beard === "full" ? 8 : 26;
    const bulge = beard === "trim" ? 1 : beard === "full" ? 4 : 5;
    const outer = `M${100 - cw - 0.5} 96 C${100 - cw - bulge} 114 ${100 - jw - bulge} 126 ${
      100 - chw - 4
    } ${cy + drop - 4} Q100 ${cy + drop + (beard === "long" ? 8 : 3)} ${100 + chw + 4} ${
      cy + drop - 4
    } C${100 + jw + bulge} 126 ${100 + cw + bulge} 114 ${100 + cw + 0.5} 96`;
    const inner = `L${100 + cw - 4} 98 Q${100 + cw - 8} 110 ${100 + 13} 113 Q${
      100 + 7
    } 112 100 113 Q${100 - 7} 112 ${100 - 13} 113 Q${100 - cw + 8} 110 ${100 - cw + 4} 98 Z`;
    beardSVG =
      PO(outer + inner, hc) +
      `<clipPath id="bd${u}"><path d="${
        outer + inner
      }"/></clipPath><g clip-path="url(#bd${u})"><ellipse cx="${100 + jw + 12}" cy="${
        cy - 4
      }" rx="26" ry="${beard === "long" ? 44 : 30}" fill="${hD}"/></g>` +
      P(
        `M${100 - 12} 117 Q${100 - 7} 112 100 114 Q${100 + 7} 112 ${100 + 12} 117 Q${
          100 + 6
        } 115.4 100 116.4 Q${100 - 6} 115.4 ${100 - 12} 117 Z`,
        hc
      );
  }

  // ---- hair (front) ----
  let hairFront = "";
  const covered = cover !== "none";
  const hairline = `M${100 - fw - 2} 82 Q${100 - fw - 4} 50 100 ${f ? 40 : 42} Q${
    100 + fw + 4
  } 50 ${100 + fw + 2} 82`;
  if (!covered || cover === "veil" || cover === "coins" || cover === "scarf") {
    if (hair === "short" && !covered) {
      hairFront =
        PO(
          `${hairline} L${100 + fw - 1} 84 Q${100 + fw - 2} 66 ${100 + 12} 62 Q100 64 ${
            100 - 10
          } 61 Q${100 - fw + 1} 64 ${100 - fw + 1} 84 Z`,
          hc
        ) + S(`M${100 - 20} 56 Q${100 - 8} 47 ${100 + 8} 49`, hL, 3, 'opacity=".7"');
    }
    if (hair === "crop" && !covered) {
      hairFront = PO(
        `M${100 - fw} 74 Q${100 - fw - 1} 50 100 46 Q${100 + fw + 1} 50 ${100 + fw} 74 Q${
          100 + fw - 3
        } 62 100 60 Q${100 - fw + 3} 62 ${100 - fw} 74 Z`,
        hc,
        'opacity=".9"'
      );
    }
    if (hair === "long" || hair === "bun" || hair === "braids") {
      hairFront =
        PO(
          `${hairline} L${100 + fw} 96 Q${100 + fw - 2} 66 ${100 + 2} 58 L100 60 L${100 - 2} 58 Q${
            100 - fw + 2
          } 66 ${100 - fw} 96 Z`,
          hc
        ) +
        S("M100 46 L100 60", hD, 0.9, 'opacity=".7"') +
        S(`M${100 - 14} 51 Q${100 - 24} 58 ${100 - fw + 3} 76`, hL, 3, 'opacity=".6"');
    }
    if (hair === "curly") {
      hairFront =
        PO(
          `${hairline} Q${100 + fw - 4} 64 ${100 + 6} 60 Q100 62 ${100 - 6} 60 Q${
            100 - fw + 4
          } 64 ${100 - fw - 2} 82 Z`,
          hc
        ) +
        [
          [-22, 50],
          [-10, 44],
          [4, 44],
          [18, 48],
          [-28, 62],
          [26, 60]
        ]
          .map(([dx, y]) => `<circle cx="${100 + dx}" cy="${y}" r="${f ? 6 : 5.4}" fill="${hc}"/>`)
          .join("");
    }
    if (hair === "braids") {
      hairFront += [-1, 1]
        .map(
          s =>
            [...Array(7)]
              .map(
                (_, i) =>
                  `<ellipse cx="${100 + s * (cw - 1) + s * Math.sin(i) * 0.6}" cy="${
                    118 + i * 12
                  }" rx="5" ry="6.4" fill="${hc}" stroke="${hD}" stroke-width=".6"/>`
              )
              .join("") +
            `<circle cx="${100 + s * (cw - 1)}" cy="${118 + 7 * 12 - 2}" r="2.6" fill="${
              accent || "#962F28"
            }"/>`
        )
        .join("");
    }
    if (covered && cover !== "scarf") {
      hairFront = hairFront ? `<g clip-path="url(#fc${u})">${hairFront}</g>` : "";
    }
    if (cover === "scarf") {
      hairFront = "";
    }
  }

  // ---- unlockable headgear ----
  let hatSVG = "";
  if (hat === "band") {
    hatSVG = S(`M${100 - fw - 1} 68 Q100 56 ${100 + fw + 1} 68`, UNLOCK.sash[L.sash][1], 3.2);
  }
  if (hat === "wrap") {
    hatSVG =
      P(`M${100 - fw - 6} 72 Q100 34 ${100 + fw + 6} 72 Q100 58 ${100 - fw - 6} 72 Z`, "#E6DCC6") +
      S(`M${100 - fw - 5} 70 Q100 50 ${100 + fw + 5} 70`, UNLOCK.sash[L.sash][1], 2.4);
  }
  if (hat === "laurel") {
    hatSVG = [...Array(14)]
      .map((_, i) => {
        const s = i < 7 ? -1 : 1;
        const k = i % 7;
        const t = k / 6;
        const x = 100 + s * (fw + 4) * (1 - t * 0.85);
        const y = 70 - Math.sin((t * Math.PI) / 2) * 18;
        return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="2.2" fill="${
          k % 2 ? "#5E7A36" : "#7E9A45"
        }" transform="rotate(${(s * (60 - t * 50)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      })
      .join("");
  }
  if (hat === "helmet") {
    hatSVG =
      P(
        `M${100 - fw - 8} 80 Q${100 - fw - 9} 32 100 30 Q${100 + fw + 9} 32 ${100 + fw + 8} 80 L${
          100 + fw + 2
        } 84 L${100 + fw} 70 Q100 62 ${100 - fw} 70 L${100 - fw - 2} 84 Z`,
        "#8E969E"
      ) +
      P(
        `M${100 - fw - 8} 64 Q100 52 ${100 + fw + 8} 64 L${100 + fw + 8} 70 Q100 58 ${
          100 - fw - 8
        } 70 Z`,
        "#C9A04B"
      ) +
      P(`M96 30 Q99 21 110 23 Q104 27 104 30 Z`, "#8E2A24");
  }
  if (hat === "crown") {
    hatSVG =
      P(
        `M${100 - 22} 58 L${100 - 24} 36 L${100 - 12} 48 L100 30 L${100 + 12} 48 L${100 + 24} 36 L${
          100 + 22
        } 58 Z`,
        gold
      ) +
      `<rect x="${100 - 23}" y="54" width="46" height="7" rx="2" fill="${gold}"/>` +
      `<circle cx="100" cy="57.5" r="2.4" fill="#8E2A24"/><circle cx="${
        100 - 12
      }" cy="57.5" r="1.8" fill="#2B4C8C"/><circle cx="${
        100 + 12
      }" cy="57.5" r="1.8" fill="#4E7A3A"/>`;
  }

  // ---- jewelry ----
  const jk = f ? JEWELS[L.jewel][1] : "none";
  let jewelHead = "";
  let jewelBody = "";
  if (jk === "ear" || jk === "beads") {
    jewelHead += [-1, 1]
      .map(
        s =>
          `<circle cx="${
            100 + s * (cw + 2)
          }" cy="109" r="3.4" fill="none" stroke="${gold}" stroke-width="1.4"/>`
      )
      .join("");
  }
  if (jk === "beads") {
    jewelBody += [...Array(13)]
      .map((_, i) => {
        const t = i / 12;
        const x = 82 + 36 * t;
        const y = 156 + Math.sin(t * Math.PI) * 9;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.9" fill="${
          i % 3 === 1 ? "#2D6E7E" : i % 3 === 2 ? "#8E2A24" : gold
        }"/>`;
      })
      .join("");
  }
  if (jk === "nose") {
    jewelHead +=
      `<circle cx="${100 - 4.6}" cy="111" r="2.2" fill="none" stroke="${gold}" stroke-width="1"/>` +
      [-1, 1]
        .map(s => `<circle cx="${100 + s * (cw + 2)}" cy="108" r="1.6" fill="${gold}"/>`)
        .join("");
  }

  return {
    L,
    u,
    defs,
    hairBack,
    coverBack,
    neck,
    body,
    jewelBody,
    head: `${ears}${face}${eyes}${brows}${nose}${beardSVG}${mouth}${hairFront}${coverFront}${hatSVG}${jewelHead}`
  };
}

export function portraitSVG(look, n, opts = {}) {
  const { defs, hairBack, coverBack, neck, body, jewelBody, head } = buildParts(look, n);
  const vb = opts.vb || (opts.bust ? "46 30 108 108" : "14 20 172 206");
  const d = opts.live ? ` style="--d:${(-Math.random() * 4).toFixed(2)}s"` : "";
  return `<svg class="pt av${opts.live ? " live" : ""}${
    opts.cheer ? " cheer" : ""
  }" viewBox="${vb}" aria-hidden="true"${d}>${defs}
    <circle cx="100" cy="132" r="88" fill="#F2D58C" opacity=".1"/>
    <g class="pt-body">${hairBack}${coverBack}${neck}${body}${jewelBody}
    <g class="pt-head">${head}</g></g></svg>`;
}
