// The player and group model: normalising stored data, stats, badges, teams and character drafts.
import {
  DAYS,
  PLAN,
  DEFAULT_TEAMS,
  DEFAULT_CONFIG,
  NAMES_M,
  NAMES_F,
  PLACES,
  allowedFor
} from "./data.js";
import { iso, parseISO, daysBetween, cleanName as cleanNameOf } from "./util.js";
import { normLook } from "./avatar.js";

// Quiz scores: a whole number is the original 5-question quiz (3 means 3/5); later quizzes are
// stored as text like "6/7", so earlier scores and perfect-quiz points keep their meaning.
export function quizScore(v) {
  if (Number.isInteger(v)) {
    return v >= 0 && v <= 5 ? { got: v, of: 5 } : null;
  }
  const m = typeof v === "string" && /^(\d{1,2})\/(\d{1,2})$/.exec(v);
  return m && +m[2] > 0 && +m[1] <= +m[2] ? { got: +m[1], of: +m[2] } : null;
}
export const fmtQuiz = v => {
  const q = quizScore(v);
  return q ? `${q.got}/${q.of}` : "";
};
export const quizPerfect = v => {
  const q = quizScore(v);
  return !!q && q.got === q.of;
};

export function normPlayer(d, id) {
  if (!d || typeof d !== "object") {
    return null;
  }
  const done = {};
  if (d.done && typeof d.done === "object") {
    for (const [k, v] of Object.entries(d.done)) {
      const n = +k;
      if (Number.isInteger(n) && n >= 1 && n <= DAYS && typeof v === "string" && parseISO(v)) {
        done[n] = v;
      }
    }
  }
  return {
    id,
    alias: typeof d.alias === "string" && d.alias.trim() ? d.alias.slice(0, 40) : "Traveler",
    gender: d.gender === "f" ? "f" : "m",
    team: typeof d.team === "string" ? d.team.slice(0, 30) : "",
    look:
      d.look && typeof d.look === "object"
        ? { g: d.gender === "f" ? "f" : "m", ...d.look }
        : { g: d.gender === "f" ? "f" : "m" },
    done,
    quiz: (() => {
      const q = {};
      if (d.quiz && typeof d.quiz === "object") {
        for (const [k, v] of Object.entries(d.quiz)) {
          const n = +k;
          if (Number.isInteger(n) && n >= 1 && n <= DAYS && quizScore(v)) {
            q[n] = v;
          }
        }
      }
      return q;
    })(),
    createdAt: typeof d.createdAt === "string" ? d.createdAt : "",
    updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : ""
  };
}

