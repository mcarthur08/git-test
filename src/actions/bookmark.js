// Reading bookmark: the verse you stopped at in the in-app reader. It moves forward on its own as
// you read, and tapping a verse sets it on purpose. Saved on the device right away and, in a
// group, to bookmarks/<uid> so it follows the account to other devices. It lives in its own
// document so a missing rule can never block saving reading progress.
import { getState, setState } from "@/store.js";
import { PLAN, CHAPTERS } from "@/lib/data.js";
import { lsGet, lsSet } from "@/lib/util.js";
import { toast } from "./ui.js";

const key = () => `nt70.mark.${getState().uid || "local"}`;
// Position in the 70-day reading, so "further along" is a simple comparison.
const pos = m => (m ? m.day * 1e6 + m.ci * 1e3 + m.v : 0);

export function validMark(m) {
  return (
    !!m &&
    Number.isInteger(m.day) &&
    m.day >= 1 &&
    m.day <= PLAN.length &&
    Number.isInteger(m.ci) &&
    m.ci >= 0 &&
    m.ci < PLAN[m.day - 1].to - PLAN[m.day - 1].from &&
    Number.isInteger(m.v) &&
    m.v >= 1 &&
    m.v <= 200
  );
}

// "Mark 4:21" (or "Jude 5" for one-chapter books)
export function markRef(m) {
  const c = CHAPTERS[PLAN[m.day - 1].from + m.ci];
  return c.one ? `${c.b} ${m.v}` : `${c.b} ${c.c}:${m.v}`;
}

let timer = null;
function write(m) {
  const s = getState();
  if (s.mode === "shared" && s.db && s.uid) {
    const ref = s.db.doc("bookmarks/" + s.uid);
    (m ? ref.set(m) : ref.delete()).catch(() => {}); // still kept on this device if the group copy can't be saved
  }
}
// Saved on the device at once; to the account a few seconds later, so scrolling isn't a stream of writes.
function persist(m) {
  lsSet(key(), m);
  clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    write(getState().mark);
  }, 2500);
}
// Leaving the reader or hiding the app: send any waiting change now.
export function flushMark() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    write(getState().mark);
  }
}

// As you scroll: only ever moves the bookmark forward, so a verse you tapped isn't lost when you
// glance back up the page.
export function autoMark(day, ci, v) {
  const m = { day, ci, v, at: new Date().toISOString(), manual: false };
  const cur = getState().mark;
  if (!validMark(m) || (cur && pos(m) <= pos(cur)) || (ci === 0 && v === 1)) {
    return;
  }
  setState({ mark: m });
  persist(m);
}

// Tapping a verse: set the bookmark exactly there, with Undo.
export function setMark(day, ci, v) {
  const before = getState().mark;
  const m = { day, ci, v, at: new Date().toISOString(), manual: true };
  if (!validMark(m)) {
    return;
  }
  setState({ mark: m });
  persist(m);
  toast(`Bookmarked ${markRef(m)}`, {
    label: "Undo",
    fn: () => {
      setState({ mark: before || null });
      persist(before || null);
    }
  });
}

// Start-up: the device copy first, then the account copy if it's newer.
export function loadMark() {
  const m = lsGet(key());
  setState({ mark: validMark(m) ? m : null });
}
export function takeRemoteMark(m) {
  const cur = getState().mark;
  if (validMark(m) && (!cur || (m.at || "") > (cur.at || ""))) {
    setState({ mark: m });
    lsSet(key(), m);
  }
}
