// Starting the app: Firebase (or solo mode), the Firestore listeners and the first render.
import { getState, setState } from "@/store.js";
import { TABS, CHEER_KINDS, DEFAULT_CONFIG } from "@/lib/data.js";
import { lsGet } from "@/lib/util.js";
import { normPlayer, normConfig, draftFrom, newDraft } from "@/lib/player.js";
import { authMsg, ON_FIREBASE_HOST, cleanUrl } from "@/lib/account.js";
import { FIREBASE_CONFIG } from "@/firebase-config.js";
import { toast } from "./ui.js";
import { savePending } from "./saving.js";
import { ensureTeam, checkTransfer } from "./tribes.jsx";
import { setAuth } from "./auth.js";
import { client } from "./firebaseClient.js";
import { markChatSeen, chatSeenStored } from "./chat.js";
import { loadMark, takeRemoteMark } from "./bookmark.js";

export async function startFirebase(cfg) {
  client.ns = (await import("firebase/compat/app")).default;
  await Promise.all([import("firebase/compat/auth"), import("firebase/compat/firestore")]);
  const firebase = client.ns;
  // On Firebase Hosting the page and the sign-in handler share one domain, so redirect sign-in works everywhere.
  firebase.initializeApp(ON_FIREBASE_HOST ? { ...cfg, authDomain: location.hostname } : cfg);
  const auth = firebase.auth();
  const fs = firebase.firestore();
  fs.doc("config/plan")
    .get()
    .then(d => {
      if (d.exists && !getState().uid) {
        setState({ config: normConfig(d.data()) });
      }
    })
    .catch(() => {});
  if (ON_FIREBASE_HOST) {
    auth.getRedirectResult().catch(e => setAuth({ error: authMsg(e) }));
  }
  client.auth = auth;
  setState({ backend: "firebase" });
  if (auth.isSignInWithEmailLink(location.href)) {
    const email = lsGet("nt70.email");
    if (email) {
      try {
        await auth.signInWithEmailLink(email, location.href);
      } catch (e) {
        setAuth({ error: authMsg(e) });
      }
      cleanUrl();
    } else {
      setAuth({ finishEmail: true });
    }
  }
  auth.onAuthStateChanged(async u => {
    if (!u) {
      if (getState().uid) {
        location.reload();
        return;
      }
      setState({ phase: "signin" });
      return;
    }
    if (getState().uid) {
      return;
    }
    setState({ account: { email: u.email || "", uid: u.uid } });
    const admin = await fs
      .doc("admins/" + u.uid)
      .get()
      .then(d => d.exists)
      .catch(() => false);
    startShared(fs, u.uid, { canLead: admin, isOwner: admin, readOnly: false });
  });
}

/* ---------- start-up ---------- */
const hashTab = () => {
  const h = (location.hash || "").slice(1);
  return h ? (TABS.some(([k]) => k === h) ? h : "today") : null;
};

export function startLocal() {
  const me = normPlayer(lsGet("nt70.me"), "local");
  const tab = me ? hashTab() : null;
  setState({
    mode: "local",
    canLead: true,
    config: normConfig(lsGet("nt70.config") || DEFAULT_CONFIG),
    me,
    playersLoaded: true,
    phase: me ? "ready" : "join",
    ...(me ? {} : { draft: newDraft() }),
    ...(tab ? { tab } : {})
  });
  loadMark();
  if (me) {
    ensureTeam();
  }
}

