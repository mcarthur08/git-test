// Leader settings for the group.
import { getState, setState } from "@/store.js";
import { lsSet } from "@/lib/util.js";
import { normConfig } from "@/lib/player.js";
import { toast } from "./ui.js";

export async function saveConfig(input, setMsg) {
  const cfg = normConfig({ ...input, version: "KJV" });
  const s = getState();
  if (s.mode === "local") {
    setState({ config: cfg });
    lsSet("nt70.config", cfg);
    document.activeElement.blur();
    toast("Settings saved");
    return;
  }
  try {
    setMsg("Saving…");
    await s.db.doc("config/plan").set(cfg);
    setState({ config: cfg });
    document.activeElement.blur();
    toast("Settings saved for the group");
  } catch (err) {
    setMsg(
      err && (err.code === "invalid_argument" || err.code === "permission-denied")
        ? "Only leaders can change these settings."
        : "Couldn't save. Try again in a moment."
    );
  }
}
