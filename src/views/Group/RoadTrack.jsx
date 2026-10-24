import { useEffect } from "react";
import { useStore } from "@/store.js";
import { DAYS } from "@/lib/data.js";
import { stats } from "@/lib/player.js";
import { Avatar } from "@/components/ui/Avatar.jsx";

// A sideways road of 70 dots with everyone standing on the day they've reached.
export default function RoadTrack({ list }) {
  const me = useStore(s => s.me);
  const cols = Array.from({ length: DAYS + 1 }, () => []);
  list.forEach(p => cols[p.s.n].push(p));
  const myN = me ? stats(me).n : -1;
  useEffect(() => {
    const t = document.getElementById("track");
    const m = document.getElementById("trackme");
    if (t && m) {
      t.scrollLeft = Math.max(0, m.parentElement.offsetLeft - t.clientWidth / 2);
    }
  }, []);
  return (
    <section className="card stack">
      <h2>The road to Revelation</h2>
      <p className="small muted">
        Each dot is one day of reading; gold dots are Victory Moments. Scroll sideways to see
        everyone.
      </p>
      <div className="track-wrap" id="track">
        <div className="track">
          {cols.map((ps, i) => (
            <div key={i} className="tcol">
              <div className="ppl">
                {ps.slice(0, 4).map(p => (
                  <span key={p.id} title={p.alias}>
                    <Avatar look={p.look} n={p.s.n} live={!!(me && p.id === me.id)} />
                  </span>
                ))}
                {ps.length > 4 ? <span className="more">+{ps.length - 4}</span> : null}
              </div>
              <span
                className={`tdot ${i === 0 ? "go" : ""} ${i && i % 7 === 0 ? "mile" : ""} ${
                  i === myN ? "me" : ""
                }`}
                id={i === myN ? "trackme" : undefined}
              />
              <span className="tlabel">{i === 0 ? "Start" : i % 7 === 0 ? i : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
