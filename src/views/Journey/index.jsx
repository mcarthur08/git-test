import { useStore } from "@/store.js";
import { STOPS, DAYS } from "@/lib/data.js";
import { stats } from "@/lib/player.js";
import { plural } from "@/lib/util.js";
import { mapZoom } from "@/lib/mapCamera.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Meter } from "@/components/ui/Meter.jsx";
import { JourneyMap } from "./JourneyMap.jsx";
import ZoomControls from "./ZoomControls.jsx";
import StopCard from "./StopCard.jsx";
import StopList from "./StopList.jsx";

// The road from Bethlehem to Jerusalem: an interactive map, the selected stop's story, and every stop.
export default function Journey() {
  const { me, stop, canLead, mode } = useStore();
  const n = stats(me).n;
  const zoomed = mapZoom() > 1.01;
  const nextI = STOPS.findIndex(s => s.day > n);
  const next = STOPS[nextI];
  const sel = stop ?? (next ? Math.max(0, nextI - 1) : STOPS.length - 1);
  return (
    <>
      <section className="card stack">
        <div className="row between">
          <div>
            <p className="eyebrow">Journey to the Passover</p>
            <h2>From Bethlehem to Jerusalem</h2>
          </div>
          <span className="chip">
            <Icon k="target" />{" "}
            {next ? `${plural(next.day - n, "day")} to ${next.place}` : "Arrived in Jerusalem"}
          </span>
        </div>
        <p className="muted small" style={{ maxWidth: "68ch" }}>
          Every day you read moves your character along the road Jesus walked. Finish all 70 days
          and you arrive in Jerusalem for the Passover. Tap a town to read what happened there.
        </p>
        <Meter k="m-journey" pct={(n / DAYS) * 100} />
      </section>
      <section className="journey">
        <div className="card map-card">
          <div className={"map-wrap" + (zoomed ? " zoomed" : "")}>
            <JourneyMap />
            <ZoomControls zoomed={zoomed} />
          </div>
          <p className="small muted map-hint">
            {zoomed
              ? "Drag to move around. Names show when you zoom in close."
              : "Zoom in to see who's where. Pinch or use the + button."}
          </p>
        </div>
        <div className="card">
          <StopCard sel={sel} n={n} canPeek={canLead && mode === "shared"} />
        </div>
      </section>
      <StopList n={n} sel={sel} />
    </>
  );
}
