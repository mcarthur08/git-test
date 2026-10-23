import { useStore } from "@/store.js";
import { VICTORIES } from "@/lib/data.js";
import { stats } from "@/lib/player.js";
import VictoryCard from "./VictoryCard.jsx";

// Ten weekly stories, unlocked every 7 days of reading.
export default function Victories() {
  const { me, canLead, mode } = useStore();
  const n = stats(me).n;
  const peek = canLead && mode === "shared";
  return (
    <>
      <section className="card stack">
        <h2>Victory Moments</h2>
        <p className="muted" style={{ maxWidth: "68ch" }}>
          Every 7 days of reading unlocks a story where God's people faced a battle or a hard
          situation and God brought them through. Use them for group discussion each week.
          {peek ? " As a leader you can read all of them ahead of time." : ""}
        </p>
      </section>
      <div className="vics">
        {VICTORIES.map((v, i) => (
          <VictoryCard key={i} v={v} i={i} n={n} open={n >= v.day || peek} />
        ))}
      </div>
    </>
  );
}
