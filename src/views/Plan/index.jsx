import { useStore } from "@/store.js";
import { SECTIONS, VICTORIES } from "@/lib/data.js";
import { stats, planDay } from "@/lib/player.js";
import DayDetail from "./DayDetail.jsx";
import WeekRow from "./WeekRow.jsx";

// The 70-day calendar: ten weeks of tiles, and the selected day's details above them.
export default function Plan() {
  const { me, config, sel } = useStore();
  const s = stats(me);
  const pd = planDay(config);
  return (
    <>
      {sel ? <DayDetail day={sel} /> : null}
      <section className="card stack">
        <div className="row between">
          <h2>The 70-day map</h2>
          <span className="small muted">{s.n}/70 days · about 4 chapters a day</span>
        </div>
        <div className="legend">
          {Object.entries(SECTIONS).map(([k, l]) => (
            <span key={k} className={`chip sec sec-${k}`}>
              {l}
            </span>
          ))}
        </div>
        <p className="small muted">
          Tap any day to open its reading or check it off. The gold ring is today; a gold dot marks
          a Victory Moment.
        </p>
        <div>
          {VICTORIES.map((v, w) => (
            <WeekRow key={w} week={w} victory={v} s={s} today={pd} selected={sel} />
          ))}
        </div>
      </section>
    </>
  );
}
