import { STOPS } from "@/lib/data.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { selectStop } from "@/actions";

export default function StopList({ n, sel }) {
  return (
    <section className="card stack">
      <h3>All stops</h3>
      <ol className="stoplist">
        {STOPS.map((t, i) => (
          <li key={i} className={(n >= t.day ? "reached" : "") + (i === sel ? " cur" : "")}>
            <button onClick={() => selectStop(i)}>
              <span className="sn">{n >= t.day ? <Icon k="check" /> : i + 1}</span>
              <span>
                <b>{t.place}</b>
                <span className="small muted">
                  {t.title} · day {t.day}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
