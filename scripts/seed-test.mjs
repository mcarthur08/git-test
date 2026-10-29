// Fills the TEST Firebase project with a sample youth group so it looks and behaves like the real
// thing: group settings, 12 readers across the four tribes at different progress, quiz scores,
// cheers, chat messages (with a pinned note, an answered and an open question), Victory Moment
// replies and one reported message. Optionally makes someone a leader.
//
// Run by the "Seed test data" GitHub workflow. Locally:
//   GOOGLE_APPLICATION_CREDENTIALS=key.json node scripts/seed-test.mjs [--reset] [--leader <uid>]
//
// It refuses to touch any project other than the test one, so the real group's data is safe.
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const TEST_PROJECT = "nt-quest";
const LIVE_PROJECT = "nt70-quest";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const leaderAt = args.indexOf("--leader");
const leader = leaderAt >= 0 ? (args[leaderAt + 1] || "").trim() : "";
if (leader && !/^[A-Za-z0-9_-]{6,128}$/.test(leader)) {
  console.error(
    `"${leader}" doesn't look like an Account ID. Copy it from Me › Account on the test site.`
  );
  process.exit(1);
}

const key = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
if (key.project_id !== TEST_PROJECT || key.project_id === LIVE_PROJECT) {
  console.error(`Refusing to run: this key is for "${key.project_id}", not "${TEST_PROJECT}".`);
  process.exit(1);
}
initializeApp({ credential: cert(key), projectId: TEST_PROJECT });
const db = getFirestore();

/* ---------- dates ---------- */
const START = "2026-10-22"; // same Day 1 as the real group
const DAYS = 70;
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (d, h = 12) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h).toISOString();
const [sy, sm, sd] = START.split("-").map(Number);
const start = new Date(sy, sm - 1, sd);
const today = new Date();
today.setHours(0, 0, 0, 0);
const planDay = Math.max(1, Math.min(DAYS, Math.round((today - start) / 864e5) + 1));
const daysAgo = k => new Date(today.getFullYear(), today.getMonth(), today.getDate() - k);
const clampToToday = d => (d > today ? today : d);

// Days 1..n, each read on its own calendar day; a reader who is behind did them later than planned.
function readLog(n, lateBy = 0) {
  const done = {};
  for (let d = 1; d <= n; d++) {
    const planned = new Date(sy, sm - 1, sd + d - 1 + lateBy);
    done[d] = iso(clampToToday(planned));
  }
  return done;
}

/* ---------- sample readers ---------- */
// [id, alias, gender, tribe, days read (relative to today's plan day), days late, perfect quizzes]
const ahead = n => Math.min(DAYS, planDay + n);
const behind = n => Math.max(0, planDay - n);
const READERS = [
  ["sample-01", "Ruth of Bethel", "f", "0", ahead(2), 0, 3],
  ["sample-02", "Silas", "m", "0", planDay, 0, 1],
  ["sample-03", "Naomi", "f", "0", behind(3), 2, 0],
  ["sample-04", "Caleb of Hebron", "m", "1", planDay, 0, 2],
  ["sample-05", "Lydia", "f", "1", ahead(1), 0, 4],
  ["sample-06", "Barnabas", "m", "1", behind(5), 3, 0],
  ["sample-07", "Priscilla", "f", "2", planDay, 0, 0],
  ["sample-08", "Timothy of Lystra", "m", "2", behind(1), 1, 1],
  ["sample-09", "Dorcas", "f", "2", 1, 0, 0],
  ["sample-10", "Joshua", "m", "3", ahead(3), 0, 2],
  ["sample-11", "Hannah", "f", "3", planDay, 0, 1],
  ["sample-12", "Gideon", "m", "3", behind(2), 1, 0]
];
const LOOKS = {
  m: i => ({
    skin: 1 + (i % 4),
    hair: [0, 3, 5][i % 3],
    hairColor: i % 4,
    beard: [2, 3, 4, 1][i % 4],
    tunic: 0,
    sash: 0,
    hat: 0,
    item: 0,
    face: [0, 2, 4][i % 3],
    eyes: [0, 2, 3][i % 3],
    eyeColor: i % 3,
    brows: 1 + (i % 2),
    mouth: [0, 3][i % 2],
    cover: [0, 1][i % 2],
    mantle: [0, 1, 4][i % 3],
    jewel: 0
  }),
  f: i => ({
    skin: 1 + (i % 4),
    hair: [1, 4, 2][i % 3],
    hairColor: i % 4,
    beard: 0,
    tunic: 0,
    sash: 0,
    hat: 0,
    item: 0,
    face: [1, 3][i % 2],
    eyes: [0, 4][i % 2],
    eyeColor: i % 3,
    brows: [0, 3][i % 2],
    mouth: [0, 3][i % 2],
    cover: [1, 2, 3][i % 3],
    mantle: i % 3,
    jewel: [1, 2][i % 2]
  })
};

