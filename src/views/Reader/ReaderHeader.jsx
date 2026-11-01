import { useStore } from "@/store.js";
import { PLAN } from "@/lib/data.js";
import { parseISO, fmtDate } from "@/lib/util.js";
import { dayDate } from "@/lib/player.js";
import { changeReaderSize, toggleReaderLight } from "@/actions";
import { currentTheme } from "@/lib/theme.js";

// The page button: dark/light in the dark theme, white/sepia in the light theme.
const pageLabels = () => (currentTheme() === "light" ? ["White", "Sepia"] : ["Dark", "Light"]);

const jumpTo = i => {
  const el = document.getElementById("rd-ch-" + i);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// Day title, chapter jump buttons, and text size / page colour.
export default function ReaderHeader({ day, chs, light }) {
  const config = useStore(s => s.config);
  const start = parseISO(config.start);
  return (
    <header className="rd-head">
      <p className="eyebrow">
        Day {day}
        {start ? " · " + fmtDate(dayDate(start, day)) : ""} · King James Version
      </p>
      <h2>{PLAN[day - 1].label}</h2>
      <div className="rd-tools">
        {chs.length > 1 ? (
          <div className="rd-jump" aria-label="Jump to chapter">
            {chs.map((c, i) => (
              <button key={i} onClick={() => jumpTo(i)}>
                {c.one ? c.b : i === 0 || chs[i - 1].b !== c.b ? `${c.ab} ${c.c}` : String(c.c)}
              </button>
            ))}
          </div>
        ) : (
          <span></span>
        )}
        <div className="rd-opts">
          <button onClick={() => changeReaderSize(-1)} aria-label="Smaller text">
            A−
          </button>
          <button onClick={() => changeReaderSize(1)} aria-label="Larger text">
            A+
          </button>
          <button onClick={toggleReaderLight} aria-label={`${pageLabels()[light ? 0 : 1]} page`}>
            {pageLabels()[light ? 0 : 1]}
          </button>
        </div>
      </div>
    </header>
  );
}
