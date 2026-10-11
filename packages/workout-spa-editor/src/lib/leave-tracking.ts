/**
 * Whether the page is being left while a lazy import is in flight.
 *
 * Firefox cancels a document's pending requests as soon as a navigation
 * away starts, while the document keeps running until the destination
 * commits, so the pending `import()` rejects exactly like a stale chunk.
 * Reload recovery must not answer that rejection: the reload would replace
 * the navigation the user asked for.
 *
 * Any `beforeunload` raised while an import is pending marks the page as
 * leaving, whether or not an unsaved-changes prompt was shown: the page
 * cannot observe the user's answer to the prompt, and only a confirmed
 * leave cancels the requests. The mark is cleared by evidence the page
 * stayed — the user pointing or typing in it again (the prompt itself is
 * browser UI, so answering it reaches no page listener), or the page being
 * shown again from the back/forward cache.
 *
 * Nothing is registered at module load. `beforeunload` is listened to only
 * while an import is pending, and the stay listeners only while the mark
 * is set.
 */
const STAY_EVIDENCE = ["pointerdown", "keydown", "pageshow"] as const;

let pendingImports = 0;
let leaving = false;

const onStay = () => {
  leaving = false;
  for (const type of STAY_EVIDENCE)
    window.removeEventListener(type, onStay, true);
};

const onBeforeUnload = () => {
  if (leaving) return;
  leaving = true;
  for (const type of STAY_EVIDENCE) window.addEventListener(type, onStay, true);
};

const startTracking = () => {
  pendingImports += 1;
  if (pendingImports === 1)
    window.addEventListener("beforeunload", onBeforeUnload);
};

const stopTracking = () => {
  pendingImports -= 1;
  if (pendingImports === 0)
    window.removeEventListener("beforeunload", onBeforeUnload);
};

/** Runs `load`, watching for a leave until the promise it returns settles. */
export const trackLeaveDuring = async <T>(
  load: () => PromiseLike<T>
): Promise<T> => {
  startTracking();
  try {
    return await load();
  } finally {
    stopTracking();
  }
};

/** True after a leave began during an import, until the page shows it stayed. */
export const isLeaving = (): boolean => leaving;
