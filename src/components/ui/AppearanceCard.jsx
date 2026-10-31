import { useState } from "react";
import { currentTheme, setTheme } from "@/lib/theme.js";

// Me › Appearance: the light Desert morning look, or the original dark one. Saved on this device.
export function AppearanceCard() {
  const [theme, setLocal] = useState(currentTheme);
  const pick = t => {
    setTheme(t);
    setLocal(t);
  };
  return (
    <section className="card row between appearance">
      <div>
        <p className="eyebrow">Appearance</p>
        <b>{theme === "light" ? "Desert morning (light)" : "Lamplight (dark)"}</b>
        <p className="small muted">Saved on this device.</p>
      </div>
      <div className="seg" role="group" aria-label="Appearance">
        <button aria-pressed={theme === "light"} onClick={() => pick("light")}>
          Light
        </button>
        <button aria-pressed={theme === "dark"} onClick={() => pick("dark")}>
          Dark
        </button>
      </div>
    </section>
  );
}
