import { useEffect, useRef } from "react";
import { useStore } from "@/store.js";
import { closeReveal, confetti } from "@/actions";
import { Icon } from "./Icon.jsx";

// One row of a reveal card's list: a version heading, or an icon with a title and a line of detail.
function RevealItem({ it }) {
  if (it.ver) {
    return <li className="rv-ver">{it.ver}</li>;
  }
  return (
    <li>
      <span className="rv-ic">
        <Icon k={it.ic} />
      </span>
      <span>
        <b>{it.title}</b>
        {it.html ? (
          <span className="small muted" dangerouslySetInnerHTML={{ __html: it.sub }} />
        ) : (
          <span className="small muted">{it.sub}</span>
        )}
      </span>
    </li>
  );
}

// The celebration card: badges, unlocks, new tribe, what's new. Cards queue up and show one at a time.
export function Reveal() {
  const reveals = useStore(s => s.reveals);
  const r = reveals[0];
  const card = useRef(null);
  const first = useRef(null);
  useEffect(() => {
    if (!r) {
      return;
    }
    const rc = card.current.getBoundingClientRect();
    const t = setTimeout(() => confetti(rc.left + rc.width / 2, rc.top + 40, 44), 150);
    if (first.current) {
      first.current.focus({ preventScroll: true });
    }
    card.current.scrollTop = 0;
    return () => clearTimeout(t);
  }, [r && r.id]);
  useEffect(() => {
    if (!r) {
      return;
    }
    const onKey = e => {
      if (e.key === "Escape") {
        e.preventDefault(); // tells other Escape handlers (the full-screen map) this press is spent
        closeReveal(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [!!r]);
  if (!r) {
    return null;
  }
  return (
    <div
      id="reveal"
      className="reveal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-title"
    >
      <div className="reveal-card" ref={card}>
        <div className="reveal-art">{r.art}</div>
        <p className="kicker">{r.kicker}</p>
        <h2 id="reveal-title">{r.title}</h2>
        {r.text ? <p className="muted">{r.text}</p> : null}
        {r.list ? (
          <ul className="rv-list">
            {r.list.map((it, i) => (
              <RevealItem key={i} it={it} />
            ))}
          </ul>
        ) : null}
        <div className="row" style={{ justifyContent: "center", marginTop: 6 }}>
          {r.action ? (
            <button className="btn go" ref={first} onClick={() => closeReveal(true)}>
              {r.action}
            </button>
          ) : null}
          <button
            className={"btn" + (r.action ? "" : " go")}
            ref={r.action ? undefined : first}
            onClick={() => closeReveal(false)}
          >
            {reveals.length > 1 ? "Next" : "Awesome"}
          </button>
        </div>
      </div>
    </div>
  );
}
