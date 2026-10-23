// The painted portrait and small full-body figure, drawn as SVG strings (rendered with <Avatar>).
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
  UNLOCK,
  allowedFor
} from "./data.js";
import { shade, qpt } from "./util.js";

/* ---------- avatar ---------- */
export function normLook(l, n) {
  l = l && typeof l === "object" ? l : {};
  const g = l.g === "f" ? "f" : "m";
  const pick = (v, arr) => (Number.isInteger(v) && v >= 0 && v < arr.length ? v : 0);
  const gated = (v, key) => {
    const ok = allowedFor(key, g)
      .filter(([e]) => e[2] <= n)
      .map(([, i]) => i);
    return ok.includes(v) ? v : ok[0];
  };
  const beard = g === "f" ? 0 : l.beard === true ? 3 : pick(l.beard, BEARDS);
  return {
    g,
    skin: pick(l.skin, SKINS),
    hair: pick(l.hair, HAIRS),
    hairColor: pick(l.hairColor, HAIRC),
    beard,
    tunic: gated(l.tunic, "tunic"),
    sash: gated(l.sash, "sash"),
    hat: gated(l.hat, "hat"),
    item: gated(l.item, "item"),
    face: pick(l.face, FACES),
    eyes: pick(l.eyes, EYES),
    eyeColor: pick(l.eyeColor, EYEC),
    brows: pick(l.brows, BROWS),
    mouth: pick(l.mouth, MOUTHS),
    cover: pick(l.cover, COVERS[g]),
    mantle: pick(l.mantle, MANTLES[g]),
    jewel: g === "f" ? pick(l.jewel, JEWELS) : 0
  };
}

