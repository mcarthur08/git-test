import { useEffect, useMemo, useRef } from "react";
import { useStore } from "@/store.js";
import { STOPS } from "@/lib/data.js";
import { stats, allPlayers } from "@/lib/player.js";
import {
  MAP_BASE,
  MAP_W,
  MAP_H,
  routePath,
  buildCrowd,
  buildMe,
  miniViewBox
} from "@/lib/journey.js";
import { selectStop } from "@/actions";
import { useWalk } from "./useWalk.js";
import MapStop from "./MapStop.jsx";
import { wireGestures, gesture } from "./mapGestures.js";

// mini = the small window around the player on Today; otherwise the full, zoomable map on Journey.
export function JourneyMap({ mini }) {
  const { me, players, mapVB: vb, stop: sel, arrival, reveals } = useStore();
  const ref = useRef(null);
  const meRef = useRef(null);
  const pathRef = useRef(null);
  const myN = me ? stats(me).n : 0;
  const zoom = mini ? 1 : MAP_W / (vb ? vb[2] : MAP_W);
  const named = zoom >= 2; // names show once you zoom in close
  const people = useMemo(() => allPlayers(players, me), [players, me]);
  const crowd = useMemo(() => buildCrowd(people, me && me.id, named), [people, me, named]);
  const lookKey = me ? JSON.stringify(me.look) : "";
  const meHTML = useMemo(() => (me ? buildMe(me.look, myN, !mini) : ""), [lookKey, myN, mini]);
  useWalk({
    id: me && me.id,
    n: myN,
    waiting: reveals.length > 0,
    mini,
    me: meRef,
    path: pathRef,
    svg: ref
  });
  useEffect(() => {
    if (!mini && ref.current) {
      return wireGestures(ref.current);
    }
  }, [mini]);

  const viewBox = mini
    ? miniViewBox(myN)
    : (vb || [0, 0, MAP_W, MAP_H]).map(v => v.toFixed(1)).join(" ");
  const onSelect = i => () => {
    if (gesture.dragged) {
      gesture.dragged = false;
      return;
    }
    selectStop(i);
  };
  return (
    <svg
      className="map"
      id={mini ? undefined : "bigmap"}
      ref={ref}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Map of the land of Israel showing Jesus' journey from Bethlehem to Jerusalem for the Passover"
    >
      <g dangerouslySetInnerHTML={{ __html: MAP_BASE }} />
      <path
        ref={pathRef}
        d={routePath(myN)}
        fill="none"
        stroke="var(--flame)"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="m-walked"
      />
      {STOPS.map((s, i) => {
        const reached = myN >= s.day;
        const next = !reached && (i === 0 || myN >= STOPS[i - 1].day);
        return (
          <MapStop
            key={i}
            index={i}
            stop={s}
            reached={reached}
            next={next}
            last={i === STOPS.length - 1}
            selected={sel === i && !mini}
            arriving={!!arrival && arrival.i === i}
            onSelect={mini ? null : onSelect(i)}
          />
        );
      })}
      <g dangerouslySetInnerHTML={{ __html: crowd }} />
      <g ref={meRef} dangerouslySetInnerHTML={{ __html: meHTML }} />
    </svg>
  );
}
