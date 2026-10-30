import { describe, it, expect } from "vitest";
import {
  BOOKS,
  CHAPTERS,
  TOTAL,
  DAYS,
  PLAN,
  groupChapters,
  fmtLong,
  fmtShort,
  VICTORIES,
  UNLOCK,
  allowedFor,
  NAMES_M,
  NAMES_F,
  PLACES,
  DEFAULT_TEAMS,
  TEAM_COLORS,
  TEAM_ICONS,
  TEAM_VERSES,
  DEFAULT_CONFIG,
  TABS,
  NAV_TABS,
  STOPS
} from "./data.js";
import { parseISO } from "./util.js";

describe("chapters", () => {
  it("covers the 27 books and 260 chapters of the New Testament", () => {
    expect(BOOKS).toHaveLength(27);
    expect(TOTAL).toBe(260);
    expect(CHAPTERS).toHaveLength(260);
  });

  it("numbers each book's chapters from 1", () => {
    BOOKS.forEach(([b, n]) => {
      const cs = CHAPTERS.filter(c => c.b === b).map(c => c.c);
      expect(cs).toEqual(Array.from({ length: n }, (_, i) => i + 1));
    });
  });

  it("flags only the one-chapter books", () => {
    const one = [...new Set(CHAPTERS.filter(c => c.one).map(c => c.b))];
    expect(one).toEqual(["Philemon", "2 John", "3 John", "Jude"]);
  });
});

describe("groupChapters / fmtLong / fmtShort", () => {
  const slice = (b, a, z) => CHAPTERS.filter(c => c.b === b && c.c >= a && c.c <= z);

  it("groups consecutive chapters of a book into one range", () => {
    expect(groupChapters(slice("John", 3, 6))).toEqual([
      { b: "John", ab: "Jn", a: 3, z: 6, one: false }
    ]);
  });

  it("starts a new group at a book boundary", () => {
    const g = groupChapters([...slice("Mark", 15, 16), ...slice("Luke", 1, 1)]);
    expect(g.map(x => [x.b, x.a, x.z])).toEqual([
      ["Mark", 15, 16],
      ["Luke", 1, 1]
    ]);
  });

  it("formats ranges, single chapters and one-chapter books", () => {
    expect(fmtLong(groupChapters(slice("John", 3, 6)))).toBe("John 3–6");
    expect(fmtLong(groupChapters(slice("John", 3, 3)))).toBe("John 3");
    expect(fmtLong(groupChapters(slice("Jude", 1, 1)))).toBe("Jude");
    expect(fmtLong(groupChapters([...slice("3 John", 1, 1), ...slice("Jude", 1, 1)]))).toBe(
      "3 John; Jude"
    );
    expect(fmtShort(groupChapters(slice("1 Corinthians", 2, 4)))).toBe("1Co 2–4");
    expect(fmtShort(groupChapters([...slice("Mark", 16, 16), ...slice("Luke", 1, 2)]))).toBe(
      "Mk 16, Lk 1–2"
    );
  });
});

describe("reading plan", () => {
  it("has one entry per day, numbered from 1", () => {
    expect(DAYS).toBe(70);
    expect(PLAN).toHaveLength(DAYS);
    PLAN.forEach((d, i) => expect(d.day).toBe(i + 1));
  });

  it("hands out every chapter exactly once, in order", () => {
    expect(PLAN[0].from).toBe(0);
    expect(PLAN[DAYS - 1].to).toBe(TOTAL);
    PLAN.forEach((d, i) => {
      if (i > 0) {
        expect(d.from).toBe(PLAN[i - 1].to);
      }
      expect(d.count).toBe(d.to - d.from);
    });
    expect(PLAN.reduce((s, d) => s + d.count, 0)).toBe(TOTAL);
  });

  it("gives every day three to four chapters", () => {
    PLAN.forEach(d => {
      expect(d.count).toBeGreaterThanOrEqual(3);
      expect(d.count).toBeLessThanOrEqual(4);
    });
  });

  it("labels each day and takes its section from the first chapter", () => {
    PLAN.forEach(d => {
      expect(d.label).toBeTruthy();
      expect(d.short).toBeTruthy();
      expect(d.sec).toBe(CHAPTERS[d.from].s);
    });
    expect(PLAN[0].label).toBe("Matthew 1–4");
    expect(PLAN[DAYS - 1].label).toMatch(/Revelation/);
  });
});

