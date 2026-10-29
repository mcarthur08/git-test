import { useStore } from "@/store.js";
import SettingsForm from "./SettingsForm.jsx";
import Reports from "./Reports.jsx";

const InviteSteps = ({ children }) => (
  <section className="card stack">
    <h3>Inviting the group</h3>
    <ol
      className="small"
      style={{ margin: 0, paddingLeft: 20, maxWidth: "68ch", display: "grid", gap: 6 }}
    >
      {children}
    </ol>
  </section>
);

// Leader tools: group settings, plus how to invite people for the way this copy of the app is hosted.
export default function Leader() {
  const { mode, backend } = useStore();
  return (
    <>
      {mode === "shared" ? <Reports /> : null}
      <SettingsForm />
      {backend === "firebase" ? (
        <InviteSteps>
          <li>Send the group this page's web address.</li>
          <li>
            Each person signs in with Google or with an email link. Their real name is never shown.
          </li>
          <li>
            On a phone, they can use Share › <b>Add to Home Screen</b> so it opens like an app.
          </li>
          <li>As a leader you can remove a player from the Group leaderboard.</li>
        </InviteSteps>
      ) : null}
      {mode === "shared" && backend === "claude" ? (
        <InviteSteps>
          <li>
            Use the Share menu on this page and give the group <b>Contributor</b> access, so each
            person can save their own progress.
          </li>
          <li>Send them the link. Everyone needs to be signed in to claude.ai.</li>
          <li>Each person picks an anonymous Bible name. Real names never appear on this page.</li>
          <li>As the owner you can remove a player from the Group leaderboard.</li>
        </InviteSteps>
      ) : null}
    </>
  );
}
