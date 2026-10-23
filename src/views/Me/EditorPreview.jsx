import { useStore } from "@/store.js";
import { COVERS, MANTLES } from "@/lib/data.js";
import { normLook } from "@/lib/avatar.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Frame } from "@/components/ui/Avatar.jsx";
import { surprise, joinOrSave } from "@/actions";

// The portrait beside the form, the chosen name, and the save button.
export default function EditorPreview({ ed }) {
  const readOnly = useStore(s => s.readOnly);
  const { d, n, g, onboarding, alias, aliasTaken, canSave } = ed;
  const L = normLook(d.look, n);
  return (
    <div className="preview">
      <Frame look={d.look} n={n} className="big" />
      <div className="alias" id="alias-preview">
        {alias || "Choose a name"}
      </div>
      <p className="small muted" style={{ textAlign: "center" }}>
        {g === "f" ? "Sister" : "Brother"}
        {L.cover ? " · " + COVERS[g][L.cover][0] : ""} · {MANTLES[g][L.mantle][0]}{" "}
        {g === "f" ? "shawl" : "mantle"}
      </p>
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
        <p className="small muted" style={{ textAlign: "center" }}>
          {readOnly ? "Saving is turned off for you." : "Saves to the group leaderboard."}
        </p>
      ) : null}
    </div>
  );
}
