import { PLAN } from "@/lib/data.js";
import { fmtDate, plural } from "@/lib/util.js";
import { dayDate } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Frame } from "@/components/ui/Avatar.jsx";
import { openReader, toggleDay, setTab } from "@/actions";

// The big card: your character and the reading to do next.
export default function Hero({ me, s, focus, target, behind, start, cheering, readOnly }) {
  const stage = <Frame look={me.look} n={s.n} glow={cheering} cheer={cheering} />;
  if (focus === null) {
    return (
      <section className="card">
        <div className="hero">
          {stage}
          <div className="stack">
            <p className="eyebrow">Quest complete</p>
            <h2 className="hero-day">You read the whole New Testament!</h2>
            <p>
              260 chapters, Matthew to Revelation. Your Crown of Life is waiting on the Me page.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const p = PLAN[focus - 1];
  const lead =
    target && focus !== target
      ? focus > target
        ? "Today's reading is done · read ahead"
        : "Next up"
      : target
      ? "Today's reading"
      : "Up next";
  const dateLine = start ? ` · ${fmtDate(dayDate(start, focus))}` : "";
  const pace = !target ? null : behind.length ? (
    <span className="chip soft">{plural(behind.length, "day")} to catch up</span>
  ) : (
    <span className="chip ok">
      <Icon k="check" /> On pace
    </span>
  );
  return (
    <section className="card">
      <div className="hero">
        {stage}
        <div className="stack" style={{ gap: 14 }}>
          <div className="stack" style={{ gap: 6 }}>
            <p className="eyebrow">
              {lead}
              {dateLine}
            </p>
            <h2 className="hero-day">Day {focus}</h2>
            <p className="hero-read">{p.label}</p>
          </div>
          <div className="row">
            <span className="chip">
              <Icon k="book" /> {plural(p.count, "chapter")}
            </span>
            {pace}
          </div>
          <div className="row">
            <button className="btn go big" onClick={() => openReader(focus)}>
              <Icon k="book" /> Read Day {focus}
            </button>
            <button
              className="btn"
              disabled={readOnly}
              onClick={e => toggleDay(focus, e.currentTarget)}
            >
              <Icon k="check" /> I already read it
            </button>
          </div>
          <button className="linkish" onClick={() => setTab("plan")}>
            See the full 70-day plan
          </button>
        </div>
      </div>
    </section>
  );
}
