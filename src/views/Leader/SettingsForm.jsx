import { useState } from "react";
import { useStore } from "@/store.js";
import { DEFAULT_TEAMS } from "@/lib/data.js";
import { startHint } from "@/lib/player.js";
import { saveConfig } from "@/actions";

// Group name, Day 1 date and the four tribe names.
export default function SettingsForm() {
  const { config: c, mode } = useStore();
  const [name, setName] = useState(c.groupName);
  const [start, setStart] = useState(c.start);
  const [teams, setTeams] = useState([0, 1, 2, 3].map(i => c.teams[i] || ""));
  const [msg, setMsg] = useState("");
  return (
    <section className="card stack">
      <h2>Leader settings</h2>
      <p className="muted small" style={{ maxWidth: "68ch" }}>
        {mode === "shared"
          ? "These settings apply to everyone in the group."
          : "You're in solo mode, so these settings only apply on this device."}
      </p>
      <form
        className="lead-grid"
        id="leadform"
        onSubmit={e => {
          e.preventDefault();
          saveConfig({ groupName: name, start, teams }, setMsg);
        }}
      >
        <div className="field">
          <label htmlFor="cfg-name">Group name</label>
          <input
            type="text"
            id="cfg-name"
            maxLength={40}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cfg-start">Day 1 date</label>
          <input
            type="date"
            id="cfg-start"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
          <span className="small muted" id="starthint">
            {startHint(start)}
          </span>
        </div>
        <div className="field">
          <span className="lbl">Tribe names (players are assigned automatically and evenly)</span>
          {teams.map((t, i) => (
            <input
              key={i}
              type="text"
              id={"cfg-team" + i}
              maxLength={30}
              aria-label={`Team ${i + 1}`}
              value={t}
              placeholder={DEFAULT_TEAMS[i]}
              onChange={e => setTeams(ts => ts.map((x, k) => (k === i ? e.target.value : x)))}
            />
          ))}
        </div>
        <div className="row">
          <button className="btn go" type="submit">
            Save settings
          </button>
          <span className="small muted" id="leadmsg">
            {msg}
          </span>
        </div>
      </form>
    </section>
  );
}
