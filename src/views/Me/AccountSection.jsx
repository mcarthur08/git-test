import { usernameOf } from "@/lib/account.js";
import { authAction } from "@/actions";

// Who you're signed in as (only you see this), with sign out.
export default function AccountSection({ account }) {
  const user = usernameOf(account.email);
  return (
    <div className="field acct">
      <span className="lbl">Account</span>
      <p className="small muted">
        {user ? (
          <>
            Signed in with the username <b>{user}</b>. Keep your password somewhere safe. If you
            forget it, make a new username and ask a leader to Recover your progress.
          </>
        ) : (
          <>Signed in{account.email ? ` as ${account.email}` : ""}.</>
        )}{" "}
        Only you see this.
      </p>
      <p className="small muted">
        Account ID (your leader may ask for it): <code>{account.uid}</code>
      </p>
      <div>
        <button className="btn sm" onClick={() => authAction("signout")}>
          Sign out
        </button>
      </div>
    </div>
  );
}
