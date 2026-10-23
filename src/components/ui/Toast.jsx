import { useStore } from "@/store.js";
import { dismissToast } from "@/actions";

export function Toast() {
  const t = useStore(s => s.toast);
  if (!t) {
    return null;
  }
  return (
    <div id="toast" className="toast" key={t.id}>
      {t.msg}
      {t.action ? (
        <>
          {" "}
          <button className="toast-btn" onClick={() => dismissToast(true)}>
            {t.action.label}
          </button>
        </>
      ) : null}
    </div>
  );
}
