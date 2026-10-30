// The small full-body figure and the cached avatar entry point, drawn as SVG strings (rendered with <Avatar>).
import { UNLOCK, SKINS, HAIRC, COVERS, MANTLES } from "./data.js";
import { shade } from "./util.js";
import { normLook, mixHex } from "./look.js";
import { portraitSVG } from "./portrait.js";
import { fullSVG } from "./full.js";

export { normLook, mixHex, portraitSVG, fullSVG };

// opts.full draws the large full-body character; opts.portrait / opts.bust / opts.vb draw the head-and-shoulders
// portrait; otherwise the small figure for the map and the road.
// Still (non-animated) avatars are cached by look, so re-renders don't rebuild every portrait.
const AV_CACHE = new Map();
export function avatarSVG(look, n, opts = {}) {
  const draw = () =>
    opts.full
      ? fullSVG(look, n, opts)
      : opts.portrait || opts.bust || opts.vb
      ? portraitSVG(look, n, opts)
      : figureSVG(look, n, opts);
  if (opts.live || opts.cheer) {
    return draw();
  }
  const key = JSON.stringify([
    normLook(look, n),
    opts.full ? 1 : 0,
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
  // The head is drawn a little larger than life, scaled in an inner group so the outer one can still animate.
  o += `<g class="fg-head"><g transform="translate(30 20) scale(1.15) translate(-30 -20)">`;
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
  o += `</g></g>`;
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
  if (item === "harp") {
    o += `<path d="M40 40 Q38.6 46 41.6 49 M47 40 Q48.4 46 45.4 49 M39 40 L48 40" fill="none" stroke="#8A5E34" stroke-width="1"/><path d="M41.6 44 Q41.6 50 43.5 50 Q45.4 50 45.4 44 Z" fill="#A8743C"/>`;
  }
  if (item === "hammer") {
    o += `<rect x="42.6" y="38" width="1.4" height="12" fill="#8A5E34"/><rect x="39.8" y="36.6" width="6.8" height="3.4" rx=".6" fill="#8F9AA3"/>`;
  }
  if (item === "spear") {
    o += `<rect x="41.4" y="6" width="1.2" height="72" fill="#8A5E34"/><path d="M42 0 Q44.6 4 43 8 L41 8 Q39.4 4 42 0 Z" fill="#D8DEE4"/>`;
  }
  if (item === "net") {
    o += `<path d="M41.4 47 L38.6 56 Q42.5 58 46.4 56 L43.6 47 Z" fill="#D9C9A0" stroke="#6E5A36" stroke-width=".5"/>`;
  }
  if (item === "cloth") {
    o += `<rect x="39.6" y="42" width="5.6" height="7" rx=".8" fill="#4A3A2E"/>`;
  }
  if (item === "saw") {
    o += `<rect x="41.6" y="37" width="2.6" height="12" fill="#B8C0C8"/><rect x="41" y="47" width="3.6" height="3" fill="#8A5E34"/>`;
  }
  if (item === "sickle") {
    o += `<rect x="42.6" y="42" width="1.2" height="8" fill="#8A5E34"/><path d="M43 42 Q44 37 48 37 Q45 39 44.6 42 Z" fill="#B8C0C8"/>`;
  }
  if (item === "purse") {
    o += `<path d="M41 48 Q39 52 41 54 Q43 55 45 54 Q47 52 44.6 48 Z" fill="#8A5E34"/><circle cx="43" cy="52" r="1.1" fill="#E2B24E"/>`;
  }
  if (item === "censer") {
    o += `<path d="M42.6 48 L43 54" stroke="#C9A04B" stroke-width=".5"/><path d="M40.8 54 Q40.8 58 43 58 Q45.2 58 45.2 54 Z" fill="#C9A04B"/>`;
  }
  if (item === "timbrel") {
    o += `<circle cx="43" cy="42" r="4" fill="#E9DAB6" stroke="#8A5E34" stroke-width="1"/>`;
  }
  if (item === "infant") {
    o += `<path d="M40 49 Q39 43 43 42 Q47 43 46 49 Z" fill="#EDE4CE"/>`;
  }
  if (item === "basin") {
    o += `<path d="M39.6 47 Q40 51 43 51 Q46 51 46.4 47 Z" fill="#A8743C"/>`;
  }
  if (item === "jar") {
    o += `<path d="M41.4 42 Q39 46 40.8 50 Q43 52 45.2 50 Q47 46 44.6 42 Z" fill="#B5683A"/>`;
  }
  if (item === "scales") {
    o += `<path d="M43 36 V48 M39 39 H47" stroke="#C9A04B" stroke-width=".8"/>`;
  }
  if (item === "spindle") {
    o += `<path d="M42.6 49 L44 38" stroke="#8A5E34" stroke-width=".8"/><circle cx="44" cy="37" r="1.8" fill="#EDE4CE"/>`;
  }
  if (item === "sheaf") {
    o += `<path d="M42 49 L40 39 M43 49 L43 38 M44 49 L46 39" stroke="#D8B04A" stroke-width=".9"/>`;
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