export function startShared(db, uid, perms) {
  const tab = hashTab();
  setState({
    mode: "shared",
    db,
    uid,
    canLead: perms.canLead,
    isOwner: perms.isOwner,
    readOnly: perms.readOnly,
    phase: "loading",
    ...(tab ? { tab } : {})
  });
  setState({ chatSeen: chatSeenStored() }); // read after uid is set: it's stored per account
  loadMark();
  // The reading bookmark follows the account across devices.
  db.doc("bookmarks/" + uid).onSnapshot(
    snap => {
      if (snap.exists) {
        takeRemoteMark(snap.data());
      }
    },
    () => {}
  );

  db.collection("cheers").onSnapshot(
    snap => {
      setState({
        cheers: snap.docs
          .map(d => d.data())
          .filter(
            c =>
              c && typeof c.to === "string" && typeof c.from === "string" && c.kind in CHEER_KINDS
          )
      });
    },
    () => {}
  );
  db.collection("replies").onSnapshot(
    snap => {
      setState({
        replies: snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(
            r =>
              r &&
              typeof r.text === "string" &&
              Number.isInteger(r.week) &&
              typeof r.uid === "string"
          )
      });
    },
    () => {}
  );
  db.collection("messages").onSnapshot(
    snap => {
      const messages = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(
          m =>
            m && typeof m.text === "string" && typeof m.uid === "string" && typeof m.at === "string"
        )
        .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
      setState({ messages });
      if (getState().tab === "chat" && !document.hidden) {
        markChatSeen();
      }
    },
    () => {}
  );
  // Only leaders can read reports.
  if (perms.canLead) {
    db.collection("reports").onSnapshot(
      snap => {
        setState({
          reports: snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(r => r && typeof r.msg === "string")
        });
      },
      () => {}
    );
  }
  db.doc("config/plan").onSnapshot(
    snap => {
      setState({ config: normConfig(snap.exists ? snap.data() : DEFAULT_CONFIG) });
    },
    () => {}
  );

  db.collection("players").onSnapshot(
    snap => {
      const players = {};
      snap.docs.forEach(d => {
        const p = normPlayer(d.data(), d.id);
        if (p) {
          players[d.id] = p;
        }
      });
      const before = getState();
      const mine = players[uid];
      const patch = { players };
      if (mine && !savePending()) {
        patch.me = mine;
      }
      if (!before.playersLoaded && !snap.metadata.fromCache) {
        patch.playersLoaded = true;
        if (patch.me || before.me) {
          patch.phase = "ready";
        } else {
          patch.phase = "join";
          patch.draft = newDraft();
        }
      } else if ((before.phase === "loading" || before.phase === "join") && mine) {
        patch.me = mine;
        patch.phase = "ready";
      }
      setState(patch);
      let s = getState();
      if (s.phase === "ready" && s.tab === "me" && !s.draft) {
        setState({ draft: draftFrom(s.me) });
      }
      if (s.playersLoaded) {
        checkTransfer();
      }
      s = getState();
      if (
        s.phase === "ready" &&
        s.playersLoaded &&
        !(s.backend === "firebase" && !s.transferChecked)
      ) {
        ensureTeam();
      }
    },
    () => {
      if (getState().phase === "loading") {
        startLocal();
        toast("Couldn't reach the group. Playing solo for now.");
      }
    }
  );

  setTimeout(() => {
    const s = getState();
    if (s.phase === "loading" && !s.playersLoaded) {
      setState({
        playersLoaded: true,
        phase: s.me ? "ready" : "join",
        ...(s.me ? {} : { draft: newDraft() })
      });
    }
  }, 8000);
}

export async function boot() {
  const rd = lsGet("nt70.rd");
  if (rd) {
    setState({ rdSize: Number.isInteger(rd.size) ? rd.size : 2, rdLight: !!rd.light });
  }
  const c = window.claude;
  if (c && typeof c.use === "function") {
    let db = null;
    let user = null;
    try {
      [db, user] = await Promise.all([c.use("db"), c.use("user")]);
    } catch {}
    const uid = user ? await user.id().catch(() => null) : null;
    if (!db || !uid) {
      startLocal();
      return;
    }
    setState({ backend: "claude" });
    const [canEdit, isOwner, canWrite] = await Promise.all([
      user.canEdit().catch(() => false),
      user.isOwner().catch(() => false),
      user.can("data.write").catch(() => null)
    ]);
    startShared(db, uid, { canLead: canEdit || isOwner, isOwner, readOnly: canWrite === false });
    return;
  }
  const cfg = FIREBASE_CONFIG;
  if (cfg && cfg.apiKey && !/^PASTE/.test(cfg.apiKey)) {
    try {
      await startFirebase(cfg);
    } catch {
      startLocal();
      toast("Couldn't connect to sign-in. Playing solo for now.");
    }
    return;
  }
  startLocal();
}
