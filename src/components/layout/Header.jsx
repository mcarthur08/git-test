import { useStore } from "@/store.js";
import { TABS, NAV_TABS } from "@/lib/data.js";
import { stats } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Avatar } from "@/components/ui/Avatar.jsx";
import { setTab, retrySave } from "@/actions";

const SAVE_LABEL = {
  saving: "Saving…",
  saved: (
    <>
      <Icon k="check" /> Saved
    </>
  ),
  error: "Not saved · tap to retry"
};

// "Saving… / Saved / Not saved · tap to retry"
function SaveStatus({ status }) {
  if (!status) {
    return <span className="savestat" id="savestat" aria-live="polite"></span>;
  }
  const retry =
    status === "error"
      ? {
          role: "button",
          tabIndex: 0,
          onClick: retrySave,
          onKeyDown: e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              retrySave();
            }
          }
        }
      : {};
  return (
    <span className={"savestat " + status} id="savestat" aria-live="polite" {...retry}>
      {SAVE_LABEL[status]}
    </span>
  );
}

// New chat messages from other people since this device last had the chat open.
function useUnread() {
  const { messages, chatSeen, uid } = useStore();
  return messages.filter(m => m.uid !== uid && m.at > (chatSeen || "")).length;
}

function TabBar({ tab }) {
  const tabs = TABS.filter(([k]) => NAV_TABS.includes(k));
  const unread = useUnread();
  return (
    <nav className="tabs wrap" aria-label="Sections">
      {tabs.map(([k, , label]) => (
        <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined}>
          <Icon k={k} />
          <span>{label}</span>
          {k === "chat" && unread && tab !== "chat" ? (
            <i className="tab-badge" aria-label={`${unread} new`}>
              {unread > 9 ? "9+" : unread}
            </i>
          ) : null}
        </button>
      ))}
    </nav>
  );
}

// The sticky top bar: brand, save status, help, your avatar and the tabs.
export default function Header() {
  const { me, phase, tab, config, saveStatus } = useStore();
  return (
    <header id="top">
      <div className="wrap bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            70
          </span>
          <h1>
            NT70 Quest<small>{config.groupName} · New Testament in 70 days</small>
          </h1>
        </div>
        <SaveStatus status={me ? saveStatus : ""} />
        {me && phase === "ready" ? (
          <button
            className="helpbtn"
            onClick={() => setTab("help")}
            aria-label="How it works"
            title="How it works"
          >
            ?
          </button>
        ) : null}
        {me ? (
          <button className="mepill" onClick={() => setTab("me")} aria-label="Edit my avatar">
            <span className="bubble">
              <Avatar look={me.look} n={stats(me).n} bust />
            </span>
            <span>{me.alias}</span>
          </button>
        ) : null}
      </div>
      {phase === "ready" ? <TabBar tab={tab} /> : null}
    </header>
  );
}
