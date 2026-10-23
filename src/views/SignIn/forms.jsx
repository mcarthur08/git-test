// The sign-in forms: username + password, email link, and finishing an email link.
import { useState } from "react";
import { cleanUsername } from "@/lib/account.js";
import { setAuth, sendEmailLink, finishEmailLink, userSubmit } from "@/actions";

export const GoogleG = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
    />
  </svg>
);

export function UserForm({ a }) {
  const [pw, setPw] = useState("");
  const isNew = a.umode !== "login";
  const u = cleanUsername(a.uname);
  return (
    <form
      id="userform"
      className="stack"
      style={{ gap: 10 }}
      onSubmit={e => {
        e.preventDefault();
        userSubmit(pw);
      }}
    >
      <div className="seg" role="group" aria-label="New or returning">
        <button
          type="button"
          onClick={() => setAuth({ umode: "new", error: "" })}
          aria-pressed={isNew}
        >
          New here
        </button>
        <button
          type="button"
          onClick={() => setAuth({ umode: "login", error: "" })}
          aria-pressed={!isNew}
        >
          I have an account
        </button>
      </div>
      <input
        type="text"
        id="u-name"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        maxLength={30}
        placeholder="Username, e.g. jordan.smith"
        aria-label="Username"
        value={a.uname || ""}
        onChange={e => setAuth({ uname: e.target.value })}
      />
      <span className="small muted" id="u-preview">
        {u ? (
          <>
            Your username: <b>{u}</b>
          </>
        ) : (
          "Letters, numbers and dots. Spaces become dots."
        )}
      </span>
      <input
        type="password"
        id="u-pass"
        autoComplete={isNew ? "new-password" : "current-password"}
        placeholder={isNew ? "Choose a password (6+ characters)" : "Password"}
        aria-label="Password"
        value={pw}
        onChange={e => setPw(e.target.value)}
      />
      <button className="btn go" type="submit" disabled={!!a.busy}>
        {isNew ? "Create account" : "Sign in"}
      </button>
      {isNew ? (
        <p className="small muted">
          No email needed. <b>Write down your username and password</b>. If you ever forget the
          password, a leader can move your progress to a new username.
        </p>
      ) : (
        <p className="small muted">
          Forgot your password? Tap “New here”, make a new username, and ask a leader to tap{" "}
          <b>Recover</b> on your old character.
        </p>
      )}
    </form>
  );
}

export function EmailForm({ a }) {
  const [email, setEmail] = useState("");
  return (
    <form
      id="emailform"
      className="row"
      style={{ flexWrap: "nowrap" }}
      onSubmit={e => {
        e.preventDefault();
        sendEmailLink(email);
      }}
    >
      <input
        type="email"
        id="si-email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        aria-label="Email address"
        style={{ flex: 1, minWidth: 0 }}
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button className="btn dark" type="submit" disabled={!!a.busy}>
        Send link
      </button>
    </form>
  );
}

export function FinishEmailForm() {
  const [email, setEmail] = useState("");
  return (
    <form
      id="emailfinish"
      className="stack"
      onSubmit={e => {
        e.preventDefault();
        finishEmailLink(email);
      }}
    >
      <label htmlFor="fin-email" className="small">
        Confirm the email address you used
      </label>
      <input
        type="email"
        id="fin-email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button className="btn go" type="submit">
        Finish signing in
      </button>
    </form>
  );
}
