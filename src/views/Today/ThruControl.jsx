import { useState } from "react";
import { PLAN } from "@/lib/data.js";
import { nextUndone } from "@/lib/player.js";
import { markThrough } from "@/actions";

// "I've read through Day X" for people who read ahead or in a paper Bible.
export default function ThruControl({ s, target, readOnly }) {
  const first = nextUndone(s);
  const def = first ? Math.max(first, target || first) : 0;
  const [val, setVal] = useState(def);
  if (!first || readOnly) {
    return null;
  }
  return (
    <div className="thru">
      <label htmlFor="thru-day" className="small">
        Reading in a paper Bible? Mark everything read through
      </label>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <select
          id="thru-day"
          style={{ flex: 1, minWidth: 0 }}
          value={val}
          onChange={e => setVal(+e.target.value)}
        >
          {PLAN.filter(d => d.day >= first).map(d => (
            <option key={d.day} value={d.day}>
              Day {d.day} · {d.short}
            </option>
          ))}
        </select>
        <button className="btn sm" onClick={() => markThrough(val)}>
          Mark read
        </button>
      </div>
    </div>
  );
}
