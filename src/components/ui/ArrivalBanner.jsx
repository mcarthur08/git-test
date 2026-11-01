import { useStore } from "@/store.js";
import { STOPS, UNLOCK } from "@/lib/data.js";
import { Icon } from "./Icon.jsx";
import { openStop } from "@/actions";

// "Arrived: Nazareth": shown as the character reaches a stop on the road. Tapping it opens the stop's story.
export function ArrivalBanner() {
  const a = useStore(s => s.arrival);
  const stop = a && STOPS[a.i];
  if (!stop) {
    return null;
  }
  const keep = UNLOCK.item.find(e => e[1] === stop.keepsake);
  return (
    <button key={a.id} className="arrival" role="status" onClick={() => openStop(a.i)}>
      <span className="arrival-ic">
        <Icon k="flag" />
      </span>
      <span>
        <b>Arrived: {stop.place}</b>
        <span>{keep ? `Keepsake: ${keep[0]}` : stop.title}</span>
      </span>
    </button>
  );
}
