import { useStore } from "@/store.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { startQuiz, openReader, setTab } from "@/actions";

export default function QuizResult({ q, p }) {
  const me = useStore(s => s.me);
  const total = q.qs.length;
  const score = q.picks.filter((x, i) => x === q.qs[i].answer).length;
  const best = (me.quiz || {})[q.day];
  const msg =
    score === total
      ? "Perfect! You earned a quiz point for your tribe."
      : score >= 3
      ? "Nicely done. You were paying attention!"
      : "Good effort. A quick reread will lock it in.";
  return (
    <section className="card quiz qz-end">
      <p className="eyebrow">
        Day {q.day} quiz · {p.label}
      </p>
      <div className="qz-score">
        <b>{score}</b>
        <span>/ {total}</span>
      </div>
      <h2>{score === total ? "Perfect score" : "Quiz complete"}</h2>
      <p className="muted">{msg}</p>
      {best !== undefined ? <p className="small muted">Best for this day: {best}/5</p> : null}
      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn" onClick={() => startQuiz(q.day)}>
          Try new questions
        </button>
        <button className="btn" onClick={() => openReader(q.day)}>
          <Icon k="book" /> Reread
        </button>
        <button className="btn go" onClick={() => setTab("today")}>
          Back to Today
        </button>
      </div>
    </section>
  );
}
