// Group chat: messages, questions leaders can mark answered, pins and reports (shared group only).
import { getState, setState } from "@/store.js";
import { CHAT_MAX } from "@/lib/data.js";
import { lsGet, lsSet } from "@/lib/util.js";
import { toast } from "./ui.js";

const failed = (e, what) =>
  toast(
    e && e.code === "permission-denied"
      ? "Chat needs the latest security rules (ask your leader)"
      : `Couldn't ${what}. Try again.`
  );

// Resolves true when the message was sent, so the caller can clear its box.
export async function postMessage(raw, isQuestion) {
  const text = (raw || "").trim().slice(0, CHAT_MAX);
  if (!text) {
    toast("Write something first");
    return false;
  }
  const s = getState();
  try {
    await s.db
      .collection("messages")
      .add({ uid: s.uid, text, q: !!isQuestion, at: new Date().toISOString() });
    return true;
  } catch (e) {
    failed(e, "send");
    return false;
  }
}

export async function deleteMessage(id) {
  const s = getState();
  try {
    await s.db.doc("messages/" + id).delete();
    // A leader removing a message also clears any reports about it.
    if (s.canLead) {
      await Promise.all(
        s.reports.filter(r => r.msg === id).map(r => s.db.doc("reports/" + r.id).delete())
      );
    }
    toast("Message removed");
  } catch (e) {
    failed(e, "remove that");
  }
}

export async function setAnswered(id, answered) {
  try {
    await getState()
      .db.doc("messages/" + id)
      .update({ answered });
    toast(answered ? "Marked answered" : "Marked open");
  } catch (e) {
    failed(e, "update that");
  }
}

export async function setPinned(id, pinned) {
  try {
    await getState()
      .db.doc("messages/" + id)
      .update({ pinned });
    toast(pinned ? "Pinned to the top" : "Unpinned");
  } catch (e) {
    failed(e, "update that");
  }
}

// Only leaders can read reports, so each device remembers what it reported.
export const reportedByMe = () => lsGet("nt70.reported") || [];

export async function reportMessage(id) {
  const s = getState();
  try {
    await s.db
      .doc(`reports/${id}_${s.uid}`)
      .set({ msg: id, uid: s.uid, at: new Date().toISOString() });
    lsSet("nt70.reported", [...reportedByMe(), id].slice(-200));
    setState({ chatSeen: getState().chatSeen }); // redraw so the button shows "Reported"
    toast("Reported. A leader will take a look.");
  } catch (e) {
    failed(e, "report that");
  }
}

// Leader keeps a reported message: clear its reports.
export async function dismissReports(msgId) {
  const s = getState();
  try {
    await Promise.all(
      s.reports.filter(r => r.msg === msgId).map(r => s.db.doc("reports/" + r.id).delete())
    );
    toast("Report dismissed");
  } catch (e) {
    failed(e, "dismiss that");
  }
}

// Unread badge: messages from others newer than the last time this device had the chat open.
export function markChatSeen() {
  const last = getState().messages.reduce((m, x) => (x.at > m ? x.at : m), "");
  const seen = getState().chatSeen || lsGet("nt70.chatSeen") || "";
  if (last && last > seen) {
    lsSet("nt70.chatSeen", last);
    setState({ chatSeen: last });
  }
}
