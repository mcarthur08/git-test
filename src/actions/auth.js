// Signing in: Google, email link and username accounts.
import { getState, setState } from "@/store.js";
import { lsSet } from "@/lib/util.js";
import {
  USER_DOMAIN,
  cleanUsername,
  authMsg,
  userAuthMsg,
  POPUP_HELP,
  ON_FIREBASE_HOST,
  cleanUrl
} from "@/lib/account.js";
import { client } from "./firebaseClient.js";

export const setAuth = patch => setState(s => ({ auth: { ...s.auth, ...patch } }));

export async function authAction(kind) {
  if (kind === "reset") {
    setState({ auth: {} });
    return;
  }
  if (kind === "signout") {
    try {
      await client.auth.signOut();
    } catch {}
    location.reload();
    return;
  }
  if (kind === "google") {
    const provider = new client.ns.auth.GoogleAuthProvider();
    setAuth({ error: "", busy: true });
    try {
      await client.auth.signInWithPopup(provider);
    } catch (e) {
      // No redirect fallback: browsers that partition storage (iPhone Safari, in-app browsers) break redirect sign-in across domains.
      if (
        [
          "auth/popup-blocked",
          "auth/operation-not-supported-in-this-environment",
          "auth/web-storage-unsupported",
          "auth/internal-error"
        ].includes(e.code)
      ) {
        if (ON_FIREBASE_HOST) {
          try {
            await client.auth.signInWithRedirect(provider);
            return;
          } catch (e2) {
            setAuth({ error: authMsg(e2) });
          }
        } else {
          setAuth({ error: POPUP_HELP });
        }
      } else if (e.code !== "auth/popup-closed-by-user") {
        setAuth({ error: authMsg(e) });
      }
    }
    setAuth({ busy: false });
  }
}

export async function sendEmailLink(email) {
  email = email.trim();
  if (!email) {
    return;
  }
  setAuth({ busy: true, error: "" });
  try {
    await client.auth.sendSignInLinkToEmail(email, {
      url: location.origin + location.pathname,
      handleCodeInApp: true
    });
    lsSet("nt70.email", email);
    setAuth({ sent: email });
  } catch (err) {
    setAuth({ error: authMsg(err) });
  }
  setAuth({ busy: false });
}

export async function finishEmailLink(email) {
  try {
    await client.auth.signInWithEmailLink(email.trim(), location.href);
    setAuth({ finishEmail: false });
    cleanUrl();
  } catch (err) {
    setAuth({ error: authMsg(err) });
  }
}

export async function userSubmit(pw) {
  const a = getState().auth;
  const isNew = a.umode !== "login";
  const u = cleanUsername(a.uname);
  if (u.length < 3) {
    setAuth({ error: "Usernames need at least 3 letters or numbers." });
    return;
  }
  if (pw.length < 6) {
    setAuth({ error: isNew ? "Passwords need at least 6 characters." : "Enter your password." });
    return;
  }
  setAuth({ busy: true, error: "" });
  const email = `${u}@${USER_DOMAIN}`;
  try {
    if (isNew) {
      await client.auth.createUserWithEmailAndPassword(email, pw);
    } else {
      await client.auth.signInWithEmailAndPassword(email, pw);
    }
  } catch (err) {
    setAuth({ error: userAuthMsg(err, isNew) });
  }
  setAuth({ busy: false });
}
