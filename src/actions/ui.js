// Toasts, confetti, the reveal-card queue and the full-screen character.
import { getState, setState } from "@/store.js";

let toastId = 0;
let toastTimer = null;
export function toast(msg, action) {
  clearTimeout(toastTimer);
  setState({ toast: { id: ++toastId, msg, action: action || null } });
  toastTimer = setTimeout(() => setState({ toast: null }), action ? 6000 : 3200);
}

export function dismissToast(run) {
  const t = getState().toast;
  clearTimeout(toastTimer);
  setState({ toast: null });
  if (run && t && t.action) {
    t.action.fn();
  }
}

export function confetti(x, y, count = 36) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const cols = ["#F2D58C", "#D9AE55", "#E0913A", "#FFF1C9", "#F6B860"];
  for (let i = 0; i < count; i++) {
    const b = document.createElement("div");
    b.className = "confetti";
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const sp = 90 + Math.random() * 160;
    b.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % cols.length]};color:${
      cols[i % cols.length]
    };--dx:${Math.cos(a) * sp}px;--dy:${Math.sin(a) * sp + 160 + Math.random() * 120}px;--r:${
      (Math.random() - 0.5) * 900
    }deg;animation-delay:${Math.random() * 0.08}s`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1700);
  }
}

let revealId = 0;
export const queueReveal = r =>
  setState(s => ({ reveals: [...s.reveals, { ...r, id: ++revealId }] }));
export function closeReveal(act) {
  const r = getState().reveals[0];
  setState(s => ({ reveals: s.reveals.slice(1) }));
  if (act && r && r.onAct) {
    r.onAct();
  }
}

export const openViewer = viewer => setState({ viewer });
export const closeViewer = () => setState({ viewer: null });
