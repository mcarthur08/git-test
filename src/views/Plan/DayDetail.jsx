import { useStore } from "@/store.js";
import { PLAN, SECTIONS } from "@/lib/data.js";
import { parseISO, fmtDate } from "@/lib/util.js";
import { stats, dayDate, fmtQuiz } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { openReader, toggleDay, startQuiz } from "@/actions";
import { selectDay } from "./selectDay.js";

// The selected day: read it, check it off, or quiz yourself.
export default function DayDetail({ day }) {
  const { me, config, readOnly } = useStore();
  const sel = PLAN[day - 1];
  const s = stats(me);
  const start = parseISO(config.start);
  const isDone = s.doneSet.has(sel.day);
  const date = start ? fmtDate(dayDate(start, sel.day)) : "";
  const q = (me.quiz || {})[sel.day];
  return (
    <section className="card stack" id="daydetail">
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">
            Day {sel.day}
            {date ? " · " + date : ""}
            {isDone ? " · read " + fmtDate(parseISO(me.done[sel.day])) : ""}
          </p>
          <h2>{sel.label}</h2>
        </div>
        <span className={`chip sec sec-${sel.sec}`}>{SECTIONS[sel.sec]}</span>
      </div>
      <div className="row">
        <button
          className={"btn " + (isDone ? "done-state" : "go")}
          disabled={readOnly}
          onClick={e => toggleDay(sel.day, e.currentTarget)}
        >
          <Icon k="check" /> {isDone ? "Read · tap to undo" : "I read this"}
        </button>
        <button className="btn" onClick={() => openReader(sel.day)}>
          <Icon k="book" /> Read here
        </button>
        {isDone ? (
          <button className="btn" onClick={() => startQuiz(sel.day)}>
            <Icon k="target" /> {q !== undefined ? `Quiz ${fmtQuiz(q)}` : "Quiz"}
          </button>
        ) : null}
        <button className="btn sm" onClick={() => selectDay(null)}>
          Close
        </button>
      </div>
    </section>
  );
}
