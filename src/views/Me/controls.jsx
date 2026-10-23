// The picking controls the character editor is built from.
import { allowedFor } from "@/lib/data.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Avatar } from "@/components/ui/Avatar.jsx";
import { setLook } from "@/actions";

// Round colour swatches. `arr` items are colours, or [label, colour, ...] arrays.
export function Swatches({ k, arr, label, d }) {
  return (
    <>
      {arr.map((c, i) => {
        const named = Array.isArray(c);
        return (
          <button
            key={i}
            className="sw-opt"
            style={{ background: named ? c[1] : c }}
            onClick={() => setLook(k, i)}
            aria-pressed={d.look[k] === i}
            aria-label={named ? c[0] : `${label} ${i + 1}`}
            title={named ? c[0] : ""}
          />
        );
      })}
    </>
  );
}

// Items that unlock with days read: swatches for robes and girdles, labelled buttons for headgear and items.
export function Unlockables({ k, g, d, n }) {
  return (
    <>
      {allowedFor(k, g).map(([[label, val, need], i]) => {
        const locked = need > n;
        if (k === "tunic" || k === "sash") {
          return (
            <button
              key={i}
              className={"sw-opt " + (locked ? "lock" : "")}
              style={{ background: val }}
              onClick={() => setLook(k, i)}
              aria-pressed={d.look[k] === i}
              {...(locked ? { "data-day": `${need}d`, "aria-disabled": "true" } : {})}
              title={label + (locked ? ` (unlocks after ${need} days)` : "")}
              aria-label={label + (locked ? `, locked until ${need} days` : "")}
            />
          );
        }
        return (
          <button
            key={i}
            className={"opt " + (locked ? "lock" : "")}
            onClick={() => setLook(k, i)}
            aria-pressed={d.look[k] === i}
            {...(locked ? { "aria-disabled": "true" } : {})}
          >
            {locked ? (
              <span className="lk">
                <Icon k="lock" />
              </span>
            ) : null}
            {label}
            {locked ? ` · ${need}d` : ""}
          </button>
        );
      })}
    </>
  );
}

// A row of small previews, one per option, drawn on the current look. `vb` crops each preview to the feature.
export function FeaturePicker({ k, list, title, vb, d, n, look }) {
  return (
    <div className="field">
      <span className="lbl">{title}</span>
      <div className="feats">
        {list.map(([label], i) => (
          <button
            key={i}
            className="feat"
            onClick={() => setLook(k, i)}
            aria-pressed={d.look[k] === i}
          >
            <span className="fprev">
              <Avatar look={{ ...(look || d.look), [k]: i, hat: 0 }} n={n} vb={vb} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
