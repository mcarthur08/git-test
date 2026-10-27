import { GUIDE } from "@/lib/data.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { AppVersion } from "@/components/ui/AppVersion.jsx";
import { BackButton } from "@/components/ui/BackButton.jsx";
import { InstallCard } from "@/components/ui/InstallCard.jsx";
import { ReminderCard } from "@/components/ui/ReminderCard.jsx";

const Tip = ({ ic, title, children }) => (
  <li>
    <span className="rv-ic">
      <Icon k={ic} />
    </span>
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  </li>
);

// How it works: shown once to new players (see checkGuide), reopened from the ? in the header.
export default function Help() {
  return (
    <>
      <BackButton tab="today" label="Back to Today" />
      <section className="card stack">
        <p className="eyebrow">NT70 Quest</p>
        <h2>How it works</h2>
        <ul className="guide">
          {GUIDE.map(([ic, t, d]) => (
            <Tip key={t} ic={ic} title={t}>
              <p className="muted" dangerouslySetInnerHTML={{ __html: d }} />
            </Tip>
          ))}
          <Tip ic="target" title="Daily quiz">
            <p className="muted">
              After you check off a day, try 5 quick questions from that reading. A perfect score
              adds a point for your tribe.
            </p>
          </Tip>
          <Tip ic="chat" title="Group chat">
            <p className="muted">
              Ask questions and share thoughts in the <b>Chat</b> tab. Tick{" "}
              <b>This is a question</b> so a leader can find and answer it. See something that isn't
              right? Tap <b>Report</b> and a leader will take a look.
            </p>
          </Tip>
          <Tip ic="lock" title="Forgot your password?">
            <p className="muted">
              Make a new username, then ask a leader to tap <b>Recover</b> on your old character.
              Your progress moves over.
            </p>
          </Tip>
        </ul>
      </section>
      <InstallCard />
      <ReminderCard />
      <AppVersion />
    </>
  );
}
