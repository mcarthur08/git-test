import { Texture } from "pixi.js";
import { fullSVG, POSES } from "@/lib/full.js";
import { ITEM } from "@/lib/cana/cast.js";
import { VB_W, VB_H, UNIT, FIG, BASIC, CARRYING } from "@/lib/cana/budget.js";

export { UNIT, FIG, BASIC, CARRYING };

// Each character is drawn once per pose from the same vector figure the rest of the app uses, then handed to the
// scene as a small picture. The drawing is a little wider than the figure so a raised arm is not cut off.
const VB = `-70 -70 ${VB_W} ${VB_H}`;
function look(char, variant) {
  if (variant === "jar") {
    return { ...char.look, item: ITEM.jar };
  }
  if (variant === "cup") {
    return { ...char.look, item: ITEM.cup };
  }
  return char.look;
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
export async function drawCharacter(char, variants, density) {
  const w = Math.round(FIG.w * density);
  const h = Math.round(FIG.h * density);
  // a player at Cana has read at least this far, so whatever they hold on the map is unlocked
  const n = Math.max(char.n, 24);
  const entries = await Promise.all(
    variants.map(async v => {
      const svg = fullSVG(look(char, v), n, POSES[v] ? { pose: v, vb: VB } : { vb: VB });
      return [v, await raster(svg, w, h)];
    })
  );
  return Object.fromEntries(entries);
}
