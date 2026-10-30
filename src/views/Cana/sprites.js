import { Texture } from "pixi.js";
import { fullSVG, POSES } from "@/lib/full.js";
import { ITEM } from "@/lib/cana/cast.js";

// Each character is drawn once per pose from the same vector figure the rest of the app uses, then handed to the
// scene as a small picture. The drawing is a little wider than the figure so a raised arm is not cut off.
const VB = "-70 -70 340 470";
const VB_W = 340;
const VB_H = 470;
// one drawing unit is this many hall units, so a character stands about 76 units tall
export const UNIT = 0.19;
export const FIG = {
  w: VB_W * UNIT,
  h: VB_H * UNIT,
  // the feet are at the bottom of the figure, 70 units below the top margin
  anchorX: 0.5,
  anchorY: (400 + 70 - 4) / VB_H
};

export const BASIC = ["idle", "wave", "wave2", "up", "up2"];
export const CARRYING = [...BASIC, "jar", "cup"];

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
