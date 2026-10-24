import { useMemo } from "react";
import { useStore } from "@/store.js";
import { DAYS } from "@/lib/data.js";
import { allPlayers, planDay } from "@/lib/player.js";
import TribesCard from "./TribesCard.jsx";
import RoadTrack from "./RoadTrack.jsx";
import ReadersCard from "./ReadersCard.jsx";

// The group: tribe standings, everyone's place on the road, and the readers list.
export default function Group() {
  const { me, players, config, mode } = useStore();
  const list = useMemo(
    () =>
      allPlayers(players, me).sort(
        (a, b) => b.s.n - a.s.n || b.s.streak - a.s.streak || a.alias.localeCompare(b.alias)
      ),
    [players, me]
  );
  const pd = planDay(config);
  const goal = pd && pd >= 1 ? Math.min(pd, DAYS) : 0; // the day everyone should have reached by now
  return (
    <>
      {mode === "local" ? (
        <div className="note">
          You're playing solo on this device, so only your own character shows here. Open the
          group's shared link and sign in to join everyone else.
        </div>
      ) : null}
      <TribesCard list={list} />
      <RoadTrack list={list} />
      <ReadersCard list={list} goal={goal} />
    </>
  );
}
