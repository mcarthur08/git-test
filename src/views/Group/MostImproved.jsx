import { PLAN } from "@/lib/data.js";
import { iso } from "@/lib/util.js";
import { planDay } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Bubble } from "@/components/ui/Avatar.jsx";

// A bright spot: who read more this week than last week (or, in week 1, who read the most).
export default function MostImproved({ list, config }) {
  const pd = planDay(config);
  if (!pd || pd < 2) {
    return null;
  }
  const t = new Date();
  const day = k => iso(new Date(t.getFullYear(), t.getMonth(), t.getDate() - k));
  const thisFrom = day(6);
  const prevFrom = day(13);
  const ch = (p, a, b) =>
    Object.entries(p.done).reduce(
      (n, [d, dt]) => n + (dt >= a && dt <= b ? PLAN[d - 1].count : 0),
      0
    );
  const firstWeek = pd < 8;
  const scored = list
    .map(p => {
      const now = ch(p, thisFrom, day(0));
      return { p, now, gain: firstWeek ? now : now - ch(p, prevFrom, day(7)) };
    })
    .filter(x => x.gain > 0 && x.now > 0);
  if (!scored.length) {
    return null;
  }
  const top = Math.max(...scored.map(x => x.gain));
  const best = scored.filter(x => x.gain === top).slice(0, 3);
  return (
    <div className="improved">
      <span className="rv-ic">
        <Icon k="star" />
      </span>
      <div className="stack" style={{ gap: 6, minWidth: 0 }}>
        <p className="eyebrow">
          {firstWeek ? "Strong start this week" : "Most improved this week"}
        </p>
        <div className="imp-list">
          {best.map(x => (
            <span key={x.p.id} className="imp">
              <Bubble look={x.p.look} n={x.p.s.n} />
              <span>
                <b>{x.p.alias}</b>
                <span className="small muted">
                  {firstWeek ? `${x.now} chapters` : `+${x.gain} chapters over last week`}
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
