// Helpers shared across the app: dates, localStorage, colour math, quadratic curves.

export const pad = n => String(n).padStart(2, "0");
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  const d = m && new Date(+m[1], +m[2] - 1, +m[3]);
  // Date rolls 31 Feb over to March, so a real date must come back out the way it went in.
  return d && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
};
export const daysBetween = (a, b) =>
  Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      864e5
  );
export const todayISO = () => iso(new Date());
export const fmtDate = d =>
  d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
export const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
export const lsGet = k => {
  try {
    return JSON.parse(localStorage.getItem(k) || "null");
  } catch {
    return null;
  }
};
export const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
export const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255];
  return (
    "#" +
    ch
      .map(v =>
        Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
};
export const readingURL = (label, v) =>
  `https://www.biblegateway.com/passage/?search=${encodeURIComponent(
    label
  )}&version=${encodeURIComponent(v)}`;
export const qpt = (a, c, b, t) => ({
  x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y
});
export const cleanName = v =>
  String(v || "")
    .replace(/[^\p{L}\p{M}' .-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
