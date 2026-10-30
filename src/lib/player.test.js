import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  quizScore,
  fmtQuiz,
  quizPerfect,
  normPlayer,
  stats,
  through,
  BADGES,
  normConfig,
  dayDate,
  planDay,
  allPlayers,
  teamIndex,
  nextUndone,
  draftName,
  aliasOf,
  takenAliases,
  startHint,
  draftFrom,
  newDraftFor
} from "./player.js";
import { normLook } from "./avatar.js";
import { iso } from "./util.js";
import { DAYS, PLAN, DEFAULT_TEAMS, DEFAULT_CONFIG, NAMES_M, NAMES_F, PLACES } from "./data.js";

// "Today" is Friday 30 Oct 2026, midday.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 30, 12));
});
afterEach(() => vi.useRealTimers());

const player = (done = {}, extra = {}) => ({ id: "p1", alias: "Boaz", done, quiz: {}, ...extra });

describe("quiz scores", () => {
  it("reads whole numbers 0-5 as the original 5-question quiz", () => {
    expect(quizScore(3)).toEqual({ got: 3, of: 5 });
    expect(quizScore(0)).toEqual({ got: 0, of: 5 });
    expect(quizScore(5)).toEqual({ got: 5, of: 5 });
  });

  it("reads 'got/of' text from later quizzes", () => {
    expect(quizScore("6/7")).toEqual({ got: 6, of: 7 });
    expect(quizScore("0/7")).toEqual({ got: 0, of: 7 });
  });

  it("rejects anything else", () => {
    [6, -1, 3.5, "abc", "8/7", "1/0", "0/0", "1/2/3", "123/4", null, undefined, {}, NaN].forEach(
      v => expect(quizScore(v)).toBeNull()
    );
  });

  it("formats scores and blanks invalid ones", () => {
    expect(fmtQuiz(3)).toBe("3/5");
    expect(fmtQuiz("6/7")).toBe("6/7");
    expect(fmtQuiz("nope")).toBe("");
  });

  it("only calls a full score perfect", () => {
    expect(quizPerfect(5)).toBe(true);
    expect(quizPerfect("7/7")).toBe(true);
    expect(quizPerfect(4)).toBe(false);
    expect(quizPerfect("6/7")).toBe(false);
    expect(quizPerfect("junk")).toBe(false);
  });
});

describe("normPlayer", () => {
  it("returns null for missing or non-object data", () => {
    expect(normPlayer(null, "a")).toBeNull();
    expect(normPlayer(undefined, "a")).toBeNull();
    expect(normPlayer("x", "a")).toBeNull();
  });

  it("fills in defaults", () => {
    expect(normPlayer({}, "a")).toEqual({
      id: "a",
      alias: "Traveler",
      gender: "m",
      team: "",
      look: { g: "m" },
      done: {},
      quiz: {},
      createdAt: "",
      updatedAt: ""
    });
  });

  it("keeps only valid completed days", () => {
    const p = normPlayer(
      {
        done: {
          1: "2026-10-22",
          70: "2026-12-30",
          0: "2026-10-22",
          71: "2026-10-22",
          2: "not a date",
          3: 5,
          x: "2026-10-22",
          1.5: "2026-10-22"
        }
      },
      "a"
    );
    expect(p.done).toEqual({ 1: "2026-10-22", 70: "2026-12-30" });
  });

  it("keeps only valid quiz scores for valid days", () => {
    const p = normPlayer({ quiz: { 1: 3, 2: "6/7", 3: 9, 4: "bad", 71: 5 } }, "a");
    expect(p.quiz).toEqual({ 1: 3, 2: "6/7" });
  });

  it("trims long aliases and replaces blank ones", () => {
    expect(normPlayer({ alias: "x".repeat(60) }, "a").alias).toHaveLength(40);
    expect(normPlayer({ alias: "   " }, "a").alias).toBe("Traveler");
    expect(normPlayer({ alias: 7 }, "a").alias).toBe("Traveler");
  });

  it("only accepts 'f' as female and sets the look's gender to match", () => {
    expect(normPlayer({ gender: "f" }, "a")).toMatchObject({ gender: "f", look: { g: "f" } });
    expect(normPlayer({ gender: "x" }, "a")).toMatchObject({ gender: "m", look: { g: "m" } });
  });

  it("lets a stored look override the default gender", () => {
    const p = normPlayer({ gender: "f", look: { skin: 2 } }, "a");
    expect(p.look).toEqual({ g: "f", skin: 2 });
  });

  it("clips the team to 30 characters and ignores non-strings", () => {
    expect(normPlayer({ team: "t".repeat(40) }, "a").team).toHaveLength(30);
    expect(normPlayer({ team: 2 }, "a").team).toBe("");
  });
});

