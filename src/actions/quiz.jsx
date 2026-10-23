// Running the daily quiz: starting, answering and scoring.
import { getState, setState } from "@/store.js";
import { stats, BADGES } from "@/lib/player.js";
import { makeQuiz } from "@/lib/quiz.js";
import { MedalIc } from "@/components/ui/Emblems.jsx";
import { confetti, queueReveal } from "./ui.js";
import { setTab } from "./navigation.js";
import { saveMe } from "./saving.js";

export function startQuiz(day, from) {
  const s = getState();
  setState({ quiz: { day, qs: null, i: 0, picks: [], from: from || s.tab } });
  if (s.tab !== "quiz") {
    setTab("quiz");
  }
}

export function prepareQuiz() {
  const { quiz, kjv } = getState();
  if (quiz && !quiz.qs) {
    setState({ quiz: { ...quiz, qs: makeQuiz(quiz.day, kjv) } });
  }
}

export function quizPick(val) {
  const q = getState().quiz;
  if (!q || !q.qs || q.picks[q.i] !== undefined) {
    return;
  }
  const picks = q.picks.slice();
  picks[q.i] = val;
  setState({ quiz: { ...q, picks } });
}

export function quizNext() {
  const s = getState();
  const q = s.quiz;
  if (!q) {
    return;
  }
  const i = q.i + 1;
  setState({ quiz: { ...q, i } });
  if (i >= q.qs.length && s.me && !s.readOnly) {
    const score = q.picks.filter((x, k) => x === q.qs[k].answer).length;
    const prev = (s.me.quiz || {})[q.day];
    if (prev === undefined || score > prev) {
      const before = stats(s.me);
      const me = { ...s.me, quiz: { ...(s.me.quiz || {}), [q.day]: score } };
      setState({ me });
      const after = stats(me);
      BADGES.filter(b => b.test(after) && !b.test(before)).forEach(b =>
        queueReveal({
          kicker: "Badge earned",
          title: b.name,
          text: b.desc + ".",
          art: <MedalIc b={b} />
        })
      );
      saveMe();
    }
    if (score === q.qs.length) {
      confetti(innerWidth / 2, innerHeight / 3, 40);
    }
  }
  window.scrollTo({ top: 0 });
}
