import { useStore } from "@/store.js";
import { DAYS } from "@/lib/data.js";
import { plural } from "@/lib/util.js";
import MostImproved from "./MostImproved.jsx";
import PlayerRow from "./PlayerRow.jsx";

// No rank numbers: readers are grouped by where they are, most days first within each group.
function groupReaders(list, goal) {
  return [
    ["Finished", "Read the whole New Testament", list.filter(p => p.s.n >= DAYS)],
    [
      goal ? "On pace" : "Reading",
      goal ? `Read through Day ${goal}` : "",
      list.filter(p => p.s.n < DAYS && p.s.n >= goal)
    ],
    ["Catching up", "Every day you read counts. Keep going!", list.filter(p => p.s.n < goal)]
  ].filter(g => g[2].length);
}

export default function ReadersCard({ list, goal }) {
  const s = useStore();
  const groups = groupReaders(list, goal);
  return (
    <section className="card stack">
      <div className="row between">
        <h2>Readers</h2>
        <span className="small muted">{plural(list.length, "reader")}</span>
      </div>
      <MostImproved list={list} config={s.config} />
      <div className="board">
        {groups.length ? (
          groups.map(([title, sub, ps]) => (
            <div key={title} className="pgroup">
              <div className="pghead">
                <h3>{title}</h3>
                <span className="small muted">
                  {ps.length}
                  {sub ? " · " + sub : ""}
                </span>
              </div>
              {ps.map(p => (
                <PlayerRow key={p.id} p={p} s={s} />
              ))}
            </div>
          ))
        ) : (
          <p className="muted">Nobody has joined yet.</p>
        )}
      </div>
    </section>
  );
}
