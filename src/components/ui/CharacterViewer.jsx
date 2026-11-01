import { useEffect, useRef } from "react";
import { useStore } from "@/store.js";
import { closeViewer } from "@/actions";
import { Icon } from "./Icon.jsx";
import { Avatar } from "./Avatar.jsx";

// Your character as large as the screen allows. Tap anywhere, press Escape or use the button to close it.
export function CharacterViewer() {
  const v = useStore(s => s.viewer);
  const close = useRef(null);
  useEffect(() => {
    if (!v) {
      return undefined;
    }
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus({ preventScroll: true });
    const onKey = e => {
      if (e.key === "Escape") {
        closeViewer();
      } else if (e.key === "Tab") {
        // the close button is the only thing to reach, so keep focus on it
        e.preventDefault();
        close.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [!!v]);
  if (!v) {
    return null;
  }
  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`${v.name}, full screen`}
      onClick={closeViewer}
    >
      <button ref={close} className="viewer-close" aria-label="Close full screen view">
        <Icon k="collapse" />
      </button>
      <div className="viewer-stage">
        <Avatar look={v.look} n={v.n} full live />
      </div>
      <p className="viewer-cap">
        <b>{v.name}</b>
        <span>{v.sub}</span>
      </p>
    </div>
  );
}
