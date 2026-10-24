// Helpers for "install this as an app". Chrome and Edge hand us an install prompt we can trigger from
// a button; Safari on iPhone has none, so we show the Share-menu steps instead.
import { useSyncExternalStore } from "react";

let deferredPrompt = null;
const listeners = new Set();

function setPrompt(prompt) {
  deferredPrompt = prompt;
  listeners.forEach(listener => listener());
}

// Call once at startup: the browser fires beforeinstallprompt early, so it must be caught before React renders.
export function listenForInstall() {
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    setPrompt(event);
  });
  window.addEventListener("appinstalled", () => setPrompt(null));
}

export const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

export const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// True for Safari, false for Chrome/Firefox/Edge on iOS (only Safari can add to the Home Screen).
export const isIosSafari = () => isIos() && !/crios|fxios|edgios|opios/i.test(navigator.userAgent);

const subscribe = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// The saved install prompt, or null when the browser has not offered one.
export const useInstallPrompt = () => useSyncExternalStore(subscribe, () => deferredPrompt);

export async function promptInstall() {
  if (!deferredPrompt) {
    return false;
  }
  const prompt = deferredPrompt;
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  // A prompt can only be used once; after "dismissed" the browser offers a new one later.
  setPrompt(null);
  return outcome === "accepted";
}
