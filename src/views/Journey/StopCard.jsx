import { STOPS } from "@/lib/data.js";
import { plural, readingURL } from "@/lib/util.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { selectStop } from "@/actions";
import StopScene from "./StopScene.jsx";
import Keepsake from "./Keepsake.jsx";

// The story of the selected stop, locked until you've walked there.
export default function StopCard({ sel, n, canPeek }) {
  const s = STOPS[sel];
  const open = n >= s.day || canPeek;
  const ref = s.ref.split(";")[0];
  return (
    <div className="stop-card" id="stopcard">
      <StopScene i={sel} locked={!open} />
      <div className="row between">
        <p className="eyebrow">
          Stop {sel + 1} of {STOPS.length} · {n >= s.day ? "reached" : `day ${s.day}`}
        </p>
        <span className="chip">{s.ref}</span>
      </div>
      <h3>
        {s.place}: {s.title}
      </h3>
      {open ? (
        <>
          <p>{s.text}</p>
          <blockquote>
            "{s.verse}"<span>{s.verseRef} · KJV</span>
          </blockquote>
          <div className="row">
            <a className="btn sm" href={readingURL(ref, "KJV")} target="_blank" rel="noopener">
              Read {ref} <Icon k="ext" />
            </a>
          </div>
        </>
      ) : (
        <p className="muted">
          Read {plural(s.day - n, "more day")} to walk here and unlock this stop.
        </p>
      )}
      <Keepsake stop={s} n={n} />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button
          className="btn sm"
          disabled={sel === 0}
          onClick={() => selectStop(Math.max(0, sel - 1))}
        >
          Previous stop
        </button>
        <button
          className="btn sm"
          disabled={sel === STOPS.length - 1}
          onClick={() => selectStop(Math.min(STOPS.length - 1, sel + 1))}
        >
          Next stop
        </button>
      </div>
    </div>
  );
}
