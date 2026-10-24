import { useEffect, useState } from "react";
import { prevVals, reducedMotion } from "./motion.js";

// A number that counts up from the last value it showed.
export function Count({ k, value }) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const from = prevVals[k] ?? 0;
    prevVals[k] = value;
    if (reducedMotion() || from === value) {
      setV(value);
      return;
    }
    let raf;
    const t0 = performance.now();
    const dur = 800;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from + (value - from) * e));
      if (p < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [k, value]);
  return <>{v}</>;
}
