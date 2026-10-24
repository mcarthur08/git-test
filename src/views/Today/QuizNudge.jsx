import { PLAN } from "@/lib/data.js";
import { startQuiz } from "@/actions";

// Offers the quiz for the most recent day read that hasn't been quizzed yet.
export default function QuizNudge({ me }) {
  const days = Object.keys(me.done).map(Number);
  if (!days.length) {
    return null;
  }
  const last = Math.max(...days);
  if ((me.quiz || {})[last] !== undefined) {
    return null;
  }
  return (
    <section className="card row between quiz-nudge">
      <div>
        <p className="eyebrow">1-minute refresher</p>
        <b>Quiz yourself on Day {last}</b>
        <p className="small muted">5 quick questions from {PLAN[last - 1].label}.</p>
      </div>
      <button className="btn go" onClick={() => startQuiz(last)}>
        Take the quiz
      </button>
    </section>
  );
}
