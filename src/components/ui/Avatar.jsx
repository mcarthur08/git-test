import { useMemo } from "react";
import { avatarSVG } from "@/lib/avatar.js";
import { Svg } from "./Icon.jsx";

// opts: portrait | bust | vb | live | cheer. The SVG is built once per look, so re-renders don't redraw every portrait.
export function Avatar({ look, n, portrait, bust, vb, live, cheer }) {
  const key = JSON.stringify(look || {});
  const html = useMemo(
    () => avatarSVG(look, n, { portrait, bust, vb, live, cheer }),
    [key, n, portrait, bust, vb, live, cheer]
  );
  return <Svg html={html} />;
}

// The painted portrait with the little full-body figure in the corner.
export function Frame({ look, n, className = "", glow, cheer }) {
  return (
    <div className={"frame" + (className ? " " + className : "") + (glow ? " glow" : "")}>
      <Avatar look={look} n={n} portrait live cheer={cheer} />
      <div className="frame-fig">
        <Avatar look={look} n={n} live />
      </div>
    </div>
  );
}

// A round head-and-shoulders portrait.
export const Bubble = ({ look, n, className = "" }) => (
  <span className={"bubble" + (className ? " " + className : "")}>
    <Avatar look={look} n={n} bust />
  </span>
);
