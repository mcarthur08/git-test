import { useStore } from "@/store.js";
import { DAYS, PLAN } from "@/lib/data.js";
import { plural } from "@/lib/util.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { fmtQuiz } from "@/lib/player.js";
import { openReader, toggleDay, startQuiz } from "@/actions";

// Under the text: check the day off, or (once read) go to the next day, take the quiz, or undo.
export default function FinishBlock({ day, p, s }) {
  const { me, readOnly } = useStore();
  if (!s.doneSet.has(day)) {
    return (
      <div className="rd-done">
        <p className="muted">Finished all {plural(p.count, "chapter")}?</p>
        <button
          className="btn go big"
          disabled={readOnly}
          onClick={e => toggleDay(day, e.currentTarget)}
        >
          <Icon k="check" /> I read Day {day}
        </button>
      </div>
    );
  }
  const next = day < DAYS ? PLAN[day] : null;
  const score = (me.quiz || {})[day];
  return (
    <div className="rd-done">
      <p className="eyebrow">
        <Icon k="check" /> Day {day} read
      </p>
      {next ? (
        <button className="btn go big" onClick={() => openReader(next.day)}>
          Read Day {next.day}: {next.short} →
        </button>
      ) : (
        <p>That's the whole New Testament. Well done!</p>
      )}
      <button className="btn" onClick={() => startQuiz(day)}>
        <Icon k="target" />{" "}
        {score !== undefined ? `Quiz: ${fmtQuiz(score)} · try again` : "Take the 2-minute quiz"}
      </button>
      <button className="linkish" onClick={e => toggleDay(day, e.currentTarget)}>
        Mark Day {day} as not read
      </button>
    </div>
  );
}
