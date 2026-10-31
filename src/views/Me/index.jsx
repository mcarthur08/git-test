import { useStore } from "@/store.js";
import { ReminderCard } from "@/components/ui/ReminderCard.jsx";
import { InstallCard } from "@/components/ui/InstallCard.jsx";
import { AppVersion } from "@/components/ui/AppVersion.jsx";
import { AppearanceCard } from "@/components/ui/AppearanceCard.jsx";
import { setTab } from "@/actions";
import Editor from "./Editor.jsx";

// The Me tab: leader shortcut, daily reminder, appearance and the character editor.
export default function Me() {
  const canLead = useStore(s => s.canLead);
  return (
    <>
      {canLead ? (
        <section className="card row between">
          <div>
            <p className="eyebrow">Leader</p>
            <b>Group settings, tribes and tools</b>
          </div>
          <button className="btn sm" onClick={() => setTab("leader")}>
            Open leader tools
          </button>
        </section>
      ) : null}
      <InstallCard />
      <ReminderCard />
      <AppearanceCard />
      <Editor />
      <AppVersion />
    </>
  );
}
