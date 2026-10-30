import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useStore, getState } from "@/store.js";
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
  const [expanded, setExpanded] = useState(false);
  const n = stats(me).n;
  const zoomed = mapZoom() > 1.01;
  const nextI = STOPS.findIndex(s => s.day > n);
  const next = STOPS[nextI];
  const sel = stop ?? (next ? Math.max(0, nextI - 1) : STOPS.length - 1);
  // Full screen is a modal: Escape closes it, the page behind stops scrolling and can't be tabbed into,
  // and focus moves to the close button and returns to the expand button.
  useEffect(() => {
    if (!expanded) {
      return;
    }
    const behind = ["top", "main"].map(id => document.getElementById(id)).filter(Boolean);
    const onKey = e => {
      // A milestone popup on top takes the Escape press (Reveal marks it with preventDefault).
      if (e.key === "Escape" && !e.defaultPrevented && !getState().reveals.length) {
        setExpanded(false);
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("map-full");
    behind.forEach(el => el.setAttribute("inert", ""));
    document.addEventListener("keydown", onKey);
    document.querySelector(".map-card.expanded [data-expand]")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.body.classList.remove("map-full");
      behind.forEach(el => el.removeAttribute("inert"));
      document.removeEventListener("keydown", onKey);
      document.querySelector(".journey [data-expand]")?.focus();
    };
  }, [expanded]);
  const mapCard = (
    <div
      className={"card map-card" + (expanded ? " expanded" : "")}
      {...(expanded && { role: "dialog", "aria-modal": "true", "aria-label": "Journey map" })}
    >
      <div className={"map-wrap" + (zoomed ? " zoomed" : "")}>
        <JourneyMap />
        <ZoomControls
          zoomed={zoomed}
          expanded={expanded}
          onToggleExpand={() => setExpanded(e => !e)}
        />
      </div>
      <p className="small muted map-hint">
        {zoomed
          ? "Drag to move around. Names show when you zoom in close."
          : "Zoom in to see who's where. Pinch or use the + button."}
      </p>
      {expanded && <StopCard sel={sel} n={n} canPeek={canLead && mode === "shared"} />}
    </div>
  );
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
        {/* Portalled when full screen, so the page's slide-in transform can't contain the fixed card */}
        {expanded ? createPortal(mapCard, document.body) : mapCard}
        {!expanded && (
          <div className="card">
            <StopCard sel={sel} n={n} canPeek={canLead && mode === "shared"} />
          </div>
        )}
      </section>
      <StopList n={n} sel={sel} />
    </>
  );
}
