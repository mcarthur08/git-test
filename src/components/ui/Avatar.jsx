import { useMemo } from "react";
import { avatarSVG } from "@/lib/avatar.js";
import { Icon, Svg } from "./Icon.jsx";

// opts: full | portrait | bust | vb | live | cheer. The SVG is built once per look, so re-renders don't redraw every portrait.
export function Avatar({ look, n, full, portrait, bust, vb, live, cheer }) {
  const key = JSON.stringify(look || {});
  const html = useMemo(
    () => avatarSVG(look, n, { full, portrait, bust, vb, live, cheer }),
    [key, n, full, portrait, bust, vb, live, cheer]
  );
  return <Svg html={html} />;
}

// The full-body character on its stage. With onExpand, tapping it (or its corner button) opens it full screen.
export function Frame({ look, n, className = "", glow, cheer, onExpand }) {
  return (
    <div
      className={
        "frame full" +
        (className ? " " + className : "") +
        (glow ? " glow" : "") +
        (onExpand ? " expandable" : "")
      }
      onClick={onExpand}
    >
      <Avatar look={look} n={n} full live cheer={cheer} />
      {onExpand ? (
        <button type="button" className="frame-expand" aria-label="View your character full screen">
          <Icon k="expand" />
        </button>
      ) : null}
    </div>
  );
}

// A round head-and-shoulders portrait.
export const Bubble = ({ look, n, className = "" }) => (
  <span className={"bubble" + (className ? " " + className : "")}>
    <Avatar look={look} n={n} bust />
  </span>
);
