// Tribes, leader tools for players, and account recovery.
import { getState, setState } from "@/store.js";
import { TEAM_VERSES } from "@/lib/data.js";
import { plural } from "@/lib/util.js";
import { stats, allPlayers, teamIndex } from "@/lib/player.js";
import { cleanUsername, usernameOf } from "@/lib/account.js";
import { Crest } from "@/components/ui/Emblems.jsx";
import { Frame } from "@/components/ui/Avatar.jsx";
import { toast, queueReveal } from "./ui.js";
import { saveMe, savePending } from "./saving.js";

export function pickTeam(excludeId) {
  const s = getState();
  const counts = [0, 0, 0, 0];
  allPlayers(s.players, s.me).forEach(p => {
    if (p.id === excludeId) {
      return;
    }
    const i = teamIndex(p, s.config.teams);
    if (i >= 0) {
      counts[i]++;
    }
  });
  const min = Math.min(...counts);
  const open = counts.map((c, i) => (c === min ? i : -1)).filter(i => i >= 0);
  return open[Math.floor(Math.random() * open.length)];
}

export function tribeReveal(i, alias) {
  return {
    kicker: alias ? `Welcome, ${alias}` : "Your tribe",
    title: getState().config.teams[i],
    text: `"${TEAM_VERSES[i][0]}" (${TEAM_VERSES[i][1]}). Read with your tribe and climb the leaderboard together.`,
    art: <Crest i={i} big />
  };
}

// Give an existing player without a valid tribe one, once per visit.
export function ensureTeam() {
  const s = getState();
  if (!s.me || s.readOnly || s.teamChecked || savePending()) {
    return;
  }
  setState({ teamChecked: true });
  const ti = teamIndex(s.me, s.config.teams);
  if (ti >= 0) {
    if (!/^[0-3]$/.test(s.me.team)) {
      setState({ me: { ...s.me, team: String(ti) } });
      saveMe();
    }
    return;
  }
  const pick = pickTeam(s.me.id);
  setState({ me: { ...s.me, team: String(pick) } });
  saveMe();
  queueReveal(tribeReveal(pick, s.me.alias));
}

export async function moveTeam(id, i) {
  const s = getState();
  try {
    await s.db.doc("players/" + id).update({ team: String(i) });
    if (s.me && id === s.me.id) {
      setState(st => ({ me: { ...st.me, team: String(i) } }));
    }
    toast(`Moved to ${s.config.teams[i]}`);
  } catch (e) {
    toast(
      e && (e.code === "permission-denied" || e.code === "invalid_argument")
        ? "Only leaders can move players. Publish the latest security rules (SETUP.md step 5)."
        : "Couldn't move that player"
    );
  }
}

export async function removePlayer(id) {
  try {
    await getState()
      .db.doc("players/" + id)
      .delete();
    setState(s => {
      const players = { ...s.players };
      delete players[id];
      return { players, confirmRemove: null };
    });
    toast("Player removed");
  } catch {
    toast("Couldn't remove that player");
  }
}

/* ---- account recovery: a leader points an old character at a new username; that account claims it on sign-in ---- */
export async function startRecover(fromId, rawName) {
  const u = cleanUsername(rawName);
  if (u.length < 3) {
    toast("Enter the new username they signed up with");
    return;
  }
  const s = getState();
  const old = s.players[fromId];
  try {
    await s.db
      .doc("transfers/" + u)
      .set({ from: fromId, alias: old ? old.alias : "", at: new Date().toISOString() });
    setState({ recoverFor: null });
    toast(`Ready: when ${u} signs in, ${old ? old.alias : "their"} progress moves over`);
  } catch (e) {
    toast(
      e && e.code === "permission-denied"
        ? "Publish the latest security rules first (SETUP.md step 5)"
        : "Couldn't set that up. Try again."
    );
  }
}

export async function checkTransfer() {
  const s = getState();
  if (s.transferChecked || s.backend !== "firebase") {
    return;
  }
  setState({ transferChecked: true });
  const u = usernameOf(s.account && s.account.email);
  if (!u) {
    return;
  }
  const db = s.db;
  let t;
  try {
    t = await db.doc("transfers/" + u).get();
  } catch {
    return;
  }
  if (!t.exists) {
    return;
  }
  const from = t.data().from;
  const old = getState().players[from];
  if (!old || from === s.uid) {
    try {
      await db.doc("transfers/" + u).delete();
    } catch {}
    return;
  }
  try {
    await db.doc("players/" + s.uid).set({
      alias: old.alias,
      gender: old.gender,
      team: old.team,
      look: old.look,
      done: old.done,
      quiz: old.quiz || {},
      createdAt: old.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await db.doc("players/" + from).delete();
    await db.doc("transfers/" + u).delete();
    setState({
      me: { ...old, id: s.uid },
      draft: null,
      teamChecked: true,
      phase: "ready",
      tab: "today"
    });
    queueReveal({
      kicker: "Welcome back",
      title: old.alias,
      text: `Your character and ${plural(
        stats(old).n,
        "day"
      )} of reading moved to the username ${u}.`,
      art: <Frame look={old.look} n={stats(old).n} className="mid" />
    });
  } catch (e) {
    toast("Couldn't move your old progress. Ask your leader to try Recover again.");
  }
}