/* ---------- write ---------- */
async function clear(collection, only) {
  const snap = await db.collection(collection).get();
  const docs = only ? snap.docs.filter(d => only(d.id)) : snap.docs;
  await Promise.all(docs.map(d => d.ref.delete()));
  return docs.length;
}

async function main() {
  if (reset) {
    const n =
      (await clear("players", id => id.startsWith("sample-"))) +
      (await clear("messages")) +
      (await clear("replies")) +
      (await clear("cheers")) +
      (await clear("reports"));
    console.log(`Reset: removed ${n} test documents (real test accounts' characters were kept).`);
  }

  await db.doc("config/plan").set({
    start: START,
    groupName: "Youth Group (Test)",
    version: "KJV",
    teams: ["Tribe of Judah", "Tribe of Benjamin", "Tribe of Levi", "Tribe of Ephraim"]
  });

  const batch = db.batch();
  READERS.forEach(([id, alias, g, team, n, late, perfect], i) => {
    const quiz = {};
    for (let d = 1; d <= Math.min(n, 12); d++) {
      quiz[d] = d <= perfect ? "7/7" : `${4 + (d % 3)}/7`;
    }
    batch.set(db.doc("players/" + id), {
      alias,
      gender: g,
      team,
      look: { g, ...LOOKS[g](i) },
      done: readLog(n, late),
      quiz,
      createdAt: at(start, 19),
      updatedAt: at(today, 9)
    });
  });

  // Cheers: everyone gets a little encouragement
  const kinds = ["pray", "fire"];
  READERS.forEach(([to], i) => {
    const from = READERS[(i + 3) % READERS.length][0];
    batch.set(db.doc(`cheers/${to}_${from}`), {
      to,
      from,
      kind: kinds[i % 2],
      at: at(daysAgo(i % 3), 18)
    });
  });

  // Group chat
  const msgs = [
    [
      "welcome",
      "sample-04",
      "Welcome to the NT70 group chat! Ask questions about the reading here, share what stood out, and encourage each other. 🙏",
      false,
      3,
      { pinned: true }
    ],
    [
      "q-sower",
      "sample-03",
      "In Matthew 13, what does the seed that fell on stony places mean?",
      true,
      2,
      { answered: true }
    ],
    [
      "a-sower",
      "sample-05",
      "Verses 20–21 explain it: people who receive the word with joy but have no root, so when trouble comes they fall away.",
      false,
      2,
      {}
    ],
    [
      "fav",
      "sample-10",
      "The Sermon on the Mount (Matthew 5–7) hit different reading it all at once.",
      false,
      1,
      {}
    ],
    ["q-levi", "sample-09", "Is Levi the tax collector the same person as Matthew?", true, 0, {}],
    ["cheer", "sample-11", "Day " + planDay + " done! Who's reading tonight?", false, 0, {}]
  ];
  msgs.forEach(([id, uid, text, q, ago, extra], i) => {
    batch.set(db.doc("messages/" + id), { uid, text, q, at: at(daysAgo(ago), 10 + i), ...extra });
  });
  batch.set(db.doc("reports/fav_sample-06"), { msg: "fav", uid: "sample-06", at: at(today, 11) });

  // Victory Moment discussion (week 1)
  batch.set(db.doc("replies/sample-r1"), {
    week: 1,
    uid: "sample-01",
    text: "Waiting on God for a job right now. Choosing to stand still and trust.",
    at: at(daysAgo(1), 20)
  });
  batch.set(db.doc("replies/sample-r2"), {
    week: 1,
    uid: "sample-08",
    text: "The sea opened only when they stepped forward. Faith moves first.",
    at: at(daysAgo(0), 8)
  });

  if (leader) {
    batch.set(db.doc("admins/" + leader), { role: "leader" });
  }
  await batch.commit();
  console.log(
    `Seeded ${TEST_PROJECT}: ${READERS.length} readers (Day ${planDay}), ${msgs.length} chat messages, cheers, replies and a report.`
  );
  if (leader) {
    console.log(`Made ${leader} a leader in the test project.`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
