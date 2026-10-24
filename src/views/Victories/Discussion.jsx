import { useState } from "react";
import { useStore, setState } from "@/store.js";
import { stats } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Avatar } from "@/components/ui/Avatar.jsx";
import { postReply, deleteReply } from "@/actions";

function Reply({ r }) {
  const { players, uid, canLead } = useStore();
  const p = players[r.uid];
  const mine = r.uid === uid;
  return (
    <li>
      <span className="bubble sm-b">{p ? <Avatar look={p.look} n={stats(p).n} bust /> : null}</span>
      <div>
        <b>{p ? p.alias : "Former member"}</b>
        <p>{r.text}</p>
        {mine || canLead ? (
          <button className="linkish" onClick={() => deleteReply(r.id)}>
            {mine ? "Delete" : "Remove"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

// Discussion under each unlocked Victory Moment (shared group only). week = 1..10
export default function Discussion({ week }) {
  const { mode, replies, readOnly, openDisc } = useStore();
  const [text, setText] = useState("");
  if (mode !== "shared") {
    return null;
  }
  const list = replies
    .filter(r => r.week === week)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return (
    <details
      className="disc"
      open={!!(openDisc && openDisc[week])}
      onToggle={e => {
        const o = e.currentTarget.open;
        setState(s => ({ openDisc: { ...s.openDisc, [week]: o } }));
      }}
    >
      <summary>
        <Icon k="group" /> Discussion{list.length ? ` · ${list.length}` : ""}
      </summary>
      {list.length ? (
        <ul className="replies">
          {list.map(r => (
            <Reply key={r.id} r={r} />
          ))}
        </ul>
      ) : (
        <p className="small muted">No replies yet. Be the first to share.</p>
      )}
      {readOnly ? null : (
        <div className="reply-form">
          <textarea
            maxLength={280}
            rows={2}
            placeholder="Share your answer (280 characters)"
            aria-label="Your reply"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button
            className="btn sm go"
            onClick={async () => {
              if (await postReply(week, text)) {
                setText("");
              }
            }}
          >
            Post
          </button>
        </div>
      )}
    </details>
  );
}
