import { setState } from "@/store.js";
import { TEAM_COLORS } from "@/lib/data.js";
import { plural } from "@/lib/util.js";
import { teamIndex } from "@/lib/player.js";
import { Crest } from "@/components/ui/Emblems.jsx";
import { Bubble } from "@/components/ui/Avatar.jsx";

// Members of the tribe tapped on the Group tab, most days read first.
export default function TribeRoster({ list, i, config, me }) {
  const mem = list.filter(p => teamIndex(p, config.teams) === i);
  return (
    <div className="roster" id="roster" style={{ "--tc": TEAM_COLORS[i] }}>
      <div className="row between">
        <h3>
          <Crest i={i} />
          <span>{config.teams[i]}</span>
        </h3>
        <span className="row" style={{ gap: 10 }}>
          <span className="small muted">{plural(mem.length, "member")}</span>
          <button className="btn sm" onClick={() => setState({ tribeOpen: null })}>
            Close
          </button>
        </span>
      </div>
      {mem.length ? (
        <ul>
          {mem.map(p => {
            const isMe = me && p.id === me.id;
            return (
              <li key={p.id} className={isMe ? "me" : ""}>
                <Bubble look={p.look} n={p.s.n} />
                <div className="who">
                  <b>
                    {p.alias}
                    {isMe ? " (you)" : ""}
                  </b>
                  <span>
                    {p.s.streak > 0 ? `${p.s.streak}-day streak` : "no streak"}
                    {p.s.perfect
                      ? ` · ${p.s.perfect} perfect ${p.s.perfect === 1 ? "quiz" : "quizzes"}`
                      : ""}
                  </span>
                </div>
                <div className="nums">
                  <b>{p.s.n}/70</b>
                  {p.s.chapters} chapters
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="small muted">No one is in this tribe yet.</p>
      )}
    </div>
  );
}
