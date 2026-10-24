import { setTab } from "@/actions";

export const BackButton = ({ tab, label }) => (
  <button className="linkish back" onClick={() => setTab(tab)}>
    ← {label}
  </button>
);
