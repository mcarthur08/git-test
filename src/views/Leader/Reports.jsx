import { useStore } from "@/store.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { deleteMessage, dismissReports, setTab } from "@/actions";

// Chat messages someone reported, grouped by message, so a leader can remove or keep each one.
export default function Reports() {
  const { reports, messages, players } = useStore();
  const byMsg = {};
  reports.forEach(r => {
    (byMsg[r.msg] = byMsg[r.msg] || []).push(r);
  });
  const ids = Object.keys(byMsg);
  return (
    <section className="card stack reports">
      <div className="row between">
        <h3>
          <Icon k="flag" /> Reported chat messages
        </h3>
        <button className="btn sm" onClick={() => setTab("chat")}>
          Open chat
        </button>
      </div>
      {ids.length ? (
        <ul className="msgs">
          {ids.map(id => {
            const m = messages.find(x => x.id === id);
            const author = m && players[m.uid];
            return (
              <li key={id} className="msg">
                <div className="msg-body">
                  <div className="msg-head">
                    <b>{m ? (author ? author.alias : "Former member") : "Already deleted"}</b>
                    <span className="small muted">
                      Reported by {byMsg[id].length} {byMsg[id].length === 1 ? "person" : "people"}
                    </span>
                  </div>
                  {m ? <p className="msg-text">{m.text}</p> : null}
                  <div className="msg-acts">
                    {m ? (
                      <button className="btn sm danger" onClick={() => deleteMessage(id)}>
                        Remove message
                      </button>
                    ) : null}
                    <button className="btn sm" onClick={() => dismissReports(id)}>
                      {m ? "Keep it" : "Clear"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="small muted">
          Nothing reported. When someone reports a chat message it shows up here.
        </p>
      )}
    </section>
  );
}
