import { useEffect, useRef } from "react";
import { useStore, setState } from "@/store.js";
import { DAYS, PLAN, CHAPTERS, RD_SIZES } from "@/lib/data.js";
import { readingURL } from "@/lib/util.js";
import { stats } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { BackButton } from "@/components/ui/BackButton.jsx";
import { loadBooks, autoMark, setMark, flushMark } from "@/actions";
import ReaderHeader from "./ReaderHeader.jsx";
import ChapterText from "./ChapterText.jsx";
import FinishBlock from "./FinishBlock.jsx";

// The in-app KJV reader for one day's chapters.
export default function Reader() {
  const { me, kjv, readDay, readFrom, rdSize, rdLight, readJump } = useStore();
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
  const textRef = useRef(null);
  // Continue reading: once the text is on screen, scroll to the bookmarked verse and highlight it.
  useEffect(() => {
    if (!ready || !readJump) {
      return;
    }
    const el =
      textRef.current &&
      textRef.current.querySelector(`[data-ci="${readJump.ci}"][data-v="${readJump.v}"]`);
    setState({ readJump: null });
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.classList.add("vs-flash");
      setTimeout(() => el.classList.remove("vs-flash"), 2600);
    }
  }, [ready, readJump]);
  // Your place moves forward on its own: the verse at the top of the screen, a moment after you stop scrolling.
  useEffect(() => {
    if (!ready) {
      return;
    }
    let t = null;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const box = textRef.current;
        if (!box) {
          return;
        }
        const r = box.getBoundingClientRect();
        const y = Math.min(Math.max(150, r.top + 8), innerHeight - 20);
        const hit = document.elementFromPoint(r.left + Math.min(40, r.width / 2), y);
        const vs = hit && hit.closest && hit.closest(".vs");
        if (vs && box.contains(vs)) {
          autoMark(day, +vs.dataset.ci, +vs.dataset.v);
        }
      }, 700);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      flushMark();
    };
  }, [ready, day]);
  // Tap a verse to bookmark it (not while selecting text, or tapping a link).
  const onTextClick = e => {
    const vs = e.target.closest && e.target.closest(".vs");
    const sel = window.getSelection && String(window.getSelection());
    if (vs && !sel && !e.target.closest("a")) {
      setMark(day, +vs.dataset.ci, +vs.dataset.v);
    }
  };
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
        <p className="small muted rd-tip">
          Your place is saved as you read. Tap any verse to bookmark it.
        </p>
        <div className="rd-text" ref={textRef} onClick={onTextClick}>
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
