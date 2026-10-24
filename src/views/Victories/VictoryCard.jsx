import { useStore } from "@/store.js";
import { plural, readingURL } from "@/lib/util.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { VictoryMedal } from "@/components/ui/Emblems.jsx";
import Discussion from "./Discussion.jsx";

export default function VictoryCard({ v, i, n, open }) {
  const version = useStore(s => s.config.version);
  if (!open) {
    return (
      <article className="card vic locked">
        <VictoryMedal i={i} />
        <div className="body">
          <p className="eyebrow">
            Week {i + 1} · unlocks after {v.day} days read
          </p>
          <h3>{v.title}</h3>
          <p className="small muted">
            {plural(v.day - n, "more day")} to go. Keep reading to unlock this story from {v.ref}.
          </p>
        </div>
      </article>
    );
  }
  return (
    <article className="card vic">
      <VictoryMedal i={i} />
      <div className="body">
        <p className="eyebrow">
          Week {i + 1} · {v.ref}
        </p>
        <h3>{v.title}</h3>
        <p>{v.story}</p>
        <blockquote>
          "{v.verse}"<span>{v.verseRef} · KJV</span>
        </blockquote>
        <p className="small">
          <b>New Testament connection (KJV):</b> {v.nt}
        </p>
        <div className="q">
          <b>Talk about it:</b> {v.q}
        </div>
        <div className="row">
          <a className="btn sm" href={readingURL(v.ref, version)} target="_blank" rel="noopener">
            Read {v.ref} <Icon k="ext" />
          </a>
        </div>
        <Discussion week={i + 1} />
      </div>
    </article>
  );
}
