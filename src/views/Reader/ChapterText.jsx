import { readingURL } from "@/lib/util.js";
import { LoadingDots } from "@/components/ui/LoadingDots.jsx";

// The verses, or a loading / failed state while the book files arrive.
export default function ChapterText({ chs, kjv, failed, ready, label }) {
  if (failed) {
    return (
      <div className="note warn">
        Couldn't load the Bible text. Check your connection, or{" "}
        <a href={readingURL(label, "KJV")} target="_blank" rel="noopener">
          open it on Bible Gateway
        </a>
        .
      </div>
    );
  }
  if (!ready) {
    return <LoadingDots>Opening the scroll…</LoadingDots>;
  }
  return chs.map((c, i) => {
    const verses = kjv[c.b][c.c - 1] || [];
    return (
      <section key={i} className="rd-chapter" id={"rd-ch-" + i}>
        <h3>{c.one ? c.b : `${c.b} ${c.c}`}</h3>
        <p>
          {verses.map((t, v) => (
            <span key={v} className="vs" data-ci={i} data-v={v + 1}>
              {v ? " " : ""}
              <sup>{v + 1}</sup>
              {t}
            </span>
          ))}
        </p>
      </section>
    );
  });
}
