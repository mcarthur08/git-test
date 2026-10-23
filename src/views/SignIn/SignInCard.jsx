import { useStore } from "@/store.js";
import { IN_APP_BROWSER, ON_FIREBASE_HOST } from "@/lib/account.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { authAction, setAuth } from "@/actions";
import { GoogleG, UserForm, EmailForm, FinishEmailForm } from "./forms.jsx";

// What the card shows depends on where sign-in is: finishing an email link, waiting for one, or choosing a method.
function SignInBody({ a }) {
  if (a.finishEmail) {
    return <FinishEmailForm />;
  }
  if (a.sent) {
    return (
      <>
        <div className="note">
          We sent a sign-in link to <b>{a.sent}</b>. Open it on this phone or computer to finish.
          Check your spam folder if it doesn't show up.
        </div>
        <div>
          <button className="btn sm" onClick={() => authAction("reset")}>
            Use a different email
          </button>
        </div>
      </>
    );
  }
  return (
    <>
      {IN_APP_BROWSER && !ON_FIREBASE_HOST ? (
        <div className="note small">
          You're in another app's built-in browser, where Google sign-in may not open. Use your
          browser's menu to <b>Open in Safari</b> or <b>Open in Chrome</b>, or use a username below.
        </div>
      ) : null}
      <button className="btn google big" onClick={() => authAction("google")} disabled={!!a.busy}>
        <GoogleG /> Continue with Google
      </button>
      <div className="or">
        <span>or</span>
      </div>
      <div className="seg" role="group" aria-label="Other ways to sign in">
        <button
          onClick={() => setAuth({ alt: "user", error: "" })}
          aria-pressed={a.alt !== "email"}
        >
          Username
        </button>
        <button
          onClick={() => setAuth({ alt: "email", error: "" })}
          aria-pressed={a.alt === "email"}
        >
          Email link
        </button>
      </div>
      {a.alt === "email" ? <EmailForm a={a} /> : <UserForm a={a} />}
    </>
  );
}

export default function SignInCard() {
  const a = useStore(s => s.auth);
  return (
    <div className="card w-card">
      <h2>Start your quest</h2>
      <p className="muted small">
        Sign in so your character and progress follow you on any phone or computer.
      </p>
      <SignInBody a={a} />
      {a.error ? (
        <p className="small" style={{ color: "var(--rose)" }}>
          {a.error}
        </p>
      ) : null}
      <p className="w-trust">
        <Icon k="check" /> Free, no ads <Icon k="check" /> The group only sees your character's name
      </p>
    </div>
  );
}
