import { useStore } from "@/store.js";
import { lookSummary } from "@/lib/look.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Frame } from "@/components/ui/Avatar.jsx";
import { surprise, joinOrSave, openViewer } from "@/actions";

// The character beside (on a phone, above) the options, with the chosen name and the save button. It stays pinned
// on screen while the options scroll, so every change can be seen as it is made.
export default function EditorPreview({ ed }) {
  const readOnly = useStore(s => s.readOnly);
  const { d, n, onboarding, alias, aliasTaken, canSave } = ed;
  const sub = lookSummary(d.look, n);
  return (
    <div className={"preview" + (aliasTaken ? " taken" : "")}>
      <Frame
        look={d.look}
        n={n}
        className="big"
        onExpand={() => openViewer({ look: d.look, n, name: alias || "Your character", sub })}
      />
      <div className="pv-info">
        <div className="alias" id="alias-preview">
          {alias || "Choose a name"}
        </div>
        <p className="small muted pv-sum">{sub}</p>
        <p className="small" id="alias-taken" style={{ color: "var(--rose)" }} hidden={!aliasTaken}>
          Someone already has that name. Add a hometown or pick another.
        </p>
        {onboarding ? (
          <button className="btn" onClick={surprise}>
            <Icon k="star" /> Surprise me
          </button>
        ) : null}
        <button className="btn go save-btn" disabled={!canSave} onClick={joinOrSave}>
          {onboarding ? "Begin the quest" : "Save changes"}
        </button>
        {!onboarding ? (
          <p className="small muted pv-note">
            {readOnly ? "Saving is turned off for you." : "Saves to the group leaderboard."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