describe("victories", () => {
  it("has one a week, in order, within the plan", () => {
    expect(VICTORIES.length).toBeGreaterThan(0);
    VICTORIES.forEach((v, i) => {
      expect(v.day).toBeGreaterThanOrEqual(1);
      expect(v.day).toBeLessThanOrEqual(DAYS);
      expect(v.title).toBeTruthy();
      expect(v.ref).toBeTruthy();
      if (i > 0) {
        expect(v.day).toBeGreaterThan(VICTORIES[i - 1].day);
      }
    });
    expect(new Set(VICTORIES.map(v => v.day)).size).toBe(VICTORIES.length);
  });
});

describe("unlockable avatar items", () => {
  it.each(Object.keys(UNLOCK))("%s: valid entries, and something is free for everyone", key => {
    UNLOCK[key].forEach(([label, value, days, who]) => {
      expect(label).toBeTruthy();
      expect(value).toBeTruthy();
      expect(Number.isInteger(days)).toBe(true);
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(DAYS);
      expect(["", "m", "f"]).toContain(who);
    });
    ["m", "f"].forEach(g => {
      expect(allowedFor(key, g).some(([e]) => e[2] === 0)).toBe(true);
    });
  });

  it("filters by gender but keeps each entry's original index", () => {
    allowedFor("tunic", "f").forEach(([e, i]) => {
      expect(UNLOCK.tunic[i]).toBe(e);
      expect(e[3]).not.toBe("m");
    });
    allowedFor("tunic", "m").forEach(([e]) => expect(e[3]).not.toBe("f"));
  });

  it("starts the first entry of every list at day 0 so index 0 is always usable", () => {
    Object.values(UNLOCK).forEach(list => expect(list[0][2]).toBe(0));
  });
});

describe("names, places and teams", () => {
  it("has no repeated first names", () => {
    const all = [...NAMES_M, ...NAMES_F];
    expect(new Set(all).size).toBe(all.length);
  });

  it("offers a blank place first and no place twice", () => {
    expect(PLACES[0]).toBe("");
    expect(new Set(PLACES).size).toBe(PLACES.length);
    PLACES.slice(1).forEach(p => expect(p).toMatch(/^of \w+$/));
  });

  it("has four tribes, each with a colour, icon and verse", () => {
    expect(DEFAULT_TEAMS).toHaveLength(4);
    expect(new Set(DEFAULT_TEAMS).size).toBe(4);
    expect(TEAM_COLORS).toHaveLength(4);
    expect(TEAM_ICONS).toHaveLength(4);
    expect(TEAM_VERSES).toHaveLength(4);
  });

  it("ships a default start date that is a real date", () => {
    expect(parseISO(DEFAULT_CONFIG.start)).not.toBeNull();
  });
});

describe("tabs", () => {
  it("lists every bottom-bar tab among all tabs, without repeats", () => {
    const ids = TABS.map(t => t[0]);
    expect(new Set(ids).size).toBe(ids.length);
    NAV_TABS.forEach(t => expect(ids).toContain(t));
  });
});

describe("journey stops", () => {
  it("runs from day 0 to day 70 in increasing order", () => {
    expect(STOPS[0].day).toBe(0);
    expect(STOPS[STOPS.length - 1].day).toBe(DAYS);
    STOPS.forEach((s, i) => {
      if (i > 0) {
        expect(s.day).toBeGreaterThan(STOPS[i - 1].day);
      }
    });
  });

  it("keeps every stop on the 360 x 560 map", () => {
    STOPS.forEach(s => {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(360);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(560);
    });
  });

  it("gives every stop its text", () => {
    STOPS.forEach(s => {
      ["place", "title", "ref", "text", "verse", "verseRef"].forEach(k =>
        expect(s[k], `${s.place} ${k}`).toBeTruthy()
      );
      expect(["start", "middle", "end", "none"]).toContain(s.la);
    });
  });
});
