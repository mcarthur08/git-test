import { CHEER_KINDS } from "@/lib/data.js";
import { toggleCheer } from "@/actions";

const WEEK_MS = 7 * 864e5;
export const recentCheer = c => Date.now() - Date.parse(c.at || 0) < WEEK_MS;

// The cheer controls for a player (or, on your own row, how many cheers you got). Null when there is nothing to show.
export function cheerButtons(p, s) {
  if (s.mode !== "shared") {
    return null;
  }
  const recv = s.cheers.filter(c => c.to === p.id && recentCheer(c));
  if (s.me && p.id === s.me.id) {
    return recv.length ? (
      <span className="cheer-count" title="Cheers this week">
        {recv.length} {recv.length === 1 ? "cheer" : "cheers"}
      </span>
    ) : null;
  }
  const mine = s.cheers.find(c => c.to === p.id && c.from === s.uid);
  return (
    <span className="cheers">
      {Object.entries(CHEER_KINDS).map(([k, e]) => {
        const on = !!(mine && mine.kind === k);
        return (
          <button
            key={k}
            className={"cheer" + (on ? " on" : "")}
            aria-pressed={on}
            aria-label={`${k === "pray" ? "Pray for" : "Cheer on"} ${p.alias}`}
            onClick={() => toggleCheer(p.id, k)}
          >
            {e}
          </button>
        );
      })}
      {recv.length ? <span className="cheer-count">{recv.length}</span> : null}
    </span>
  );
}
