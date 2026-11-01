import { useStore } from "@/store.js";
import { dismissToast } from "@/actions";

// The status region stays mounted so screen readers pick up each new message; the toast itself comes and goes.
export function Toast() {
  const t = useStore(s => s.toast);
  return (
    <div role="status" aria-live="polite">
      {t ? (
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
      ) : null}
    </div>
  );
}
