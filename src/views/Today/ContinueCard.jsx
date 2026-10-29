import { useStore } from "@/store.js";
import { PLAN } from "@/lib/data.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { openReader, markRef, validMark } from "@/actions";

// "Continue reading: Mark 4:21", shown while the bookmarked day isn't checked off yet.
export default function ContinueCard({ s }) {
  const mark = useStore(st => st.mark);
  if (!validMark(mark) || s.doneSet.has(mark.day)) {
    return null;
  }
  return (
    <section className="card continue">
      <span className="rv-ic">
        <Icon k="book" />
      </span>
      <div className="stack" style={{ gap: 2, minWidth: 0 }}>
        <p className="eyebrow">Continue reading · Day {mark.day}</p>
        <b>{markRef(mark)}</b>
        <span className="small muted">{PLAN[mark.day - 1].label}</span>
      </div>
      <button
        className="btn go"
        onClick={() => openReader(mark.day, "today", { ci: mark.ci, v: mark.v })}
      >
        Continue
      </button>
    </section>
  );
}
