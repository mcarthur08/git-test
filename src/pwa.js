// Registers the service worker (production builds only) and tells the player when a new version is ready.
import { toast } from "@/actions";

// Ask the waiting worker to take over, then reload once it has.
function reloadWhenReady(worker) {
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
    once: true
  });
  worker.postMessage("SKIP_WAITING");
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }
  window.addEventListener("load", async () => {
    let registration;
    try {
      registration = await navigator.serviceWorker.register("sw.js");
    } catch (error) {
      return;
    }
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) {
        return;
      }
      worker.addEventListener("statechange", () => {
        // "installed" with an existing controller means this is an update, not the first install.
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          toast("A new version is ready.", { label: "Reload", fn: () => reloadWhenReady(worker) });
        }
      });
    });
  });
}