describe("stats", () => {
  it("is all zeros for a new player", () => {
    expect(stats(player())).toMatchObject({
      n: 0,
      chapters: 0,
      streak: 0,
      best: 0,
      quizzes: 0,
      perfect: 0
    });
  });

  it("counts days and the chapters they cover", () => {
    const s = stats(player({ 1: "2026-10-22", 2: "2026-10-23", 70: "2026-10-24" }));
    expect(s.n).toBe(3);
    expect([...s.doneSet].sort((a, b) => a - b)).toEqual([1, 2, 70]);
    expect(s.chapters).toBe(PLAN[0].count + PLAN[1].count + PLAN[69].count);
  });

  it("counts a streak that includes today", () => {
    const s = stats(player({ 1: "2026-10-28", 2: "2026-10-29", 3: "2026-10-30" }));
    expect(s.streak).toBe(3);
  });

  it("keeps yesterday's streak alive until today is over", () => {
    const s = stats(player({ 1: "2026-10-28", 2: "2026-10-29" }));
    expect(s.streak).toBe(2);
  });

  it("drops the streak after a missed day", () => {
    const s = stats(player({ 1: "2026-10-27", 2: "2026-10-28" }));
    expect(s.streak).toBe(0);
    expect(s.best).toBe(2);
  });

  it("finds the best run even when it is in the past", () => {
    const s = stats(
      player({
        1: "2026-10-01",
        2: "2026-10-02",
        3: "2026-10-03",
        4: "2026-10-04",
        5: "2026-10-10",
        6: "2026-10-11",
        7: "2026-10-30"
      })
    );
    expect(s.best).toBe(4);
    expect(s.streak).toBe(1);
  });

  it("counts a streak across a month and year boundary", () => {
    vi.setSystemTime(new Date(2027, 0, 2, 12));
    const s = stats(player({ 1: "2026-12-30", 2: "2026-12-31", 3: "2027-01-01", 4: "2027-01-02" }));
    expect(s.streak).toBe(4);
    expect(s.best).toBe(4);
  });

  it("counts two days finished on the same date as one day of streak", () => {
    const s = stats(player({ 1: "2026-10-30", 2: "2026-10-30" }));
    expect(s.n).toBe(2);
    expect(s.streak).toBe(1);
    expect(s.best).toBe(1);
  });

  it("counts quizzes and perfect quizzes", () => {
    const s = stats(player({}, { quiz: { 1: 5, 2: 3, 3: "7/7", 4: "6/7" } }));
    expect(s.quizzes).toBe(4);
    expect(s.perfect).toBe(2);
  });

  it("tolerates a player with no quiz map", () => {
    expect(stats({ id: "x", done: {} }).quizzes).toBe(0);
  });
});

describe("badges", () => {
  const doneThrough = chap =>
    Object.fromEntries(PLAN.filter(d => d.from < chap).map(d => [d.day, "2026-10-01"]));
  const earned = p => BADGES.filter(b => b.test(stats(p))).map(b => b.name);

  it("has a unique name per badge", () => {
    const names = BADGES.map(b => b.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("awards nothing to a new player", () => {
    expect(earned(player())).toEqual([]);
  });

  it("awards First Steps for one day", () => {
    expect(earned(player({ 1: "2026-10-01" }))).toEqual(["First Steps"]);
  });

  it.each([
    [3, "Kindled"],
    [7, "Week Warrior"],
    [14, "Steadfast"],
    [30, "Unshakable"]
  ])("awards the %i-day streak badge", (len, name) => {
    const done = {};
    for (let i = 0; i < len; i++) {
      done[i + 1] = iso(new Date(2026, 8, 1 + i));
    }
    expect(earned(player(done))).toContain(name);
    if (len > 3) {
      const short = { ...done };
      delete short[len];
      expect(earned(player(short))).not.toContain(name);
    }
  });

  it("awards Halfway Hero at 35 days and Finisher at 70", () => {
    const days = n =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, "2026-09-01"]));
    expect(earned(player(days(34)))).not.toContain("Halfway Hero");
    expect(earned(player(days(35)))).toContain("Halfway Hero");
    expect(earned(player(days(DAYS - 1)))).not.toContain("Finisher");
    expect(earned(player(days(DAYS)))).toContain("Finisher");
  });

  it.each([
    [89, "Gospel Runner"],
    [117, "Acts of Courage"],
    [204, "Letter Carrier"],
    [238, "Hall of Faith"]
  ])("awards '%s' only when every day up to that chapter is read", (chap, name) => {
    const done = doneThrough(chap);
    expect(earned(player(done))).toContain(name);
    const lastDay = Math.max(...Object.keys(done).map(Number));
    delete done[lastDay];
    expect(earned(player(done))).not.toContain(name);
  });

  it("awards the quiz badges", () => {
    const quiz = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, 5]));
    expect(earned(player({}, { quiz: quiz(4) }))).not.toContain("Sharp Mind");
    expect(earned(player({}, { quiz: quiz(5) }))).toContain("Sharp Mind");
    expect(earned(player({}, { quiz: quiz(24) }))).not.toContain("Scholar");
    expect(earned(player({}, { quiz: quiz(25) }))).toContain("Scholar");
  });

  it("through() is true for a chapter before anything is due", () => {
    expect(through({ doneSet: new Set() }, 0)).toBe(true);
    expect(through({ doneSet: new Set() }, 1)).toBe(false);
  });
});

