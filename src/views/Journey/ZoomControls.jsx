import { Icon } from "@/components/ui/Icon.jsx";
import { mapControl } from "@/lib/mapCamera.js";

export default function ZoomControls({ zoomed }) {
  return (
    <div className="map-ctl" role="group" aria-label="Map zoom">
      <button onClick={() => mapControl("in")} aria-label="Zoom in">
        +
      </button>
      <button onClick={() => mapControl("out")} aria-label="Zoom out" disabled={!zoomed}>
        −
      </button>
      <button onClick={() => mapControl("me")} aria-label="Zoom to my character">
        <Icon k="target" />
      </button>
      {zoomed ? (
        <button onClick={() => mapControl("reset")} aria-label="Show the whole map">
          <Icon k="journey" />
        </button>
      ) : null}
    </div>
  );
}
