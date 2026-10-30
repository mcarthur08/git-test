// Sign-in helpers: username accounts, error messages and browser detection.

export const USER_DOMAIN = "users.nt70-quest.web.app";
export const cleanUsername = v =>
  String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/([._-])[._-]+/g, "$1")
    .slice(0, 24)
    .replace(/^[._-]+|[._-]+$/g, "");
export const usernameOf = email =>
  email && email.endsWith("@" + USER_DOMAIN) ? email.slice(0, -USER_DOMAIN.length - 1) : "";

export const POPUP_HELP =
  "Google sign-in can't open in this browser. If you tapped the link inside another app (Messages, Instagram, Gmail, Claude…), open it in Safari or Chrome instead, or sign in with a username below.";
export function authMsg(e) {
  const c = (e && e.code) || "";
  if (c === "auth/invalid-email") {
    return "That email address doesn't look right.";
  }
  if (c === "auth/invalid-action-code" || c === "auth/expired-action-code") {
    return "That sign-in link has expired or was already used. Request a new one.";
  }
  if (c === "auth/unauthorized-domain") {
    return "This web address isn't approved for sign-in yet. Your leader needs to add it in Firebase (see SETUP.md).";
  }
  if (c === "auth/operation-not-allowed") {
    return "This sign-in method isn't turned on yet. Your leader needs to enable it in Firebase.";
  }
  if (
    c === "auth/popup-blocked" ||
    c === "auth/operation-not-supported-in-this-environment" ||
    c === "auth/web-storage-unsupported"
  ) {
    return POPUP_HELP;
  }
  if (c === "auth/network-request-failed") {
    return "No connection. Check your internet and try again.";
  }
  return "Sign-in didn't work. Please try again.";
}

// Built-in browsers inside other apps block the Google sign-in window.
export const IN_APP_BROWSER =
  /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|musical_ly|GSA\/|Twitter|LinkedInApp|; wv\)/i.test(
    navigator.userAgent || ""
  );
export const ON_FIREBASE_HOST = /\.(web\.app|firebaseapp\.com)$/.test(location.hostname);
export const cleanUrl = () => {
  try {
    history.replaceState(null, "", location.pathname);
  } catch {}
};
export function userAuthMsg(e, isNew) {
  const c = (e && e.code) || "";
  if (c === "auth/email-already-in-use") {
    return "That username is taken. Pick another, or tap “I have an account” if it's yours.";
  }
  if (
    [
      "auth/invalid-credential",
      "auth/invalid-login-credentials",
      "auth/wrong-password",
      "auth/user-not-found"
    ].includes(c)
  ) {
    return isNew
      ? "Couldn't create that account. Try a different username."
      : "That username and password don't match. Check the spelling, or tap “New here” to create an account.";
  }
  if (c === "auth/weak-password") {
    return "Passwords need at least 6 characters.";
  }
  if (c === "auth/too-many-requests") {
    return "Too many tries. Wait a few minutes and try again.";
  }
  if (c === "auth/operation-not-allowed") {
    return "Username sign-in isn't turned on yet. Your leader needs to enable Email/Password in Firebase.";
  }
  return authMsg(e);
}
