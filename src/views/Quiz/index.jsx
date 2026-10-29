import { useEffect } from "react";
import { useStore } from "@/store.js";
import { PLAN, CHAPTERS } from "@/lib/data.js";
import { BackButton } from "@/components/ui/BackButton.jsx";
import { LoadingDots } from "@/components/ui/LoadingDots.jsx";
import Today from "@/views/Today/index.jsx";
import { loadBooks, prepareQuiz } from "@/actions";
import QuizQuestion from "./QuizQuestion.jsx";
import QuizResult from "./QuizResult.jsx";

// The daily quiz: load the day's text, build seven questions, ask them, show the score.
export default function Quiz() {
  const { quiz: q, kjv } = useStore();
  const p = PLAN[(q ? q.day : 1) - 1];
  const books = [...new Set(CHAPTERS.slice(p.from, p.to).map(c => c.b))];
  const missing = books.filter(b => !(b in kjv)).join("|");
  const failed = books.some(b => kjv[b] === null);
  const ready = books.every(b => kjv[b]);
  useEffect(() => {
    if (q && missing) {
      loadBooks(missing.split("|"));
    }
  }, [q && q.day, missing]);
  useEffect(() => {
    if (q && ready && !q.qs) {
      prepareQuiz();
    }
  }, [q && q.day, q && !!q.qs, ready]);
  if (!q) {
    return <Today />;
  }

  const back = <BackButton tab={q.from === "read" ? "today" : q.from || "today"} label="Done" />;
  if (failed) {
    return (
      <>
        {back}
        <div className="note warn">
          Couldn't load the Bible text for this quiz. Check your connection and try again.
        </div>
      </>
    );
  }
  if (!ready || !q.qs) {
    return (
      <>
        {back}
        <section className="card">
          <LoadingDots>Preparing your quiz…</LoadingDots>
        </section>
      </>
    );
  }
  return (
    <>
      {back}
      {q.i >= q.qs.length ? <QuizResult q={q} p={p} /> : <QuizQuestion q={q} />}
    </>
  );
}
