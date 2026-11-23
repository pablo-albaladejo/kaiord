import { hasUnsavedEdits } from "../unsaved-edits";
import { applyUpdate } from "./apply-update";
import { hasInteracted } from "./first-input";
import { countWindows } from "./hello";
import { setRegistration, setUpdateState } from "./update-store";

const SILENT_WINDOW_MS = 10_000;
const CHECK_EVERY_MS = 60 * 60 * 1000;

export type WatchDeps = {
  container: ServiceWorkerContainer;
  sinceLoadMs: () => number;
};

async function offerUpdate({ container, sinceLoadMs }: WatchDeps) {
  const early = sinceLoadMs() <= SILENT_WINDOW_MS && !hasInteracted();
  if (early && !hasUnsavedEdits() && (await countWindows(container)) === 1) {
    await applyUpdate();
    return;
  }
  setUpdateState("available");
}

// The browser checks on navigation; an installed app can stay open for
// days without one, so the page checks too, at most once an hour.
function scheduleUpdateChecks(registration: ServiceWorkerRegistration) {
  let last = Date.now();
  const check = () => {
    if (Date.now() - last < CHECK_EVERY_MS) return;
    last = Date.now();
    registration.update().catch(() => undefined);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
  setInterval(check, CHECK_EVERY_MS);
}

/** Finds a waiting worker, now or later, and offers or applies it. */
export function watchRegistration(
  registration: ServiceWorkerRegistration,
  deps: WatchDeps
): void {
  setRegistration(registration);
  // With no controller this is the first worker: nothing to update from.
  if (registration.waiting && deps.container.controller) {
    void offerUpdate(deps);
  }
  const watchInstalling = () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && deps.container.controller) {
        void offerUpdate(deps);
      }
    });
  };
  // A navigation may have started an install before the page registered.
  watchInstalling();
  registration.addEventListener("updatefound", watchInstalling);
  scheduleUpdateChecks(registration);
}
