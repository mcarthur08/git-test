import { useEffect } from "react";
import { useStore, setState } from "@/store.js";
import { TOTAL, TEAM_COLORS, TEAM_VERSES } from "@/lib/data.js";
import { plural } from "@/lib/util.js";
import { teamIndex } from "@/lib/player.js";
import { Crest } from "@/components/ui/Emblems.jsx";
import { Meter } from "@/components/ui/Meter.jsx";
import TribeRoster from "./TribeRoster.jsx";

// Tribes ranked by average chapters plus a point for every perfect quiz, so a smaller tribe can still win.
function rankTribes(list, teams) {
  return teams
    .map((t, i) => {
      const mem = list.filter(p => teamIndex(p, teams) === i);
      const ch = mem.reduce((a, p) => a + p.s.chapters, 0);
      const qp = mem.reduce((a, p) => a + p.s.perfect, 0); // each perfect quiz adds one point
      return {
        t,
        i,
        mem,
        ch,
        qp,
        avg: mem.length ? (ch / mem.length / TOTAL) * 100 : 0,
        pts: mem.length ? (ch + qp) / mem.length : 0
      };
    })
    .sort((a, b) => b.pts - a.pts);
}

function TribeButton({ x, rank, open }) {
  return (
    <button
      className={"team " + (open ? "open" : "")}
      style={{ "--tc": TEAM_COLORS[x.i] }}
      onClick={() => setState({ tribeOpen: open ? null : x.i })}
      aria-expanded={open}
      aria-controls="roster"
    >
      <h3>
        <Crest i={x.i} />
        <span>{x.t}</span>
        {rank === 0 && x.avg > 0 ? (
          <>
            {" "}
            <span className="rank1">Leading</span>
          </>
        ) : null}
      </h3>
      <Meter k={"m-team" + x.i} pct={x.avg} />
      <p className="small">
        <b>{Math.round(x.avg)}%</b> average · {x.ch} chapters
        {x.qp ? ` · ${plural(x.qp, "quiz point")}` : ""} · {plural(x.mem.length, "member")}
      </p>
      <p className="small muted">
        <i>"{TEAM_VERSES[x.i][0]}"</i> {TEAM_VERSES[x.i][1]}
      </p>
      <span className="tsee">
        {open ? "Hide members" : "See members"} <i aria-hidden="true">›</i>
      </span>
    </button>
  );
}

export default function TribesCard({ list }) {
  const { config, me, tribeOpen } = useStore();
  const ranked = rankTribes(list, config.teams);
  useEffect(() => {
    if (tribeOpen !== null) {
      const r = document.getElementById("roster");
      if (r) {
        r.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [tribeOpen]);
  return (
    <section className="card stack">
      <h2>The four tribes</h2>
      <p className="small muted">
        Everyone is placed into a tribe when they join. Tribes are ranked by average chapters read
        plus a bonus point for every perfect quiz, so a smaller tribe can still win. Tap a tribe to
        see who's in it.
      </p>
      <div className="teams">
        {ranked.map((x, rank) => (
          <TribeButton key={x.i} x={x} rank={rank} open={tribeOpen === x.i} />
        ))}
      </div>
      {tribeOpen !== null && tribeOpen !== undefined ? (
        <TribeRoster list={list} i={tribeOpen} config={config} me={me} />
      ) : null}
    </section>
  );
}
