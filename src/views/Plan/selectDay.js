import { setState } from "@/store.js";

// Select a day on the plan (or null to close) and bring its details into view.
export function selectDay(day) {
  setState({ sel: day });
  if (day) {
    setTimeout(() => {
      const d = document.getElementById("daydetail");
      if (d) {
        d.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 0);
  }
}
