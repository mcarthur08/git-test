import { setState, useStore } from "@/store.js";
import { TOTAL, VICTORIES } from "@/lib/data.js";
import { plural } from "@/lib/util.js";
import { BADGES } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { MedalIc, VictoryMedal } from "@/components/ui/Emblems.jsx";
import { Count } from "@/components/ui/Count.jsx";
import ThruControl from "./ThruControl.jsx";

const Stat = ({ k, val, unit, label, color, ic }) => (
  <div className="stat">
    <span className="ic" style={{ color }}>
      <Icon k={ic} />
    </span>
    <b>
      <Count k={k} value={val} />
      {unit ? <small>{unit}</small> : null}
    </b>
    <span className="sl">{label}</span>
  </div>
);

function NextVictory({ nv, n }) {
  return (
    <div className="row" style={{ gap: 14, flexWrap: "nowrap", minWidth: 0 }}>
      <VictoryMedal
        i={VICTORIES.indexOf(nv)}
        style={{ width: 46, height: 46, flex: "none", filter: "grayscale(.6)", opacity: 0.8 }}
      />
      <div style={{ minWidth: 0 }}>
        <p className="eyebrow">Next Victory Moment · Day {nv.day}</p>
        <b>{nv.title}</b>
        <p className="small muted">
          {plural(nv.day - n, "more day")} to unlock this story from {nv.ref}.
        </p>
      </div>
    </div>
  );
}

function BadgeGrid({ s }) {
  return (
    <div>
      <div className="row between" style={{ marginBottom: 8 }}>
        <b>Badges</b>
        <span className="small muted">
          {BADGES.filter(b => b.test(s)).length} of {BADGES.length}
        </span>
      </div>
      <div className="badges">
        {BADGES.map(b => (
          <div key={b.name} className={"badge " + (b.test(s) ? "" : "locked")}>
            <MedalIc b={b} />
            <div>
              <b>{b.name}</b>
              <span>{b.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// The "My progress" drawer: stats, next Victory Moment and badges.
export default function ProgressDetails({ s, behind, target, readOnly }) {
  const openProgress = useStore(st => st.openProgress);
  const nv = VICTORIES.find(v => v.day > s.n);
  const pct = Math.round((s.chapters / TOTAL) * 100);
  return (
    <details
      className="card more"
      id="more"
      open={openProgress}
      onToggle={e => setState({ openProgress: e.currentTarget.open })}
    >
      <summary>
        <span>
          <h3>My progress</h3>
          <span className="small muted">
            Stats, badges{nv ? " and your next Victory Moment" : ""}
          </span>
        </span>
        <Icon k="plan" />
      </summary>
      <div className="stack" style={{ gap: 16, marginTop: 14 }}>
        <div className="stats">
          <Stat k="days" val={s.n} unit="/70" label="days done" color="var(--teal)" ic="plan" />
          <Stat
            k="ch"
            val={s.chapters}
            unit=""
            label="of 260 chapters"
            color="var(--sky)"
            ic="book"
          />
          <Stat
            k="streak"
            val={s.streak}
            unit=""
            label={`day streak · best ${s.best}`}
            color="var(--flame)"
            ic="flame"
          />
          <Stat
            k="pct"
            val={pct}
            unit="%"
            label="of the New Testament"
            color="var(--violet)"
            ic="target"
          />
        </div>
        {nv ? <NextVictory nv={nv} n={s.n} /> : null}
        <BadgeGrid s={s} />
        {behind.length ? null : <ThruControl s={s} target={target} readOnly={readOnly} />}
      </div>
    </details>
  );
}