export function stats(p) {
  const days = Object.keys(p.done).map(Number);
  const doneSet = new Set(days);
  const chapters = days.reduce((s, d) => s + PLAN[d - 1].count, 0);
  const dates = new Set(Object.values(p.done));
  let cur = 0;
  const d = new Date();
  if (!dates.has(iso(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (dates.has(iso(d))) {
    cur++;
    d.setDate(d.getDate() - 1);
  }
  let best = 0;
  let run = 0;
  let prev = null;
  [...dates]
    .map(parseISO)
    .sort((a, b) => a - b)
    .forEach(x => {
      run = prev && daysBetween(prev, x) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = x;
    });
  const qs = Object.values(p.quiz || {});
  return {
    n: days.length,
    doneSet,
    chapters,
    streak: cur,
    best,
    quizzes: qs.length,
    perfect: qs.filter(quizPerfect).length
  };
}

export const through = (s, chap) =>
  PLAN.filter(d => d.from < chap).every(d => s.doneSet.has(d.day));
export const BADGES = [
  {
    name: "First Steps",
    desc: "Finish day 1 of your quest",
    color: "#0E9C8D",
    icon: "star",
    test: s => s.n >= 1
  },
  {
    name: "Kindled",
    desc: "3-day streak",
    color: "#FF9A3C",
    icon: "flame",
    test: s => s.best >= 3
  },
  {
    name: "Week Warrior",
    desc: "7-day streak",
    color: "#F0562A",
    icon: "flame",
    test: s => s.best >= 7
  },
  {
    name: "Gospel Runner",
    desc: "Matthew through John",
    color: "#0E9C8D",
    icon: "book",
    test: s => through(s, 89)
  },
  {
    name: "Acts of Courage",
    desc: "Read through Acts",
    color: "#F0562A",
    icon: "book",
    test: s => through(s, 117)
  },
  {
    name: "Steadfast",
    desc: "14-day streak",
    color: "#E11D48",
    icon: "flame",
    test: s => s.best >= 14
  },
  {
    name: "Halfway Hero",
    desc: "35 days done",
    color: "#2F7BF0",
    icon: "star",
    test: s => s.n >= 35
  },
  {
    name: "Letter Carrier",
    desc: "Read through Philemon",
    color: "#D98A00",
    icon: "book",
    test: s => through(s, 204)
  },
  {
    name: "Unshakable",
    desc: "30-day streak",
    color: "#7C4DFF",
    icon: "flame",
    test: s => s.best >= 30
  },
  {
    name: "Hall of Faith",
    desc: "Read through Jude",
    color: "#7C4DFF",
    icon: "book",
    test: s => through(s, 238)
  },
  {
    name: "Finisher",
    desc: "The whole New Testament",
    color: "#F5B301",
    icon: "crown",
    test: s => s.n >= DAYS
  },
  {
    name: "Sharp Mind",
    desc: "5 perfect quizzes",
    color: "#2F7BF0",
    icon: "target",
    test: s => s.perfect >= 5
  },
  {
    name: "Scholar",
    desc: "25 quizzes completed",
    color: "#0E9C8D",
    icon: "book",
    test: s => s.quizzes >= 25
  }
];

export function normConfig(c) {
  c = c && typeof c === "object" ? c : {};
  // Always four tribes; a blank or repeated name falls back to the default.
  const teams = [];
  DEFAULT_TEAMS.forEach((def, i) => {
    const t =
      Array.isArray(c.teams) && typeof c.teams[i] === "string"
        ? c.teams[i].trim().slice(0, 30)
        : "";
    teams.push(t && !teams.includes(t) ? t : "");
  });
  // A default can already be taken by a custom name in another slot, so fall back to one that is free.
  const free = DEFAULT_TEAMS.filter(def => !teams.includes(def));
  DEFAULT_TEAMS.forEach((def, i) => {
    if (!teams[i]) {
      teams[i] = free.includes(def) ? def : free.find(f => !teams.includes(f));
    }
  });
  return {
    start: parseISO(c.start) ? c.start : "",
    groupName:
      typeof c.groupName === "string" && c.groupName.trim()
        ? c.groupName.slice(0, 40)
        : DEFAULT_CONFIG.groupName,
    version: "KJV",
    teams
  };
}

export const dayDate = (start, day) =>
  new Date(start.getFullYear(), start.getMonth(), start.getDate() + day - 1);
export const planDay = config => {
  const s = parseISO(config.start);
  return s ? daysBetween(s, new Date()) + 1 : null;
};
export const allPlayers = (players, me) => {
  const map = { ...players };
  if (me) {
    map[me.id] = me;
  }
  return Object.values(map).map(p => ({ ...p, s: stats(p) }));
};
// Players store their team as "0"–"3"; older saves stored the team's name.
export const teamIndex = (p, teams) => {
  const t = p && p.team;
  if (/^[0-3]$/.test(t || "")) {
    return +t;
  }
  return teams.indexOf(t);
};
export const nextUndone = s => {
  for (let d = 1; d <= DAYS; d++) {
    if (!s.doneSet.has(d)) {
      return d;
    }
  }
  return null;
};
export const draftName = d => (d.nameMode === "own" ? cleanNameOf(d.ownName) : d.name);
export const aliasOf = d => {
  const nm = draftName(d);
  return (nm + (nm && d.place ? " " + d.place : "")).trim();
};
export const takenAliases = (players, me) =>
  new Set(
    allPlayers(players, me)
      .filter(p => !me || p.id !== me.id)
      .map(p => p.alias.toLowerCase())
  );

export function startHint(v) {
  const st = parseISO(v);
  if (!st) {
    return "Not set yet.";
  }
  const fmt = d =>
    d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const end = dayDate(st, DAYS);
  const dec31 = new Date(st.getFullYear(), 11, 31);
  if (end > dec31) {
    return `Day 70 would be ${fmt(
      end
    )}, ${end.getFullYear()}, which is after December 31. Pick ${fmt(
      new Date(st.getFullYear(), 11, 31 - (DAYS - 1))
    )} or earlier.`;
  }
  return `Day 70 lands on ${fmt(end)}, ${end.getFullYear()}.`;
}

/* ---- character drafts (the editor edits a copy, then saves) ---- */
export function draftFrom(p) {
  const L = normLook(p.look, stats(p).n);
  const all = [...NAMES_M, ...NAMES_F];
  const place = PLACES.find(pl => pl && p.alias.endsWith(" " + pl)) || "";
  const name = place ? p.alias.slice(0, -(place.length + 1)) : p.alias;
  const bible = all.includes(name);
  return {
    gender: p.gender,
    nameMode: bible ? "bible" : "own",
    name: bible ? name : "",
    ownName: bible ? "" : name,
    place,
    look: { ...L }
  };
}

export function newDraftFor(g) {
  const r = arr => arr[Math.floor(Math.random() * arr.length)];
  const f = g === "f";
  const tunics = allowedFor("tunic", g)
    .filter(([e]) => e[2] === 0)
    .map(([, i]) => i);
  return {
    gender: g,
    nameMode: "bible",
    name: "",
    ownName: "",
    place: "",
    look: {
      g,
      skin: 1 + Math.floor(Math.random() * 4),
      hair: f ? r([1, 4, 2]) : r([0, 3, 5]),
      hairColor: Math.floor(Math.random() * 4),
      beard: f ? 0 : r([2, 3, 3, 4, 1]),
      tunic: r(tunics),
      sash: 0,
      hat: 0,
      item: 0,
      face: f ? r([1, 3]) : r([0, 2, 4]),
      eyes: f ? r([0, 4]) : r([0, 2, 3]),
      eyeColor: Math.floor(Math.random() * 3),
      brows: f ? r([0, 3]) : r([1, 2]),
      mouth: r([0, 3]),
      cover: f ? r([1, 2, 3]) : r([0, 1, 1]),
      mantle: f ? Math.floor(Math.random() * 3) : r([0, 1, 4]),
      jewel: f ? r([1, 2]) : 0
    }
  };
}

export const newDraft = () => newDraftFor(Math.random() < 0.5 ? "m" : "f");
