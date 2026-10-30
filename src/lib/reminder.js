// Daily reminder: a repeating 15-minute calendar event through Day 70.
import { DAYS } from "./data.js";
import { iso, pad, parseISO, daysBetween } from "./util.js";
import { dayDate } from "./player.js";

export const APP_URL = "https://nt70-quest.web.app";
export const REM_TITLE = "NT70 Quest: today's reading";
export const REM_TEXT = `About 4 chapters (15–20 minutes). Read, then check it off: ${APP_URL}`;

export function reminderPlan(timeValue, config) {
  const tm = (timeValue || "07:00").split(":").map(Number);
  const h = tm[0] || 0;
  const m = tm[1] || 0;
  const start = parseISO(config.start);
  const now = new Date();
  const from = start && start > now ? start : now;
  const at = new Date(from.getFullYear(), from.getMonth(), from.getDate(), h, m);
  if (at < now) {
    at.setDate(at.getDate() + 1);
  } // today's time already passed: start tomorrow
  // one event a day through Day 70 (or 70 days when there's no start date yet)
  const count = start ? Math.max(1, daysBetween(at, dayDate(start, DAYS)) + 1) : DAYS;
  const stamp = d => `${iso(d).replace(/-/g, "")}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  return {
    start: stamp(at),
    end: stamp(new Date(at.getTime() + 15 * 60000)),
    count,
    time: `${pad(h)}:${pad(m)}`,
    label: at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  };
}

export function googleCalendarURL(r) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: REM_TITLE,
    details: REM_TEXT,
    dates: `${r.start}/${r.end}`,
    recur: `RRULE:FREQ=DAILY;COUNT=${r.count}`
  });
  try {
    q.set("ctz", Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {}
  return "https://calendar.google.com/calendar/render?" + q;
}

export function downloadICS(r) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NT70 Quest//Reminder//EN",
    "BEGIN:VEVENT",
    `UID:nt70-${Date.now()}@nt70-quest.web.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${r.start}`,
    `DTEND:${r.end}`,
    `RRULE:FREQ=DAILY;COUNT=${r.count}`,
    `SUMMARY:${REM_TITLE}`,
    `DESCRIPTION:${REM_TEXT.replace(/[\\;,]/g, "\\$&")}`,
    `URL:${APP_URL}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${REM_TITLE}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "nt70-daily-reminder.ics";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}
