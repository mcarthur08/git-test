import { useEffect } from "react";
import { useStore } from "@/store.js";
import { DAYS, PLAN, CHAPTERS, RD_SIZES } from "@/lib/data.js";
import { readingURL } from "@/lib/util.js";
import { stats } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { BackButton } from "@/components/ui/BackButton.jsx";
import { loadBooks } from "@/actions";
import ReaderHeader from "./ReaderHeader.jsx";
import ChapterText from "./ChapterText.jsx";
import FinishBlock from "./FinishBlock.jsx";

// The in-app KJV reader for one day's chapters.
export default function Reader() {
  const { me, kjv, readDay, readFrom, rdSize, rdLight } = useStore();
  const day = Math.max(1, Math.min(DAYS, readDay || 1));
  const p = PLAN[day - 1];
  const chs = CHAPTERS.slice(p.from, p.to);
  const books = [...new Set(chs.map(c => c.b))];
  const missing = books.filter(b => !(b in kjv)).join("|");
  useEffect(() => {
    if (missing) {
      loadBooks(missing.split("|"));
    }
  }, [missing]);
  const failed = books.some(b => kjv[b] === null);
  const ready = books.every(b => kjv[b]);
  const size = RD_SIZES[rdSize ?? 2] || 1.15;
  const light = !!rdLight;
  const backTo = readFrom === "plan" ? ["plan", "Back to the plan"] : ["today", "Back to Today"];
  return (
    <>
      <BackButton tab={backTo[0]} label={backTo[1]} />
      <article
        className={"card reader" + (light ? " light" : "")}
        style={{ "--rd-size": size + "rem" }}
      >
        <ReaderHeader day={day} chs={chs} light={light} />
        <div className="rd-text">
          <ChapterText chs={chs} kjv={kjv} failed={failed} ready={ready} label={p.label} />
        </div>
        {ready ? <FinishBlock day={day} p={p} s={stats(me)} /> : null}
        <p className="small muted rd-alt">
          <a href={readingURL(p.label, "KJV")} target="_blank" rel="noopener">
            Open on Bible Gateway <Icon k="ext" />
          </a>
        </p>
      </article>
    </>
  );
}
