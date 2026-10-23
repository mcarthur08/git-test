import { Fragment } from "react";
import { setState } from "@/store.js";
import { TEAM_COLORS } from "@/lib/data.js";
import { teamIndex } from "@/lib/player.js";
import { Bubble } from "@/components/ui/Avatar.jsx";
import { cheerButtons } from "@/components/ui/CheerButtons.jsx";
import { moveTeam, removePlayer } from "@/actions";
import RecoverForm from "./RecoverForm.jsx";

// One reader: avatar, tribe and streak, days read, and whatever this viewer is allowed to do (cheer, move, recover, remove).
export default function PlayerRow({ p, s }) {
  const { me, config, mode, backend, canLead, isOwner, confirmRemove, recoverFor } = s;
  const teams = config.teams;
  const isMe = me && p.id === me.id;
  const ti = teamIndex(p, teams);
  const canMove = mode === "shared" && (backend === "firebase" ? canLead : isOwner);
  const canRecover = backend === "firebase" && canLead && !isMe;
  const recovering = recoverFor === p.id;
  const cheers = cheerButtons(p, s);
  const actions = [
    cheers && <Fragment key="ch">{cheers}</Fragment>,
    canMove && (
      <select
        key="mv"
        className="tmove"
        value={ti}
        onChange={e => moveTeam(p.id, +e.target.value)}
        aria-label={`Move ${p.alias} to another tribe`}
      >
        {teams.map((t, i) => (
          <option key={i} value={i}>
            {t}
          </option>
        ))}
      </select>
    ),
    canRecover && !recovering && (
      <button
        key="rec"
        className="btn sm"
        onClick={() => setState({ recoverFor: p.id })}
        aria-label={`Recover ${p.alias} to a new account`}
      >
        Recover
      </button>
    ),
    isOwner &&
      !isMe &&
      (confirmRemove === p.id ? (
        <button key="rm" className="btn sm danger" onClick={() => removePlayer(p.id)}>
          Confirm remove
        </button>
      ) : (
        <button
          key="rm"
          className="btn sm"
          onClick={() => setState({ confirmRemove: p.id })}
          aria-label={`Remove ${p.alias}`}
        >
          Remove
        </button>
      ))
  ].filter(Boolean);
  return (
    <div className={"prow " + (isMe ? "me" : "") + (recovering ? " recovering" : "")}>
      <Bubble look={p.look} n={p.s.n} />
      <div className="who">
        <b>
          {p.alias}
          {isMe ? " (you)" : ""}
        </b>
        <span>
          {ti >= 0 ? (
            <>
              <span className="dot" style={{ background: TEAM_COLORS[ti] }} />
              {teams[ti]} ·{" "}
            </>
          ) : null}
          {p.s.streak > 0 ? `${p.s.streak}-day streak` : "no streak"}
        </span>
      </div>
      <div className="nums">
        <b>{p.s.n}/70</b>
        {p.s.chapters} chapters
      </div>
      {actions.length ? <div className="prow-acts">{actions}</div> : null}
      {canRecover && recovering ? <RecoverForm p={p} /> : null}
    </div>
  );
}
