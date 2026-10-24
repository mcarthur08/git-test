// What's new, the first-run guide and the daily reminder.
import { getState } from "@/store.js";
import { RELEASES, GUIDE } from "@/lib/data.js";
import { lsGet, lsSet } from "@/lib/util.js";
import { stats } from "@/lib/player.js";
import { reminderPlan, googleCalendarURL, downloadICS } from "@/lib/reminder.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { toast, queueReveal } from "./ui.js";
import { setTab } from "./navigation.js";

export const liveRelease = () =>
  RELEASES.find(r => new Date(r.from) <= new Date()) || RELEASES[RELEASES.length - 1];
const releaseItems = r => r.items.map(([ic, title, sub]) => ({ ic, title, sub }));
// One release, or every release someone missed (newest first) with a heading for each version
export function showRelease(rs) {
  rs = [].concat(rs);
  const r = rs[0];
  const many = rs.length > 1;
  queueReveal({
    kicker: many
      ? `What's new · Versions ${rs[rs.length - 1].v} to ${r.v}`
      : `What's new · Version ${r.v}`,
    title: many ? "Here's what you missed" : r.title,
    art: (
      <div className="wn-art">
        <Icon k="star" />
      </div>
    ),
    list: many
      ? rs.flatMap(x => [{ ver: `Version ${x.v} · ${x.title}` }, ...releaseItems(x)])
      : releaseItems(r)
  });
}

export function checkWhatsNew() {
  const s = getState();
  if (s.phase !== "ready" || !s.me) {
    return;
  }
  const r = liveRelease();
  const seen = lsGet("nt70.seen");
  if (seen === r.v) {
    return;
  }
  lsSet("nt70.seen", r.v);
  // Everything live and newer than what this device last showed. The launch never pops up, and on
  // a first visit only releases that came out after the person joined count.
  const live = RELEASES.slice(RELEASES.indexOf(r), -1);
  const seenAt = RELEASES.findIndex(x => x.v === seen);
  const joined = new Date(s.me.createdAt || 0);
  const j = isNaN(joined) ? 0 : joined;
  const missed =
    seenAt >= 0
      ? live.filter(x => RELEASES.indexOf(x) < seenAt)
      : live.filter(x => new Date(x.from) > j);
  if (missed.length) {
    showRelease(missed);
  }
}

export function guideReveal() {
  return {
    kicker: "How it works",
    title: "Five things to know",
    art: (
      <div className="wn-art">
        <span className="wn-q">?</span>
      </div>
    ),
    list: GUIDE.map(([ic, title, sub]) => ({ ic, title, sub, html: true })),
    action: "Set a daily reminder",
    onAct: () => setTab("help")
  };
}

export function checkGuide() {
  const s = getState();
  if (s.phase !== "ready" || !s.me || lsGet("nt70.guide")) {
    return;
  }
  lsSet("nt70.guide", 1);
  // Players who were here before the guide existed already know their way around
  const added = RELEASES.find(r => r.v === "1.2");
  if (
    stats(s.me).n >= 3 ||
    (added && s.me.createdAt && new Date(s.me.createdAt) < new Date(added.from))
  ) {
    return;
  }
  queueReveal(guideReveal());
}

export function addReminder(kind, timeValue) {
  const r = reminderPlan(timeValue, getState().config);
  if (kind === "google") {
    window.open(googleCalendarURL(r), "_blank", "noopener");
  } else {
    downloadICS(r);
  }
  lsSet("nt70.remind", r.time);
  toast(`Daily reminder set for ${r.label} through Day 70`);
  return r.time;
}
