import { quizPick, quizNext } from "@/actions";

// One question: the verse, four choices, and (after answering) feedback with the full verse.
export default function QuizQuestion({ q }) {
  const total = q.qs.length;
  const cur = q.qs[q.i];
  const picked = q.picks[q.i];
  const answered = picked !== undefined;
  return (
    <section className="card quiz">
      <div className="qz-top">
        <p className="eyebrow">
          Day {q.day} quiz · {cur.kind}
        </p>
        <span className="qz-dots">
          {q.qs.map((x, i) => (
            <i
              key={i}
              className={i < q.i ? (q.picks[i] === x.answer ? "ok" : "no") : i === q.i ? "cur" : ""}
            ></i>
          ))}
        </span>
      </div>
      <h3>{cur.prompt}</h3>
      <blockquote className="qz-verse" dangerouslySetInnerHTML={{ __html: cur.body }} />
      <div className="qz-opts">
        {cur.options.map(o => (
          <button
            key={o}
            className={
              "qz-opt" +
              (answered ? (o === cur.answer ? " right" : o === picked ? " wrong" : " dim") : "")
            }
            disabled={answered}
            onClick={() => quizPick(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {answered ? (
        <>
          <div className={"qz-fb " + (picked === cur.answer ? "ok" : "no")}>
            <b>{picked === cur.answer ? "Correct!" : `The answer is “${cur.answer}”.`}</b>
            <p className="small">
              {cur.v.t} <span className="muted">({cur.v.ref})</span>
            </p>
          </div>
          <button className="btn go big" onClick={quizNext}>
            {q.i + 1 < total ? "Next question" : "See my score"} →
          </button>
        </>
      ) : null}
    </section>
  );
}
