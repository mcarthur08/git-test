import { useStore } from "@/store.js";
import { DAYS } from "@/lib/data.js";
import { fmtDate, plural } from "@/lib/util.js";
import { dayDate } from "@/lib/player.js";
import { setTab } from "@/actions";

// A note about the calendar: no start date yet, quest not started, or quest over.
export default function StartBanner({ start, pd }) {
  const canLead = useStore(s => s.canLead);
  if (!start) {
    return canLead ? (
      <div className="note">
        Set the group's start date under{" "}
        <a
          href="#leader"
          onClick={e => {
            e.preventDefault();
            setTab("leader");
          }}
        >
          Leader
        </a>{" "}
        so everyone shares one calendar. Until then, start with Day 1.
      </div>
    ) : (
      <div className="note">
        Your leader hasn't set the start date yet. You can begin with Day 1 now.
      </div>
    );
  }
  if (pd < 1) {
    return (
      <div className="note">
        The quest starts {fmtDate(start)}, in {plural(1 - pd, "day")}. Reading ahead is allowed.
      </div>
    );
  }
  if (pd > DAYS) {
    return (
      <div className="note">
        The 70 days ended {fmtDate(dayDate(start, DAYS))}. Finish any days you missed. It still
        counts!
      </div>
    );
  }
  return null;
}
