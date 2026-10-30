import { useEffect, useRef, useState } from "react";
import { useStore, setState } from "@/store.js";
import { CHAT_MAX } from "@/lib/data.js";
import { stats } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Avatar } from "@/components/ui/Avatar.jsx";
import {
  postMessage,
  deleteMessage,
  setAnswered,
  setPinned,
  reportMessage,
  reportedByMe,
  markChatSeen
} from "@/actions";

// "Today 7:42 PM", "Yesterday 9:05 AM" or "Tue, Oct 27 · 7:42 PM"
function when(at) {
  const d = new Date(at);
  if (isNaN(d)) {
    return "";
  }
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ago = Math.round((today - day) / 864e5);
  if (ago === 0) {
    return `Today ${time}`;
  }
  if (ago === 1) {
    return `Yesterday ${time}`;
  }
  return `${d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  })} · ${time}`;
}

function Message({ m, pinnedView }) {
  const { players, uid, canLead, readOnly } = useStore();
  const p = players[m.uid];
  const mine = m.uid === uid;
  const reported = reportedByMe().includes(m.id);
  const cls = [
    "msg",
    mine ? "mine" : "",
    m.q ? "question" : "",
    m.q && m.answered ? "answered" : ""
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <li className={cls}>
      <span className="bubble sm-b">{p ? <Avatar look={p.look} n={stats(p).n} bust /> : null}</span>
      <div className="msg-body">
        <div className="msg-head">
          <b>{p ? p.alias : "Former member"}</b>
          <span className="small muted">{when(m.at)}</span>
          {m.pinned && !pinnedView ? (
            <span className="tag pin">
              <Icon k="pin" /> Pinned
            </span>
          ) : null}
          {m.q ? (
            <span className={"tag " + (m.answered ? "ok" : "q")}>
              {m.answered ? (
                <>
                  <Icon k="check" /> Answered
                </>
              ) : (
                "Question"
              )}
            </span>
          ) : null}
        </div>
        <p className="msg-text">{m.text}</p>
        {readOnly ? null : (
          <div className="msg-acts">
            {m.q && (canLead || mine) ? (
              <button className="linkish" onClick={() => setAnswered(m.id, !m.answered)}>
                {m.answered ? "Reopen question" : "Mark answered"}
              </button>
            ) : null}
            {canLead ? (
              <button className="linkish" onClick={() => setPinned(m.id, !m.pinned)}>
                {m.pinned ? "Unpin" : "Pin"}
              </button>
            ) : null}
            {mine || canLead ? (
              <button className="linkish" onClick={() => deleteMessage(m.id)}>
                {mine ? "Delete" : "Remove"}
              </button>
            ) : null}
            {!mine && !canLead ? (
              reported ? (
                <span className="small muted">Reported</span>
              ) : (
                <button className="linkish" onClick={() => reportMessage(m.id)}>
                  Report
                </button>
              )
            ) : null}
          </div>
        )}
      </div>
    </li>
  );
}

function Compose() {
  const { readOnly } = useStore();
  const [text, setText] = useState("");
  const [q, setQ] = useState(false);
  const [busy, setBusy] = useState(false);
  if (readOnly) {
    return null;
  }
  const send = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    if (await postMessage(text, q)) {
      setText("");
      setQ(false);
    }
    setBusy(false);
  };
  return (
    <div className="card compose">
      <textarea
        id="chat-text"
        maxLength={CHAT_MAX}
        rows={3}
        placeholder={q ? "Ask the group or a leader a question" : "Write a message to the group"}
        aria-label="Your message"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            send();
          }
        }}
      />
      <div className="row between">
        <label className="qtoggle">
          <input type="checkbox" checked={q} onChange={e => setQ(e.target.checked)} />
          <span>This is a question</span>
        </label>
        <span className="row" style={{ gap: 10 }}>
          <span className="small muted">
            {text.length}/{CHAT_MAX}
          </span>
          <button className="btn go" onClick={send} disabled={busy || !text.trim()}>
            Send
          </button>
        </span>
      </div>
    </div>
  );
}

// One chat for the whole group. Questions can be marked answered; leaders pin and moderate.
export default function Chat() {
  const { mode, messages, chatFilter } = useStore();
  const endRef = useRef(null);
  const count = messages.length;
  useEffect(() => {
    markChatSeen();
    if (endRef.current && chatFilter === "all") {
      endRef.current.scrollIntoView({ block: "end" });
    }
  }, [count, chatFilter]);
  if (mode !== "shared") {
    return (
      <div className="note">
        Chat works when you're signed in with the group. Open the group's shared link and sign in to
        talk with everyone.
      </div>
    );
  }
  const pinned = messages.filter(m => m.pinned).reverse();
  const open = messages.filter(m => m.q && !m.answered);
  const list = chatFilter === "open" ? open : messages.slice(-300);
  return (
    <>
      <section className="card stack chat-head">
        <div className="row between">
          <h2>Group chat</h2>
          <div className="seg" role="group" aria-label="Show">
            <button
              aria-pressed={chatFilter === "all"}
              onClick={() => setState({ chatFilter: "all" })}
            >
              All
            </button>
            <button
              aria-pressed={chatFilter === "open"}
              onClick={() => setState({ chatFilter: "open" })}
            >
              Open questions{open.length ? ` · ${open.length}` : ""}
            </button>
          </div>
        </div>
        <p className="small muted">
          Ask questions about the reading, share what stood out, encourage each other. Everyone in
          the group can see this. Tick <b>This is a question</b> so leaders can find and answer it.
        </p>
      </section>
      {pinned.length && chatFilter === "all" ? (
        <section className="card pinned">
          <p className="eyebrow">
            <Icon k="pin" /> Pinned by a leader
          </p>
          <ul className="msgs">
            {pinned.map(m => (
              <Message key={m.id} m={m} pinnedView />
            ))}
          </ul>
        </section>
      ) : null}
      <section className="card">
        {list.length ? (
          <ul className="msgs">
            {list.map(m => (
              <Message key={m.id} m={m} />
            ))}
          </ul>
        ) : (
          <p className="muted">
            {chatFilter === "open"
              ? "No open questions right now."
              : "No messages yet. Say hello or ask a question!"}
          </p>
        )}
        <div ref={endRef} />
      </section>
      <Compose />
    </>
  );
}
