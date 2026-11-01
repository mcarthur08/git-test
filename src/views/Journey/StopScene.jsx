import { useMemo } from "react";
import { STOPS } from "@/lib/data.js";
import { stopScene } from "@/lib/scenes.js";
import { Icon, Svg } from "@/components/ui/Icon.jsx";

// The illustrated scene for a stop, with its own time of day and weather. Kept dim until you reach the stop.
export default function StopScene({ i, locked }) {
  const sc = useMemo(() => stopScene(i), [i]);
  return (
    <div
      className={"stop-scene" + (locked ? " locked" : "") + " t-" + sc.time}
      role="img"
      aria-label={locked ? "A scene you will see when you reach this stop" : sc.label}
    >
      <Svg html={sc.svg} />
      {locked ? (
        <span className="ss-cap">
          <Icon k="lock" /> Reach day {STOPS[i].day} to see it
        </span>
      ) : (
        <span className="ss-cap">{sc.label}</span>
      )}
    </div>
  );
}
