import { useEffect, useState } from "react";
import { prevVals } from "./motion.js";

// A gold progress bar that fills from where it last was.
export function Meter({ k, pct, ...rest }) {
  const [w, setW] = useState(() => prevVals[k] ?? 0);
  useEffect(() => {
    prevVals[k] = pct;
    setW(pct);
  }, [k, pct]);
  return (
    <div className="meter" {...rest}>
      <i style={{ width: w + "%" }} />
    </div>
  );
}
