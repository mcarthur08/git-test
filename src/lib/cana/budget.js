// How much the scene may use. A phone has far less memory to spare than a desktop, and a page that uses too much is
// closed by the browser ("a problem occurred"), so the pictures and the drawing surface are sized to what the screen
// really shows, and no bigger. These are only the numbers; the drawing is in views/Cana.

// Each character is drawn from the figure on a canvas a little wider than the figure, so a raised arm is not cut off.
export const VB_W = 340;
export const VB_H = 470;
// one drawing unit is this many hall units, so a character stands about 76 units tall
export const UNIT = 0.19;
export const FIG = {
  w: VB_W * UNIT,
  h: VB_H * UNIT,
  // the feet are at the bottom of the figure, 70 units below the top margin
  anchorX: 0.5,
  anchorY: (400 + 70 - 4) / VB_H
};

// The poses each kind of person is drawn in. A wave moves between "wave" and standing, and a dance between "up" and
// "up2", so these are all that is needed. Only the servants and you hold a jar or a cup.
export const BASIC = ["idle", "wave", "up", "up2"];
export const CARRYING = [...BASIC, "jar", "cup"];

// The most pixels the drawing surface may have (width x height x resolution squared): about a phone screen at twice the
// pixels, and a tablet or a big window is scaled down to this rather than drawn in full.
export const MAX_PIXELS = 2.5e6;

// The sharpness of the drawing surface: that of the screen, up to double, and lower if the box is big.
export const resolutionFor = (dpr, w, h) =>
  Math.max(1, Math.min(dpr || 1, 2, Math.sqrt(MAX_PIXELS / Math.max(1, w * h))));

// Pixels per hall unit for the character pictures: what is needed to look sharp at the size they are shown, no more.
// `scale` is how big a hall unit is on the screen.
export const densityFor = (resolution, scale) =>
  Math.max(1, Math.min(2.4, resolution * Math.max(0.8, scale)));

// About how many bytes the character pictures take (each is four bytes a pixel, held once for drawing and once more
// for the browser): a guide for the budget, not a measurement.
export function textureBytes(kinds, density) {
  const w = Math.round(FIG.w * density);
  const h = Math.round(FIG.h * density);
  const pictures = kinds.reduce(
    (n, k) => n + (k === "carrying" ? CARRYING.length : k === "musician" ? 3 : BASIC.length),
    0
  );
  return pictures * w * h * 4 * 2;
}
