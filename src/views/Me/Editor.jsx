import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore, setState } from "@/store.js";
import { stats, takenAliases, draftName, aliasOf } from "@/lib/player.js";
import { joinOrSave } from "@/actions";
import EditorPreview from "./EditorPreview.jsx";
import EditorTabs from "./EditorTabs.jsx";
import IdentitySection from "./IdentitySection.jsx";
import AccountSection from "./AccountSection.jsx";
import {
  RoleSection,
  FaceSection,
  HairSection,
  ClothingSection,
  GearSection
} from "./LookSections.jsx";

function saveHint({ nm0, aliasTaken, onboarding }) {
  if (!nm0) {
    return "Pick a name at the top to continue.";
  }
  if (aliasTaken) {
    return "That name is taken. Add a hometown or pick another.";
  }
  return onboarding ? "Everything can be changed later." : "Changes show on the leaderboard.";
}

const TABS = [
  { id: "name", label: "Name" },
  { id: "role", label: "Role" },
  { id: "face", label: "Face" },
  { id: "hair", label: "Hair" },
  { id: "clothes", label: "Clothes" },
  { id: "gear", label: "Gear" }
];

// The pinned character and tabs sit under the page's own sticky header, whose height depends on the device.
function useHeaderHeight() {
  useLayoutEffect(() => {
    const top = document.getElementById("top");
    if (!top) {
      return undefined;
    }
    const root = document.documentElement.style;
    const set = () => root.setProperty("--top-h", top.offsetHeight + "px");
    set();
    const ro = new ResizeObserver(set);
    ro.observe(top);
    return () => ro.disconnect();
  }, []);
}

// Creating a character (onboarding) or editing yours (the Me tab). Edits happen on a draft until you save.
export default function Editor({ onboarding }) {
  const { draft, me, config, players, readOnly, fullEditor, backend, account } = useStore();
  const [tab, setTab] = useState(onboarding ? "name" : "role");
  const panel = useRef(null);
  const first = useRef(true);
  useHeaderHeight();
  // Switching tabs while the bar is pinned shows the top of the new options instead of wherever the scroll was.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById("etab-" + tab)?.scrollIntoView({ block: "nearest", inline: "center" });
    const bar = document.querySelector(".etabs");
    if (bar && bar.getBoundingClientRect().top <= parseFloat(getComputedStyle(bar).top) + 2) {
      panel.current?.scrollIntoView({ block: "start" });
    }
  }, [tab]);
  if (!draft) {
    return null;
  }
  const n = onboarding ? 0 : stats(me).n;
  const g = draft.gender;
  const d = { ...draft, look: { ...draft.look, g } };
  const nm0 = draftName(d);
  const alias = aliasOf(d);
  const aliasTaken = !!nm0 && takenAliases(players, me).has(alias.toLowerCase());
  const ed = { d, n, g, onboarding, alias, aliasTaken, canSave: !(!nm0 || aliasTaken || readOnly) };
  // New players get a quick start: name and a ready-made look. Every detail stays one tap away.
  const quick = onboarding && !fullEditor;
  const tabs = quick ? TABS.filter(t => t.id === "name" || t.id === "role") : TABS;
  const active = tabs.some(t => t.id === tab) ? tab : tabs[0].id;
  return (
    <>
      {onboarding ? (
        <section className="card stack">
          <p className="eyebrow">{config.groupName}</p>
          <h2>Create your character</h2>
          <p className="muted" style={{ maxWidth: "68ch" }}>
            {quick ? (
              <>
                Pick a name and tap <b>Surprise me</b> until you like your look. That's it. You can
                change every detail later under <b>Me</b>.
              </>
            ) : (
              "Together we're reading the whole New Testament, Matthew to Revelation, in 70 days: about 4 chapters a day. Choose a Bible name or use your own first name, dress your character the way people dressed in the first century, and you'll be placed into one of four tribes. Reading unlocks new gear."
            )}
          </p>
        </section>
      ) : null}
      <section className="card editor">
        <EditorPreview ed={ed} />
        <div className="stack ed-main" style={{ gap: 18 }}>
          <EditorTabs tabs={tabs} active={active} onChange={setTab} />
          <div
            id="epanel"
            role="tabpanel"
            aria-labelledby={"etab-" + active}
            className="stack"
            style={{ gap: 26 }}
            ref={panel}
          >
            {active === "name" ? (
              <>
                <IdentitySection d={d} g={g} />
                {!onboarding && backend === "firebase" && account ? (
                  <AccountSection account={account} />
                ) : null}
              </>
            ) : null}
            {active === "role" ? <RoleSection d={d} g={g} n={n} /> : null}
            {active === "face" ? <FaceSection d={d} g={g} n={n} /> : null}
            {active === "hair" ? <HairSection d={d} g={g} n={n} /> : null}
            {active === "clothes" ? <ClothingSection d={d} g={g} n={n} /> : null}
            {active === "gear" ? <GearSection d={d} g={g} n={n} /> : null}
          </div>
          {quick ? (
            <div className="quick-more">
              <p className="small muted">
                Want to choose the face, hair, clothing and more yourself?
              </p>
              <button className="btn sm" onClick={() => setState({ fullEditor: true })}>
                Customize every detail
              </button>
            </div>
          ) : null}
          <div className="save-bar">
            <div>
              <b className="alias-mirror">{alias || "Choose a name"}</b>
              <span className="small muted save-hint">
                {saveHint({ nm0, aliasTaken, onboarding })}
              </span>
            </div>
            <button className="btn go big save-btn" disabled={!ed.canSave} onClick={joinOrSave}>
              {onboarding ? "Begin the quest" : "Save changes"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
