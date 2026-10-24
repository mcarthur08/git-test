import { useState } from "react";
import { setState } from "@/store.js";
import { startRecover } from "@/actions";

// A leader points an old character at the new username its owner signed up with.
export default function RecoverForm({ p }) {
  const [name, setName] = useState("");
  return (
    <div className="recover">
      <label className="small" htmlFor="rec-name">
        New username for {p.alias}
      </label>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <input
          type="text"
          id="rec-name"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          placeholder="e.g. jordan.smith2"
          style={{ flex: 1, minWidth: 0 }}
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button className="btn sm go" onClick={() => startRecover(p.id, name)}>
          Move
        </button>
        <button className="btn sm" onClick={() => setState({ recoverFor: null })}>
          Cancel
        </button>
      </div>
      <span className="small muted">
        Their progress moves the next time they sign in with that username.
      </span>
    </div>
  );
}
