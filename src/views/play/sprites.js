import { Texture } from "pixi.js";
import { fullSVG, POSES } from "@/lib/full.js";
import { VB_W, VB_H, UNIT, FIG, BASIC, CARRYING } from "@/lib/cana/budget.js";

export { UNIT, FIG, BASIC, CARRYING };

// Each character is drawn once per pose from the same vector figure the rest of the app uses, then handed to the
// scene as a small picture. The drawing is a little wider than the figure so a raised arm is not cut off.
const VB = `-70 -70 ${VB_W} ${VB_H}`;
// `held` says which item each pose that holds something has: { jar: 20, cup: 28 }. Any other pose is bare-handed.
function look(char, variant, held) {
  return held[variant] === undefined ? char.look : { ...char.look, item: held[variant] };
}

async function raster(svg, w, h) {
  const markup = svg.replace(
    "<svg ",
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `
  );
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return Texture.from(canvas);
}

// Draws a character in each of the given poses. `density` is how many pixels per hall unit the picture needs.
export async function drawCharacter(char, variants, density, held = {}) {
  const w = Math.round(FIG.w * density);
  const h = Math.round(FIG.h * density);
  // everything is unlocked for the picture, so a pose that holds an item always shows it (whoever is playing)
  const n = 70;
  const entries = await Promise.all(
    variants.map(async v => {
      const svg = fullSVG(look(char, v, held), n, POSES[v] ? { pose: v, vb: VB } : { vb: VB });
      return [v, await raster(svg, w, h)];
    })
  );
  return Object.fromEntries(entries);
}
