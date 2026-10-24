import { DAYS } from "@/lib/data.js";
import { fmtDate, plural } from "@/lib/util.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { openReader, toggleDay } from "@/actions";
import ThruControl from "./ThruControl.jsx";

// One clear next step when you're behind, a realistic date, and a shortcut for people reading on paper.
export default function CatchUpCard({ s, target, behind, readOnly }) {
  if (!behind.length) {
    return null;
  }
  const first = behind[0];
  const today = new Date();
  const lateBy = target + behind.length > DAYS;
  const plan = lateBy
    ? "Read a little extra each day and you can still finish by the last day."
    : `Read one extra day each day and you'll be caught up by ${fmtDate(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + behind.length)
      )}.`;
  return (
    <section className="card stack catchup">
      <h3>Catching up</h3>
      <p className="muted">
        You're {plural(behind.length, "day")} behind. No worries, it happens. {plan}
      </p>
      <div className="row">
        <button className="btn go" onClick={() => openReader(first.day)}>
          <Icon k="book" /> Read Day {first.day}
        </button>
        <button
          className="btn sm"
          disabled={readOnly}
          onClick={e => toggleDay(first.day, e.currentTarget)}
        >
          <Icon k="check" /> Mark read
        </button>
        <span className="small muted">{first.label}</span>
      </div>
      <ThruControl s={s} target={target} readOnly={readOnly} />
      {behind.length > 1 ? (
        <details className="pick">
          <summary className="small">Pick a specific day</summary>
          <div className="catch">
            {behind.map(d => (
              <button
                key={d.day}
                className="btn sm"
                disabled={readOnly}
                onClick={e => toggleDay(d.day, e.currentTarget)}
              >
                Day {d.day} · {d.short}
              </button>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
