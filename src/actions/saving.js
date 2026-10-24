// Saving the player's progress: locally in solo mode, debounced to Firestore in a group.
import { getState, setState } from "@/store.js";
import { lsSet } from "@/lib/util.js";

let saveTimer = null;
let writing = false;
let dirty = false;
let saveStatusTimer = null;
export function setSave(st) {
  clearTimeout(saveStatusTimer);
  setState({ saveStatus: st });
  if (st === "saved") {
    saveStatusTimer = setTimeout(() => setState({ saveStatus: "" }), 2500);
  }
}

export function saveMe() {
  const s = getState();
  if (s.mode === "local") {
    lsSet("nt70.me", s.me);
    setSave("saved");
    return;
  }
  setSave("saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 350);
}

export async function flush() {
  saveTimer = null;
  if (writing) {
    dirty = true;
    return;
  }
  writing = true;
  dirty = false;
  const { me, db, uid } = getState();
  try {
    await db.doc("players/" + uid).set({
      alias: me.alias,
      gender: me.gender,
      team: me.team,
      look: me.look,
      done: me.done,
      quiz: me.quiz || {},
      createdAt: me.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setState({ writeError: null });
    if (!dirty) {
      setSave("saved");
    }
  } catch (e) {
    setSave("error");
    setState({
      writeError: (e && e.code) || "unavailable",
      ...(e && (e.code === "invalid_argument" || e.code === "permission-denied")
        ? { readOnly: true }
        : {})
    });
  }
  writing = false;
  if (dirty) {
    flush();
  }
}

export const savePending = () => writing || dirty || saveTimer !== null;
export function retrySave() {
  if (getState().mode === "shared") {
    setSave("saving");
    flush();
  }
}
