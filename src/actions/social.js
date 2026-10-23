// Cheers and Victory Moment discussion replies (shared group only).
import { getState, setState } from "@/store.js";
import { CHEER_KINDS } from "@/lib/data.js";
import { toast } from "./ui.js";

export async function toggleCheer(to, kind) {
  const s = getState();
  if (s.mode !== "shared" || !s.uid) {
    return;
  }
  const id = `${to}_${s.uid}`;
  const mine = s.cheers.find(c => c.to === to && c.from === s.uid);
  const who = (s.players[to] || {}).alias || "them";
  try {
    if (mine && mine.kind === kind) {
      await s.db.doc("cheers/" + id).delete();
      toast(`Cheer removed`);
    } else {
      await s.db.doc("cheers/" + id).set({ to, from: s.uid, kind, at: new Date().toISOString() });
      toast(`${CHEER_KINDS[kind]} Sent to ${who}`);
    }
  } catch (e) {
    toast(
      e && e.code === "permission-denied"
        ? "Cheers need the latest security rules (ask your leader)"
        : "Couldn't send that. Try again."
    );
  }
}

// Resolves true when the reply was posted, so the caller can clear its box.
export async function postReply(week, raw) {
  const text = (raw || "").trim().slice(0, 280);
  if (!text) {
    toast("Write something first");
    return false;
  }
  const s = getState();
  try {
    await s.db.collection("replies").add({ week, uid: s.uid, text, at: new Date().toISOString() });
    setState(st => ({ openDisc: { ...st.openDisc, [week]: true } }));
    toast("Posted");
    return true;
  } catch (e) {
    toast(
      e && e.code === "permission-denied"
        ? "Replies need the latest security rules (ask your leader)"
        : "Couldn't post. Try again."
    );
    return false;
  }
}

export async function deleteReply(id) {
  try {
    await getState()
      .db.doc("replies/" + id)
      .delete();
    toast("Reply removed");
  } catch {
    toast("Couldn't remove that reply");
  }
}
