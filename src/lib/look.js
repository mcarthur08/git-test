// A character's look: normalising what is stored (and locking unearned items) and mixing colours.
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
  allowedFor
} from "./data.js";

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
    jewel: g === "f" ? pick(l.jewel, JEWELS) : 0,
    hem: l.hem === 1 ? 1 : 0
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
