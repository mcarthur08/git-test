import { liveRelease, showRelease } from "@/actions";

export const AppVersion = () => (
  <p className="small muted app-ver">
    NT70 Quest version {liveRelease().v} ·{" "}
    <button className="linkish" onClick={() => showRelease(liveRelease())}>
      What's new
    </button>
  </p>
);
