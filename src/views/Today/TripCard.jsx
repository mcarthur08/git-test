import { DAYS, STOPS } from "@/lib/data.js";
import { plural } from "@/lib/util.js";
import { journeyPos } from "@/lib/journey.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { JourneyMap } from "@/views/Journey/JourneyMap.jsx";
import { setTab } from "@/actions";

// The mini map and where you are on the road.
export default function TripCard({ n }) {
  const pos = journeyPos(n);
  const next = STOPS.find(t => t.day > n);
  const where = !next
    ? "You made it to Jerusalem for the Passover!"
    : pos.t === 0
    ? `You're in ${STOPS[pos.k].place}`
    : `On the road from ${STOPS[pos.k].place} to ${STOPS[pos.k + 1].place}`;
  return (
    <section className="card trip">
      <button
        className="trip-map"
        onClick={() => setTab("journey")}
        aria-label="Open the journey map"
      >
        <JourneyMap mini />
      </button>
      <div className="stack" style={{ gap: 6 }}>
        <p className="eyebrow">Journey to the Passover</p>
        <h3>{where}</h3>
        <p className="small muted">
          {next
            ? `${plural(next.day - n, "day")} to ${next.place} · ${plural(
                DAYS - n,
                "day"
              )} to the Passover in Jerusalem`
            : "You walked the whole road with Jesus, from Bethlehem to Jerusalem."}
        </p>
        <div>
          <button className="btn sm" onClick={() => setTab("journey")}>
            <Icon k="journey" /> Open map
          </button>
        </div>
      </div>
    </section>
  );
}