export const mixHex = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = s => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  return (
    "#" +
    ch(pa)
      .map((v, i) =>
        Math.round(v + (ch(pb)[i] - v) * t)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
};
let AVN = 0;

// opts.portrait / opts.bust / opts.vb draw the painted portrait; otherwise the small full-body figure (map, road).
// Still (non-animated) avatars are cached by look, so re-renders don't rebuild every portrait.
const AV_CACHE = new Map();
export function avatarSVG(look, n, opts = {}) {
  const draw = () =>
    opts.portrait || opts.bust || opts.vb ? portraitSVG(look, n, opts) : figureSVG(look, n, opts);
  if (opts.live || opts.cheer) {
    return draw();
  }
  const key = JSON.stringify([
    normLook(look, n),
    opts.portrait ? 1 : 0,
    opts.bust ? 1 : 0,
    opts.vb || ""
  ]);
  let svg = AV_CACHE.get(key);
  if (!svg) {
    svg = draw();
    if (AV_CACHE.size > 500) {
      AV_CACHE.clear();
    }
    AV_CACHE.set(key, svg);
  }
  return svg;
}

export function portraitSVG(look, n, opts = {}) {
  const L = normLook(look, n);
  const u = "p" + ++AVN;
  const f = L.g === "f";
  const skin = SKINS[L.skin];
  const sL = shade(skin, 0.13);
  const sD = shade(skin, -0.2);
  const sDD = shade(skin, -0.38);
  const hc = HAIRC[L.hairColor];
  const hL = shade(hc, 0.22);
  const hD = shade(hc, -0.35);
  const tunic = UNLOCK.tunic[L.tunic][1];
  const [, mantle, accent] = MANTLES[L.g][L.mantle];
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
  const fold = (d, w = 2.4, o = 0.22) => S(d, "#000", w, `opacity="${o}" filter="url(#sb${u})"`);
  const hi = (d, w = 2, o = 0.14) => S(d, "#fff", w, `opacity="${o}" filter="url(#sb${u})"`);
  const sw = f ? 68 : 80; // shoulder half-width

  const defs = `<defs>
    <radialGradient id="sk${u}" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="${sL}"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${sD}"/></radialGradient>
    <linearGradient id="hr${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hL}"/><stop offset=".5" stop-color="${hc}"/><stop offset="1" stop-color="${hD}"/></linearGradient>
    <linearGradient id="tn${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(
    tunic,
    0.12
  )}"/><stop offset=".6" stop-color="${tunic}"/><stop offset="1" stop-color="${shade(
    tunic,
    -0.32
  )}"/></linearGradient>
    <linearGradient id="mt${u}" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="${shade(
    mantle,
    0.14
  )}"/><stop offset=".55" stop-color="${mantle}"/><stop offset="1" stop-color="${shade(
    mantle,
    -0.36
  )}"/></linearGradient>
    <radialGradient id="ir${u}" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${shade(
    EYEC[L.eyeColor],
    0.35
  )}"/><stop offset=".7" stop-color="${EYEC[L.eyeColor]}"/><stop offset="1" stop-color="${shade(
    EYEC[L.eyeColor],
    -0.45
  )}"/></radialGradient>
    <linearGradient id="gd${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4D58A"/><stop offset=".5" stop-color="#C99A3E"/><stop offset="1" stop-color="#8A6424"/></linearGradient>
    <clipPath id="fc${u}"><path d="${faceD}"/></clipPath>
    <filter id="sb${u}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="bb${u}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>`;

  // ---- garments ----
  const torso = `M${100 - 14} 148 Q${100 - sw * 0.45} 156 ${100 - sw + 14} 166 Q${
    100 - sw - 2
  } 176 ${100 - sw - 6} 204 L${100 - sw - 10} 240 L${100 + sw + 10} 240 L${100 + sw + 6} 204 Q${
    100 + sw + 2
  } 176 ${100 + sw - 14} 166 Q${100 + sw * 0.45} 156 ${100 + 14} 148 Z`;
  let body = P(torso, `url(#tn${u})`);
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
      P(shawlL, `url(#mt${u})`) +
      `<g transform="translate(200 0) scale(-1 1)">${P(shawlL, `url(#mt${u})`)}</g>`;
    body +=
      fold(`M${100 - sw + 6} 190 Q${100 - 40} 200 ${100 - 34} 236`) +
      fold(`M${100 + sw - 6} 186 Q${100 + 42} 204 ${100 + 36} 238`, 3, 0.28) +
      hi(`M${100 - sw + 8} 172 Q${100 - 46} 168 ${100 - 30} 160`);
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
      P(mantL, `url(#mt${u})`) +
      `<g transform="translate(200 0) scale(-1 1)">${P(mantL, `url(#mt${u})`)}</g>`;
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
      fold(`M${100 + sw - 2} 192 Q${100 + 54} 206 ${100 + 48} 238`, 3, 0.3) +
      hi(`M${100 - sw + 6} 172 Q${100 - 52} 166 ${100 - 30} 158`);
  }
  // neck
  const nw = f ? 11 : 14;
  const neck =
    P(
      `M${100 - nw} 114 L${100 - nw - 1} 152 Q100 160 ${100 + nw + 1} 152 L${100 + nw} 114 Z`,
      `url(#sk${u})`
    ) +
    P(
      `M${100 - nw} 118 Q100 ${cy + 10} ${100 + nw} 118 L${100 + nw} 132 Q100 ${cy + 16} ${
        100 - nw
      } 132 Z`,
      sDD,
      `opacity=".45" filter="url(#sb${u})"`
    ) +
    (f ? "" : S("M96 146 Q100 148 104 146", sD, 1.4, 'opacity=".5"'));

  // ---- hair (back layer) ----
  let hairBack = "";
  if (hair === "long") {
    hairBack = P(
      `M${100 - fw - 8} 70 Q${100 - fw - 12} 120 ${100 - fw - (f ? 10 : 6)} ${f ? 196 : 150} L${
        100 + fw + (f ? 10 : 6)
      } ${f ? 196 : 150} Q${100 + fw + 12} 120 ${100 + fw + 8} 70 Q100 30 ${100 - fw - 8} 70 Z`,
      `url(#hr${u})`
    );
  }
  if (hair === "curly") {
    hairBack = P(
      `M${100 - fw - 12} 74 Q${100 - fw - 18} 110 ${100 - fw - 10} ${f ? 150 : 120} L${
        100 + fw + 10
      } ${f ? 150 : 120} Q${100 + fw + 18} 110 ${100 + fw + 12} 74 Q100 22 ${100 - fw - 12} 74 Z`,
      `url(#hr${u})`
    );
  }
  if (hair === "bun") {
    hairBack = `<ellipse cx="100" cy="40" rx="15" ry="12" fill="url(#hr${u})"/>`;
  }
  if (COVERS[L.g][L.cover][1] !== "none" && hair !== "braids") {
    hairBack = "";
  }
  // ---- head coverings (back layer) ----
  let coverBack = "";
  let coverFront = "";
  const veilCol = `url(#mt${u})`;
  if (cover === "veil" || cover === "coins") {
    coverBack = P(
      `M${100 - fw - 14} 70 Q${100 - fw - 18} 130 ${100 - sw + 2} 172 L${100 + sw - 2} 172 Q${
        100 + fw + 18
      } 130 ${100 + fw + 14} 70 Q100 18 ${100 - fw - 14} 70 Z`,
      veilCol
    );
    coverFront =
      P(
        `M${100 - fw - 14} 70 Q100 18 ${100 + fw + 14} 70 Q${100 + fw + 16} 110 ${
          100 + cw + 8
        } 140 L${100 + cw + 2} 140 Q${100 + fw + 4} 100 ${100 + fw - 2} 74 Q100 44 ${
          100 - fw + 2
        } 74 Q${100 - fw - 4} 100 ${100 - cw - 2} 140 L${100 - cw - 8} 140 Q${100 - fw - 16} 110 ${
          100 - fw - 14
        } 70 Z`,
        veilCol
      ) +
      fold(`M${100 + fw + 6} 80 Q${100 + fw + 10} 110 ${100 + cw + 4} 136`, 2.6, 0.32) +
      hi(`M${100 - fw - 8} 76 Q${100 - 24} 50 100 47`, 2.4, 0.18);
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
            )}" r="2.5" fill="url(#gd${u})" stroke="#7A5420" stroke-width=".5"/>`;
          })
          .join("");
    }
  }
  if (cover === "scarf") {
    coverBack = P(
      `M${100 - fw - 10} 72 Q${100 - fw - 12} 108 ${100 - cw - 4} 128 L${100 + cw + 4} 128 Q${
        100 + fw + 12
      } 108 ${100 + fw + 10} 72 Q100 22 ${100 - fw - 10} 72 Z`,
      veilCol
    );
    coverFront =
      P(
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
        `url(#mt${u})`
      ) +
      `<ellipse cx="100" cy="${cy + 12}" rx="6" ry="4.4" fill="${shade(mantle, -0.22)}"/>` +
      P(
        `M97 ${cy + 15} L92 ${cy + 34} L99 ${cy + 32} Z M103 ${cy + 15} L109 ${cy + 33} L102 ${
          cy + 32
        } Z`,
        shade(mantle, -0.12)
      ) +
      hi(`M${100 - fw - 6} 76 Q${100 - 22} 50 100 48`, 2.2, 0.18);
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
      P(
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
      } 62" fill="none" stroke="#4A3D33" stroke-width="1.2" stroke-linecap="round" transform="translate(0 -1.4)"/>` +
      hi(`M${100 - fw - 8} 76 Q${100 - 24} 50 100 47`, 2.4, 0.22);
  }
  if (cover === "turban") {
    const tc = mantle;
    coverFront =
      `<ellipse cx="100" cy="54" rx="${fw + 9}" ry="24" fill="url(#mt${u})"/>` +
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
      S(`M${100 - fw - 6} 70 Q100 56 ${100 + fw + 6} 70`, shade(tc, -0.4), 3, 'opacity=".55"') +
      hi(`M${100 - fw} 50 Q${100 - 10} 34 ${100 + 6} 34`, 3, 0.2);
  }

  // ---- face ----
  const ears = [-1, 1]
    .map(
      s =>
        `<ellipse cx="${100 + s * (cw + 1.5)}" cy="98" rx="4.6" ry="9" fill="${skin}"/>` +
        S(
          `M${100 + s * (cw + 2.6)} 92 Q${100 + s * (cw + 4)} 98 ${100 + s * (cw + 2.2)} 104`,
          sD,
          1.2,
          'opacity=".7"'
        )
    )
    .join("");
  const shading = `<g clip-path="url(#fc${u})">
      <ellipse cx="${
        100 + cw + 2
      }" cy="100" rx="17" ry="56" fill="${sDD}" opacity=".42" filter="url(#bb${u})"/>
      <ellipse cx="100" cy="${cy + 2}" rx="${
    jw + 4
  }" ry="10" fill="${sDD}" opacity=".35" filter="url(#bb${u})"/>
      <ellipse cx="${
        100 + cw - 6
      }" cy="110" rx="9" ry="12" fill="${sD}" opacity=".35" filter="url(#bb${u})"/>
      <ellipse cx="${
        100 - cw + 6
      }" cy="110" rx="7" ry="10" fill="${sD}" opacity=".2" filter="url(#bb${u})"/>
      <ellipse cx="88" cy="62" rx="16" ry="9" fill="#fff" opacity=".13" filter="url(#bb${u})"/>
      <ellipse cx="${
        100 - cw + 9
      }" cy="100" rx="6" ry="4" fill="#fff" opacity=".1" filter="url(#bb${u})"/>
      <ellipse cx="100" cy="${
        cy - 5
      }" rx="5" ry="3" fill="#fff" opacity=".12" filter="url(#bb${u})"/>
      ${
        f
          ? `<ellipse cx="80" cy="106" rx="9" ry="5" fill="#C9574B" opacity=".2" filter="url(#bb${u})"/><ellipse cx="120" cy="106" rx="9" ry="5" fill="#C9574B" opacity=".18" filter="url(#bb${u})"/>`
          : ""
      }
      ${
        beard === "stubble" || (beard !== "none" && !f)
          ? `<path d="M${100 - cw} 102 Q${100 - jw - 2} 126 100 ${cy + 2} Q${100 + jw + 2} 126 ${
              100 + cw
            } 102 L${100 + cw} 140 L${100 - cw} 140 Z" fill="${hc}" opacity="${
              beard === "stubble" ? 0.28 : 0.18
            }" filter="url(#sb${u})"/>`
          : ""
      }
      ${
        beard === "stubble"
          ? `<path d="M88 116 Q100 111 112 116 L112 118 Q100 114 88 118 Z" fill="${hc}" opacity=".3" filter="url(#sb${u})"/>`
          : ""
      }
    </g>`;
  const face = P(faceD, `url(#sk${u})`) + shading + S(faceD, sDD, 0.8, 'opacity=".35"');

  // eyes
  const kind = EYES[L.eyes][1];
  const ink = "#1A120D";
  const eye = (cx, s) => {
    let up = -6.2;
    let lo = 3.4;
    let tilt = 0;
    if (kind === "round") {
      up = -7.4;
      lo = 4.6;
    }
    if (kind === "almond") {
      up = -5.8;
      lo = 3;
      tilt = -0.8;
    }
    if (kind === "deep") {
      up = -5.4;
      lo = 3;
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
      o += `<ellipse cx="${cx}" cy="${
        y - 5
      }" rx="11" ry="5" fill="${sDD}" opacity=".45" filter="url(#sb${u})"/>`;
    }
    o += P(
      `M${ix - s * 1} ${iy + 1} Q${cx} ${y + lo * 2.4} ${ox + s} ${oy + 1}`,
      sD,
      'opacity=".35" filter="url(#sb' + u + ')"'
    );
    o +=
      P(open, "#EFE7DA") +
      `<g clip-path="url(#${cid})"><circle cx="${cx}" cy="${
        y - 0.4
      }" r="4.3" fill="url(#ir${u})"/><circle cx="${cx}" cy="${
        y - 0.4
      }" r="4.3" fill="none" stroke="${shade(EYEC[L.eyeColor], -0.6)}" stroke-width=".7"/>
      <circle cx="${cx}" cy="${
        y - 0.4
      }" r="1.9" fill="#0B0806"/><path d="${top}" fill="none" stroke="${sDD}" stroke-width="3.4" opacity=".35"/></g>
      <circle cx="${cx - 1.5}" cy="${y - 2.2}" r="1" fill="#fff" opacity=".92"/>`;
    if (kind === "hooded") {
      o += P(
        `M${ix} ${iy - 0.3} Q${cx - s} ${y + up * 1.3 - 3.5} ${ox} ${oy - 0.3} Q${cx} ${
          y + up * 0.85
        } ${ix} ${iy - 0.3} Z`,
        skin
      );
    }
    o += S(
      `M${ix} ${iy - 3.2} Q${cx - s} ${y + up * 1.3 - (kind === "hooded" ? 6 : 4)} ${ox} ${oy - 3}`,
      sDD,
      1.1,
      'opacity=".45"'
    );
    o += S(top, ink, f ? 2.1 : 1.5);
    o += S(
      `M${ix + s * 1.5} ${iy + 0.6} Q${cx} ${y + lo * 1.35} ${ox} ${oy + 0.4}`,
      f ? ink : sDD,
      f ? 1 : 0.8,
      `opacity="${f ? 0.6 : 0.45}"`
    );
    if (f) {
      o += S(`M${ox} ${oy} l${s * 2.8} -1.6`, ink, 1.6);
      for (let k = 0; k < 4; k++) {
        const t = 0.5 + k * 0.15;
        const p = qpt({ x: ix, y: iy }, { x: cx - s, y: y + up * 1.3 }, { x: ox, y: oy }, t);
        o += S(
          `M${p.x.toFixed(1)} ${p.y.toFixed(1)} l${(s * (0.6 + k * 0.5)).toFixed(1)} -2.4`,
          ink,
          0.8
        );
      }
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
    return (
      P(`M${ix} ${82 - thick * 0.75} ${topE} ${botE} Z`, bc) +
      S(`M${ix + s * 2} ${82} Q${px} ${py} ${tx - s * 2} ${ty - 0.6}`, hL, 0.5, 'opacity=".5"')
    );
  };
  const brows = brow(-1) + brow(1);

  // nose
  const nwid = f ? 5 : 6.6;
  const nose =
    S(`M104 86 Q106.5 98 107 106`, sD, 2.6, `opacity=".45" filter="url(#sb${u})"`) +
    `<ellipse cx="100.5" cy="106" rx="4.2" ry="3" fill="#fff" opacity=".14" filter="url(#sb${u})"/>` +
    S(
      `M${100 - nwid} 109.5 Q${100 - nwid + 1} 105.5 ${100 - 1.8} 108.6`,
      sDD,
      1.1,
      'opacity=".8"'
    ) +
    S(
      `M${100 + nwid} 109.5 Q${100 + nwid - 1} 105.5 ${100 + 1.8} 108.6`,
      sDD,
      1.1,
      'opacity=".8"'
    ) +
    `<ellipse cx="${
      100 - 2.8
    }" cy="110" rx="1.6" ry=".8" fill="${sDD}" opacity=".75"/><ellipse cx="${
      100 + 2.8
    }" cy="110" rx="1.6" ry=".8" fill="${sDD}" opacity=".75"/>` +
    `<ellipse cx="100" cy="112.5" rx="6" ry="1.6" fill="${sD}" opacity=".35" filter="url(#sb${u})"/>`;

  // mouth
  const mk = MOUTHS[L.mouth][1];
  const w = f ? 9 : 10.5;
  const lipU = f ? mixHex(skin, "#8E2F33", 0.55) : mixHex(skin, "#7E3A32", 0.32);
  const lipLo = f ? mixHex(skin, "#B34A4C", 0.5) : mixHex(skin, "#9A5045", 0.25);
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
  const full = f ? 1.6 : 0.4;
  const lx = 100 - w;
  const ly = my + cl;
  const rx = 100 + w;
  const ry = my + cr;
  let mouth = "";
  mouth += `<ellipse cx="100" cy="${
    my + 7 + open
  }" rx="6" ry="2" fill="${sDD}" opacity=".3" filter="url(#sb${u})"/>`;
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
  mouth += `<ellipse cx="${100 - 1}" cy="${
    my + 2.6 + full + open
  }" rx="3" ry="1" fill="#fff" opacity="${f ? 0.28 : 0.14}"/>`;
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
      P(outer + inner, `url(#hr${u})`) +
      P(
        `M${100 - 12} 117 Q${100 - 7} 112 100 114 Q${100 + 7} 112 ${100 + 12} 117 Q${
          100 + 6
        } 115.4 100 116.4 Q${100 - 6} 115.4 ${100 - 12} 117 Z`,
        hc
      ) +
      [...Array(9)]
        .map((_, i) => {
          const x = 100 - jw + i * (jw / 4);
          return S(
            `M${x.toFixed(1)} ${(cy - 4).toFixed(1)} q${(i - 4) * 0.4} ${drop / 2 + 4} ${
              (i - 4) * 0.6
            } ${drop + 2}`,
            i % 2 ? hL : hD,
            0.7,
            'opacity=".5"'
          );
        })
        .join("") +
      P(
        `M${100 - w + 1} ${my + 1} Q100 ${my + 5} ${100 + w - 1} ${my + 1} Q100 ${my + 9} ${
          100 - w + 1
        } ${my + 1} Z`,
        hc,
        'opacity=".6"'
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
        P(
          `${hairline} L${100 + fw - 1} 84 Q${100 + fw - 2} 66 ${100 + 12} 62 Q100 64 ${
            100 - 10
          } 61 Q${100 - fw + 1} 64 ${100 - fw + 1} 84 Z`,
          `url(#hr${u})`
        ) + S(`M${100 - 16} 50 Q${100 - 6} 46 ${100 + 10} 50`, hL, 1, 'opacity=".5"');
    }
    if (hair === "crop" && !covered) {
      hairFront = P(
        `M${100 - fw} 74 Q${100 - fw - 1} 50 100 46 Q${100 + fw + 1} 50 ${100 + fw} 74 Q${
          100 + fw - 3
        } 62 100 60 Q${100 - fw + 3} 62 ${100 - fw} 74 Z`,
        hc,
        'opacity=".9"'
      );
    }
    if (hair === "long" || hair === "bun" || hair === "braids") {
      hairFront =
        P(
          `${hairline} L${100 + fw} 96 Q${100 + fw - 2} 66 ${100 + 2} 58 L100 60 L${100 - 2} 58 Q${
            100 - fw + 2
          } 66 ${100 - fw} 96 Z`,
          `url(#hr${u})`
        ) +
        S("M100 46 L100 60", hD, 0.9, 'opacity=".7"') +
        S(`M${100 - 14} 52 Q${100 - 22} 60 ${100 - fw + 2} 78`, hL, 0.9, 'opacity=".5"');
    }
    if (hair === "curly") {
      hairFront =
        P(
          `${hairline} Q${100 + fw - 4} 64 ${100 + 6} 60 Q100 62 ${100 - 6} 60 Q${
            100 - fw + 4
          } 64 ${100 - fw - 2} 82 Z`,
          `url(#hr${u})`
        ) +
        [
          [-22, 50],
          [-10, 44],
          [4, 44],
          [18, 48],
          [-28, 62],
          [26, 60]
        ]
          .map(
            ([dx, y]) =>
              `<circle cx="${100 + dx}" cy="${y}" r="${f ? 6 : 5.4}" fill="url(#hr${u})"/>`
          )
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
                  }" rx="5" ry="6.4" fill="url(#hr${u})" stroke="${hD}" stroke-width=".6"/>`
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
      P(`M96 30 Q100 8 112 12 Q104 18 104 30 Z`, "#8E2A24") +
      hi(`M${100 - fw - 4} 60 Q${100 - 18} 36 100 34`, 3, 0.35);
  }
  if (hat === "crown") {
    hatSVG =
      P(
        `M${100 - 22} 58 L${100 - 24} 36 L${100 - 12} 48 L100 30 L${100 + 12} 48 L${100 + 24} 36 L${
          100 + 22
        } 58 Z`,
        `url(#gd${u})`
      ) +
      `<rect x="${100 - 23}" y="54" width="46" height="7" rx="2" fill="url(#gd${u})"/>` +
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
          }" cy="109" r="3.4" fill="none" stroke="url(#gd${u})" stroke-width="1.4"/>`
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
          i % 3 === 1 ? "#2D6E7E" : i % 3 === 2 ? "#8E2A24" : `url(#gd${u})`
        }"/>`;
      })
      .join("");
  }
  if (jk === "nose") {
    jewelHead +=
      `<circle cx="${
        100 - 4.6
      }" cy="111" r="2.2" fill="none" stroke="url(#gd${u})" stroke-width="1"/>` +
      [-1, 1]
        .map(s => `<circle cx="${100 + s * (cw + 2)}" cy="108" r="1.6" fill="url(#gd${u})"/>`)
        .join("");
  }

  const vb = opts.vb || (opts.bust ? "46 30 108 108" : "0 0 200 240");
  const d = opts.live ? ` style="--d:${(-Math.random() * 4).toFixed(2)}s"` : "";
  return `<svg class="pt av${opts.live ? " live" : ""}${
    opts.cheer ? " cheer" : ""
  }" viewBox="${vb}" aria-hidden="true"${d}>${defs}
    <g class="pt-body">${hairBack}${coverBack}${neck}${body}${jewelBody}
    <g class="pt-head">${ears}${face}${eyes}${brows}${nose}${beardSVG}${mouth}${hairFront}${coverFront}${hatSVG}${jewelHead}</g></g></svg>`;
}

