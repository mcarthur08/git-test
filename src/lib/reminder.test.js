import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  reminderPlan,
  googleCalendarURL,
  downloadICS,
  APP_URL,
  REM_TITLE,
  REM_TEXT
} from "./reminder.js";
import { DAYS } from "./data.js";

// "Now" is Friday 30 Oct 2026, 12:00 local time.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 30, 12));
});
afterEach(() => vi.useRealTimers());

describe("reminderPlan", () => {
  it("starts tomorrow when today's time has already passed", () => {
    const r = reminderPlan("07:00", { start: "" });
    expect(r.start).toBe("20261031T070000");
    expect(r.end).toBe("20261031T071500");
  });

  it("starts today when the time is still ahead", () => {
    const r = reminderPlan("18:30", { start: "" });
    expect(r.start).toBe("20261030T183000");
    expect(r.end).toBe("20261030T184500");
  });

  it("lasts 15 minutes, even across midnight", () => {
    const r = reminderPlan("23:50", { start: "" });
    expect(r.start).toBe("20261030T235000");
    expect(r.end).toBe("20261031T000500");
  });

  it("repeats for 70 days when there is no start date", () => {
    expect(reminderPlan("18:00", { start: "" }).count).toBe(DAYS);
  });

  it("begins on the start date when it is in the future, and runs the full 70 days", () => {
    const r = reminderPlan("07:00", { start: "2026-11-05" });
    expect(r.start).toBe("20261105T070000");
    expect(r.count).toBe(DAYS);
  });

  it("only schedules the days still ahead when the plan is under way", () => {
    // Day 1 was 22 Oct, so day 70 is 30 Dec. From 31 Oct to 30 Dec is 61 days.
    expect(reminderPlan("07:00", { start: "2026-10-22" }).count).toBe(61);
    // Today's time is still ahead, so today counts too.
    expect(reminderPlan("18:00", { start: "2026-10-22" }).count).toBe(62);
  });

  it("never schedules fewer than one day", () => {
    expect(reminderPlan("07:00", { start: "2025-01-01" }).count).toBe(1);
  });

  it("falls back to 07:00 when no time is given", () => {
    expect(reminderPlan("", { start: "" })).toMatchObject({ time: "07:00" });
    expect(reminderPlan(undefined, { start: "" })).toMatchObject({ time: "07:00" });
  });

  it("falls back to zero for unreadable minutes or hours", () => {
    expect(reminderPlan("7", { start: "" }).time).toBe("07:00");
    expect(reminderPlan("xx:yy", { start: "" }).time).toBe("00:00");
  });

  it("pads the time and gives a readable label", () => {
    const r = reminderPlan("07:05", { start: "" });
    expect(r.time).toBe("07:05");
    expect(r.label).toMatch(/7:05/);
  });

  it("treats a time that is exactly now as still ahead", () => {
    expect(reminderPlan("12:00", { start: "" }).start).toBe("20261030T120000");
  });
});

describe("googleCalendarURL", () => {
  let url;
  beforeEach(() => {
    url = new URL(googleCalendarURL(reminderPlan("07:00", { start: "" })));
  });

  it("points at Google Calendar's event template", () => {
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("carries the title, details, dates and daily repeat", () => {
    expect(url.searchParams.get("text")).toBe(REM_TITLE);
    expect(url.searchParams.get("details")).toBe(REM_TEXT);
    expect(url.searchParams.get("dates")).toBe("20261031T070000/20261031T071500");
    expect(url.searchParams.get("recur")).toBe(`RRULE:FREQ=DAILY;COUNT=${DAYS}`);
  });

  it("sets the time zone", () => {
    expect(url.searchParams.get("ctz")).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});

describe("downloadICS", () => {
  let blob;
  let clicked;

  beforeEach(() => {
    document.body.innerHTML = "";
    blob = null;
    clicked = null;
    URL.createObjectURL = b => {
      blob = b;
      return "blob:test";
    };
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      clicked = { href: this.href, download: this.download };
    });
  });

  afterEach(() => vi.restoreAllMocks());

  const readBlob = b =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(b);
    });

  const ics = async () => {
    downloadICS(reminderPlan("07:00", { start: "" }));
    vi.useRealTimers();
    return readBlob(blob);
  };

  it("downloads a .ics file", async () => {
    await ics();
    expect(clicked).toEqual({ href: "blob:test", download: "nt70-daily-reminder.ics" });
    expect(blob.type).toBe("text/calendar");
  });

  it("writes a daily repeating event with an alarm, using CRLF line breaks", async () => {
    const text = await ics();
    const lines = text.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines[lines.length - 1]).toBe("END:VCALENDAR");
    expect(lines).toContain("DTSTART:20261031T070000");
    expect(lines).toContain("DTEND:20261031T071500");
    expect(lines).toContain(`RRULE:FREQ=DAILY;COUNT=${DAYS}`);
    expect(lines).toContain(`SUMMARY:${REM_TITLE}`);
    expect(lines).toContain(`URL:${APP_URL}`);
    expect(lines).toContain("BEGIN:VALARM");
    expect(text).not.toMatch(/(?<!\r)\n/);
  });

  it("stamps the file with a UTC time", async () => {
    const text = await ics();
    expect(text).toMatch(/\r\nDTSTAMP:\d{8}T\d{6}Z\r\n/);
  });

  it("removes the temporary link and frees the blob afterwards", async () => {
    downloadICS(reminderPlan("07:00", { start: "" }));
    expect(document.querySelectorAll("a[download]")).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(document.querySelectorAll("a[download]")).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  // The ICS spec requires a comma inside a text value to be written as "\,"; the description has one.
  it("escapes commas in the description", async () => {
    const text = await ics();
    const desc = text.split("\r\n").find(l => l.startsWith("DESCRIPTION:About"));
    expect(desc).not.toMatch(/[^\\],/);
  });
});
