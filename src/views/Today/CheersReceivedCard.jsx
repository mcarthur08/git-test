import { useStore } from "@/store.js";
import { CHEER_KINDS } from "@/lib/data.js";
import { recentCheer } from "@/components/ui/CheerButtons.jsx";
import { setTab } from "@/actions";

// Who has cheered you on this week (shared group only).
export default function CheersReceivedCard() {
  const { mode, me, cheers, players } = useStore();
  if (mode !== "shared" || !me) {
    return null;
  }
  const recv = cheers
    .filter(c => c.to === me.id && c.from !== me.id && recentCheer(c) && players[c.from])
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  if (!recv.length) {
    return null;
  }
  const names = recv
    .slice(0, 4)
    .map(c => `${CHEER_KINDS[c.kind] || "🙏"} ${players[c.from].alias.split(" ")[0]}`)
    .join(", ");
  return (
    <section className="card cheer-card">
      <p>
        <b>{names}</b>
        {recv.length > 4 ? ` and ${recv.length - 4} more` : ""} {recv.length === 1 ? "is" : "are"}{" "}
        cheering you on this week. Keep going!
      </p>
      <button className="btn sm" onClick={() => setTab("group")}>
        Cheer someone back
      </button>
    </section>
  );
}
