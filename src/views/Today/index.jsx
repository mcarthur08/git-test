import { useStore } from "@/store.js";
import { DAYS, PLAN } from "@/lib/data.js";
import { parseISO } from "@/lib/util.js";
import { stats, planDay, nextUndone } from "@/lib/player.js";
import StartBanner from "./StartBanner.jsx";
import RecapCard from "./RecapCard.jsx";
import ContinueCard from "./ContinueCard.jsx";
import Hero from "./Hero.jsx";
import ProgressSummary from "./ProgressSummary.jsx";
import QuizNudge from "./QuizNudge.jsx";
import CheersReceivedCard from "./CheersReceivedCard.jsx";
import CatchUpCard from "./CatchUpCard.jsx";
import TripCard from "./TripCard.jsx";
import ProgressDetails from "./ProgressDetails.jsx";
import { InstallCard } from "@/components/ui/InstallCard.jsx";

// The home screen: today's reading, how far you are, and what to do next.
export default function Today() {
  const { me, config, readOnly, cheering } = useStore();
  const s = stats(me);
  const pd = planDay(config);
  const start = parseISO(config.start);
  const target = pd !== null && pd >= 1 && pd <= DAYS ? pd : null; // today's day number, while the quest is running
  const focus = target && !s.doneSet.has(target) ? target : nextUndone(s);
  const behind = target ? PLAN.slice(0, target - 1).filter(d => !s.doneSet.has(d.day)) : [];
  return (
    <>
      <StartBanner start={start} pd={pd} />
      <RecapCard />
      <ContinueCard s={s} />
      {readOnly ? (
        <div className="note warn">
          You can look around, but your progress can't be saved yet. Ask your leader for access.
        </div>
      ) : null}
      <Hero
        me={me}
        s={s}
        focus={focus}
        target={target}
        behind={behind}
        start={start}
        cheering={cheering}
        readOnly={readOnly}
      />
      <ProgressSummary s={s} />
      <InstallCard />
      <QuizNudge me={me} />
      <CheersReceivedCard />
      <CatchUpCard s={s} target={target} behind={behind} readOnly={readOnly} />
      <TripCard n={s.n} />
      <ProgressDetails s={s} behind={behind} target={target} readOnly={readOnly} />
    </>
  );
}