describe("normConfig", () => {
  it("falls back to the defaults for junk", () => {
    [null, undefined, "x", 5, []].forEach(v =>
      expect(normConfig(v)).toEqual({
        start: "",
        groupName: DEFAULT_CONFIG.groupName,
        version: "KJV",
        teams: DEFAULT_TEAMS
      })
    );
  });

  it("keeps a valid start date and rejects a malformed one", () => {
    expect(normConfig({ start: "2026-10-22" }).start).toBe("2026-10-22");
    expect(normConfig({ start: "22/10/2026" }).start).toBe("");
  });

  it("clips and defaults the group name", () => {
    expect(normConfig({ groupName: "g".repeat(80) }).groupName).toHaveLength(40);
    expect(normConfig({ groupName: "  " }).groupName).toBe(DEFAULT_CONFIG.groupName);
  });

  it("uses custom tribe names, trimmed and clipped", () => {
    const c = normConfig({ teams: ["  Lions ", "Wolves", "t".repeat(50), "Oxen"] });
    expect(c.teams.slice(0, 2)).toEqual(["Lions", "Wolves"]);
    expect(c.teams[2]).toHaveLength(30);
    expect(c.teams[3]).toBe("Oxen");
  });

  it("always gives four tribes", () => {
    expect(normConfig({ teams: ["Only one"] }).teams).toHaveLength(4);
    expect(normConfig({ teams: ["a", "b", "c", "d", "e", "f"] }).teams).toHaveLength(4);
  });

  it("replaces a repeated tribe name with the default", () => {
    expect(normConfig({ teams: ["Same", "Same", "", ""] }).teams[1]).toBe(DEFAULT_TEAMS[1]);
  });

  it("never gives two tribes the same name", () => {
    const teams = normConfig({ teams: [DEFAULT_TEAMS[1], "", "", ""] }).teams;
    expect(new Set(teams).size).toBe(4);
  });

  it("is idempotent", () => {
    const once = normConfig({
      start: "2026-10-22",
      groupName: "Crew",
      teams: ["A", "B", "C", "D"]
    });
    expect(normConfig(once)).toEqual(once);
  });
});

describe("plan dates", () => {
  it("puts day 1 on the start date and counts forward", () => {
    const start = new Date(2026, 9, 22);
    expect(iso(dayDate(start, 1))).toBe("2026-10-22");
    expect(iso(dayDate(start, 10))).toBe("2026-10-31");
    expect(iso(dayDate(start, DAYS))).toBe("2026-12-30");
  });

  it("crosses a year end", () => {
    expect(iso(dayDate(new Date(2026, 11, 25), 10))).toBe("2027-01-03");
  });

  it("planDay is 1 on the start date and null with no start", () => {
    expect(planDay({ start: "2026-10-30" })).toBe(1);
    expect(planDay({ start: "2026-10-22" })).toBe(9);
    expect(planDay({ start: "" })).toBeNull();
  });

  it("planDay is zero or negative before the plan begins", () => {
    expect(planDay({ start: "2026-11-02" })).toBe(-2);
  });
});

describe("startHint", () => {
  it("says when nothing is set", () => {
    expect(startHint("")).toBe("Not set yet.");
    expect(startHint("garbage")).toBe("Not set yet.");
  });

  it("says where day 70 lands when it fits in the year", () => {
    expect(startHint("2026-10-22")).toMatch(/^Day 70 lands on .*2026\.$/);
  });

  it("warns when day 70 would pass December 31 and suggests the latest start", () => {
    const hint = startHint("2026-10-30");
    expect(hint).toMatch(/after December 31/);
    expect(hint).toMatch(/Pick .*Oct 23/);
  });

  it("accepts a start that ends exactly on December 31", () => {
    expect(startHint("2026-10-23")).toMatch(/^Day 70 lands on/);
  });
});

