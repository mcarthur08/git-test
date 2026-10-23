import { PLAN } from "@/lib/data.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { selectDay } from "./selectDay.js";

// One week: its Victory Moment and seven day tiles.
export default function WeekRow({ week, victory, s, today, selected }) {
  return (
    <div className="week">
      <div className="week-head">
        <h3>Week {week + 1}</h3>
        <span className="small muted">Victory: {victory.title}</span>
      </div>
      <div className="days">
        {[1, 2, 3, 4, 5, 6, 7].map(i => {
          const p = PLAN[week * 7 + i - 1];
          const done = s.doneSet.has(p.day);
          return (
            <button
              key={i}
              className={`tile sec-${p.sec} ${done ? "done" : ""} ${
                today === p.day ? "today" : ""
              } ${selected === p.day ? "sel" : ""} ${p.day % 7 === 0 ? "vic" : ""}`}
              onClick={() => selectDay(p.day)}
              aria-label={`Day ${p.day}: ${p.label}${done ? ", read" : ""}`}
            >
              {done ? (
                <span className="ck">
                  <Icon k="check" />
                </span>
              ) : null}
              <span className="n">{p.day}</span>
              <span className="r">{p.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
