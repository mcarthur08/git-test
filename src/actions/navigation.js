// Switching tabs, opening the reader and map stops, and the reader's text size and page colour.
import { getState, setState } from "@/store.js";
import { TABS, RD_SIZES } from "@/lib/data.js";
import { lsSet } from "@/lib/util.js";
import { draftFrom } from "@/lib/player.js";

export function setTab(t) {
  const s = getState();
  if (!TABS.some(([k]) => k === t) || (t === "leader" && !s.canLead)) {
    t = "today";
  }
  const patch = { tab: t, confirmRemove: null };
  if (t === "me" && s.me) {
    patch.draft = draftFrom(s.me);
  }
  setState(patch);
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

// jump: { ci, v } scrolls to that verse once the text is on screen (Continue reading).
export function openReader(day, from, jump) {
  const s = getState();
  setState({ readDay: day, readFrom: from || s.tab, readJump: jump || null });
  if (s.tab === "read") {
    window.scrollTo({ top: 0 });
  } else {
    setTab("read");
  }
}

export function selectStop(i) {
  setState({ stop: i });
  setTimeout(() => {
    const c = document.getElementById("stopcard");
    if (c && innerWidth <= 720) {
      c.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, 0);
}

export function setReaderPrefs({ size, light }) {
  const s = getState();
  const next = { rdSize: size ?? s.rdSize, rdLight: light ?? s.rdLight };
  setState(next);
  lsSet("nt70.rd", { size: next.rdSize, light: next.rdLight });
}

export const changeReaderSize = d =>
  setReaderPrefs({ size: Math.max(0, Math.min(RD_SIZES.length - 1, getState().rdSize + d)) });
export const toggleReaderLight = () => setReaderPrefs({ light: !getState().rdLight });