describe("players and teams", () => {
  it("allPlayers adds stats and puts 'me' over the stored copy", () => {
    const players = { a: player({ 1: "2026-10-30" }, { id: "a", alias: "Old" }) };
    const me = player({ 1: "2026-10-30", 2: "2026-10-29" }, { id: "a", alias: "Fresh" });
    const all = allPlayers(players, me);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ alias: "Fresh", s: { n: 2 } });
  });

  it("allPlayers adds 'me' when the group has not loaded them yet", () => {
    const all = allPlayers({}, player({}, { id: "me" }));
    expect(all.map(p => p.id)).toEqual(["me"]);
  });

  it("allPlayers copes with no 'me'", () => {
    expect(allPlayers({ a: player({}, { id: "a" }) }, null)).toHaveLength(1);
  });

  it("teamIndex reads '0'-'3' and falls back to matching the team name", () => {
    expect(teamIndex({ team: "2" }, DEFAULT_TEAMS)).toBe(2);
    expect(teamIndex({ team: DEFAULT_TEAMS[1] }, DEFAULT_TEAMS)).toBe(1);
    expect(teamIndex({ team: "Unknown" }, DEFAULT_TEAMS)).toBe(-1);
    expect(teamIndex({ team: "4" }, DEFAULT_TEAMS)).toBe(-1);
    expect(teamIndex({}, DEFAULT_TEAMS)).toBe(-1);
    expect(teamIndex(null, DEFAULT_TEAMS)).toBe(-1);
  });

  it("nextUndone finds the first gap, and null when finished", () => {
    expect(nextUndone({ doneSet: new Set() })).toBe(1);
    expect(nextUndone({ doneSet: new Set([1, 2, 4]) })).toBe(3);
    expect(
      nextUndone({ doneSet: new Set(Array.from({ length: DAYS }, (_, i) => i + 1)) })
    ).toBeNull();
  });

  it("takenAliases lists everyone else's alias in lower case", () => {
    const players = {
      a: player({}, { id: "a", alias: "Boaz of Bethel" }),
      b: player({}, { id: "b", alias: "Ruth" })
    };
    const me = player({}, { id: "a", alias: "Boaz of Bethel" });
    expect([...takenAliases(players, me)]).toEqual(["ruth"]);
    expect([...takenAliases(players, null)].sort()).toEqual(["boaz of bethel", "ruth"]);
  });
});

describe("character drafts", () => {
  it("draftName uses the typed name in 'own' mode and the picked name otherwise", () => {
    expect(draftName({ nameMode: "own", ownName: "Sam1!", name: "Boaz" })).toBe("Sam");
    expect(draftName({ nameMode: "bible", ownName: "Sam", name: "Boaz" })).toBe("Boaz");
  });

  it("aliasOf joins the name and place, and is blank without a name", () => {
    expect(aliasOf({ nameMode: "bible", name: "Boaz", place: "of Bethel" })).toBe("Boaz of Bethel");
    expect(aliasOf({ nameMode: "bible", name: "Boaz", place: "" })).toBe("Boaz");
    expect(aliasOf({ nameMode: "bible", name: "", place: "of Bethel" })).toBe("");
    expect(aliasOf({ nameMode: "own", ownName: "", place: "of Bethel" })).toBe("");
  });

  it("draftFrom recognises a Bible name with a place", () => {
    const d = draftFrom(normPlayer({ alias: "Boaz of Bethel", gender: "m" }, "a"));
    expect(d).toMatchObject({ nameMode: "bible", name: "Boaz", ownName: "", place: "of Bethel" });
  });

  it("draftFrom treats anything else as the player's own name", () => {
    const d = draftFrom(normPlayer({ alias: "Sam of Joppa", gender: "m" }, "a"));
    expect(d).toMatchObject({ nameMode: "own", name: "", ownName: "Sam", place: "of Joppa" });
  });

  it("draftFrom handles an alias with no place", () => {
    const d = draftFrom(normPlayer({ alias: "Ruth", gender: "f" }, "a"));
    expect(d).toMatchObject({ nameMode: "bible", name: "Ruth", place: "" });
  });

  it("draftFrom and aliasOf round-trip every Bible name and place", () => {
    const names = [...NAMES_M, ...NAMES_F];
    names.forEach(name =>
      PLACES.forEach(place => {
        const alias = aliasOf({ nameMode: "bible", name, place });
        const p = normPlayer({ alias, gender: "m" }, "a");
        expect(aliasOf(draftFrom(p))).toBe(p.alias);
      })
    );
  });

  it.each(["m", "f"])("newDraftFor('%s') makes a look that normLook leaves unchanged", g => {
    for (let i = 0; i < 200; i++) {
      const d = newDraftFor(g);
      expect(d.gender).toBe(g);
      expect(normLook(d.look, 0)).toEqual(d.look);
    }
  });

  it("women never get a beard and men never get a jewel", () => {
    for (let i = 0; i < 100; i++) {
      expect(newDraftFor("f").look.beard).toBe(0);
      expect(newDraftFor("m").look.jewel).toBe(0);
    }
  });
});