// Small full-body figure for the map and the road (viewBox 60 x 80, feet at the bottom).
export function figureSVG(look, n, opts = {}) {
  const L = normLook(look, n);
  const f = L.g === "f";
  const skin = SKINS[L.skin];
  const hc = HAIRC[L.hairColor];
  const tunic = UNLOCK.tunic[L.tunic][1];
  const sash = UNLOCK.sash[L.sash][1];
  const [, mantle, accent] = MANTLES[L.g][L.mantle];
  const cover = COVERS[L.g][L.cover][1];
  const item = UNLOCK.item[L.item][1];
  const hat = UNLOCK.hat[L.hat][1];
  const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const td = shade(tunic, -0.3);
  const md = shade(mantle, -0.3);
  let o = `<ellipse cx="30" cy="78" rx="12" ry="2" fill="#000" opacity=".3"/>`;
  if (item === "staff") {
    o += `<rect x="40.5" y="6" width="1.8" height="72" rx=".9" fill="#7A5230"/><path d="M41.4 7 Q41 1 45.5 1.6 Q48.5 2.4 47.6 6" fill="none" stroke="#7A5230" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  if (item === "sword") {
    o += `<rect x="41" y="30" width="1.6" height="18" fill="#D8DEE4"/><rect x="38.6" y="47" width="6.4" height="1.6" rx=".8" fill="#C9A04B"/>`;
  }
  o += `<g class="fg-body">`;
  o += P("M26.5 76 h3 v2 h-4 z", "#3E2A1A") + P("M30.5 76 h3 l1 2 h-4 z", "#3E2A1A");
  o +=
    P(
      f
        ? "M24 24 Q30 21 36 24 L40 50 L43 77 Q30 79 17 77 L20 50 Z"
        : "M23 24 Q30 21 37 24 L40 48 L41 74 Q30 76 19 74 L20 48 Z",
      tunic
    ) +
    P(
      f
        ? "M30 22 L36 24 L40 50 L43 77 Q36 78.4 31 78.6 Z"
        : "M30 22 L37 24 L40 48 L41 74 Q36 75.4 31 75.6 Z",
      td,
      'opacity=".55"'
    );
  if (!f) {
    o += P("M23 75 h7 v2 h-7z M31 75 h7 v2 h-7z", skin, 'opacity=".9"');
  }
  o += `<rect x="${f ? 21 : 21}" y="42" width="18" height="2.6" rx="1" fill="${sash}"/>`;
  if (f) {
    o +=
      P(
        "M23.5 12 Q30 3 36.5 12 L39 28 Q41 42 39 54 L33 50 L30 30 L27 50 L21 54 Q19 42 21 28 Z",
        mantle
      ) + P("M36.5 12 L39 28 Q41 42 39 54 L34 50 Q36 34 33 18 Z", md, 'opacity=".6"');
  } else {
    o +=
      P("M23 24 Q27 22 31 23 L35 48 Q30 52 25 50 L22 36 Z", mantle) +
      P("M31 23 L37 25 L39 46 L35 48 Z", md) +
      (accent
        ? `<path d="M26 23.5 L30 50 M28.5 23 L33 49" stroke="${accent}" stroke-width=".8" opacity=".9"/>`
        : "");
  }
  o += `<rect x="19" y="26" width="3.6" height="20" rx="1.8" fill="${
    f ? mantle : tunic
  }"/><circle cx="20.8" cy="47.5" r="1.8" fill="${skin}"/>`;
  o += `<rect x="37.6" y="26" width="3.6" height="20" rx="1.8" fill="${
    f ? mantle : tunic
  }" transform="rotate(-8 39.4 26)"/><circle cx="41.6" cy="46.6" r="1.8" fill="${skin}"/>`;
  o += `<g class="fg-head">`;
  o += `<rect x="28" y="17" width="4" height="5" fill="${shade(
    skin,
    -0.15
  )}"/><ellipse cx="30" cy="13" rx="4.6" ry="5.6" fill="${skin}"/>`;
  if (!f && L.beard >= 2) {
    o += P(
      "M25.6 13.5 Q26 19.6 30 20.4 Q34 19.6 34.4 13.5 Q32 16.4 30 16.2 Q28 16.4 25.6 13.5 Z",
      hc
    );
  }
  if (f) {
    o +=
      cover === "none"
        ? P(
            "M25 13 Q24.6 6.4 30 6.6 Q35.4 6.4 35 13 L36 24 L34 24 L33.6 11 Q30 9 26.4 11 L26 24 L24 24 Z",
            hc
          )
        : P(
            "M24.4 14 Q24 6 30 5.6 Q36 6 35.6 14 L36.4 20 L34.4 20 L34 12 Q30 9.6 26 12 L25.6 20 L23.6 20 Z",
            mantle
          );
  } else if (cover === "cloth") {
    o +=
      P(
        "M24.6 13 Q24.4 6 30 6 Q35.6 6 35.4 13 L36.4 22 L34.4 21 L34 11.4 Q30 9.6 26 11.4 L25.6 21 L23.6 22 Z",
        "#E4DAC4"
      ) + `<rect x="24.6" y="8.6" width="10.8" height="1.4" rx=".7" fill="#231C17"/>`;
  } else if (cover === "turban") {
    o += `<ellipse cx="30" cy="9" rx="5.8" ry="4" fill="${mantle}"/>`;
  } else {
    o += P("M25.4 12 Q25 6.6 30 6.6 Q35 6.6 34.6 12 Q32 9.4 30 9.6 Q28 9.4 25.4 12 Z", hc);
  }
  if (hat === "crown") {
    o += P("M26.4 7 L26 3 L28.2 5 L30 2 L31.8 5 L34 3 L33.6 7 Z", "#D9AE55");
  }
  if (hat === "helmet") {
    o +=
      P("M24.6 12 Q24.4 5 30 4.8 Q35.6 5 35.4 12 L34 12 Q30 9 26 12 Z", "#8E969E") +
      `<rect x="29.2" y="1.6" width="1.6" height="3.6" fill="#8E2A24"/>`;
  }
  if (hat === "laurel") {
    o += `<path d="M25.4 9.6 Q30 6.4 34.6 9.6" fill="none" stroke="#6E8A3E" stroke-width="1.6" stroke-dasharray="1.4 .6"/>`;
  }
  o += `</g>`;
  if (item === "scroll") {
    o += `<rect x="40" y="43" width="4" height="6" rx=".8" fill="#E9DAB6"/><rect x="39.6" y="42.4" width="4.8" height="1.2" rx=".6" fill="#9C7A45"/><rect x="39.6" y="48.4" width="4.8" height="1.2" rx=".6" fill="#9C7A45"/>`;
  }
  if (item === "sling") {
    o += `<path d="M41.6 48 Q43 54 41 58" fill="none" stroke="#6B4A2A" stroke-width=".8"/><circle cx="41" cy="58.6" r="1.3" fill="#8F8F8F"/>`;
  }
  if (item === "shofar") {
    o += P("M40 46 Q46 46 47.6 40 Q48.4 38 49.6 38.6 Q48.4 47 41 48.4 Z", "#E1CC9C");
  }
  if (item === "lamp") {
    o += `<ellipse cx="42.6" cy="48.6" rx="3.4" ry="1.6" fill="#B87333"/><path class="flame" d="M45.6 46.6 Q44.4 44.6 45.6 42.4 Q46.8 44.6 45.6 46.6 Z" fill="#FFB52E"/>`;
  }
  if (item === "shield") {
    o +=
      P("M14 30 Q20.6 27 26 30 L25.4 39 Q24 44 20 46 Q16 44 14.6 39 Z", "#B8892B") +
      `<rect x="19.2" y="31" width="1.6" height="12" fill="#F1E7CC"/><rect x="16" y="35" width="8" height="1.6" fill="#F1E7CC"/>`;
  }
  o += `</g>`;
  const d = opts.live ? ` style="--d:${(-Math.random() * 4).toFixed(2)}s"` : "";
  return `<svg class="fg av${opts.live ? " live" : ""}${
    opts.cheer ? " cheer" : ""
  }" viewBox="0 0 60 80" aria-hidden="true"${d}>${o}</svg>`;
}
