// Light ("Desert morning") is the default look; the original dark theme is a choice under Me.
// The choice is kept per device and applied before the app draws, so the page never flashes.
import { lsGet, lsSet } from "./util.js";

export const THEMES = ["light", "dark"];
const BAR = { light: "#fbf7f0", dark: "#120e0b" };

export const currentTheme = () => {
  const t = lsGet("nt70.theme");
  return THEMES.includes(t) ? t : "light";
};

export function applyTheme(t = currentTheme()) {
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", BAR[t]);
  }
}

export function setTheme(t) {
  if (THEMES.includes(t)) {
    lsSet("nt70.theme", t);
    applyTheme(t);
  }
}
