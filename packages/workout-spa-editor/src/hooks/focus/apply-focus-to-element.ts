/**
 * Low-level focus application (§7.6).
 *
 * Called from a `setTimeout(fn, 0)` so that any concurrent
 * `role="status"` toast update queues first in the AT speech
 * pipeline, giving the user a chance to hear the mutation outcome
 * before the caret relocates.
 *
 * Safety:
 *   - `focus({ preventScroll: true })` wrapped in try/catch — if the
 *     node has been detached between the resolve and the timer, we
 *     swallow the throw rather than triggering a render loop.
 *   - `scrollIntoView` wrapped separately — legacy engines throw
 *     `TypeError` on the options-object form; we fall back to a no-op
 *     rather than aborting the focus move that already succeeded.
 *
 * The hook clears `pendingFocusTarget` and updates its `prevTarget`
 * ref *before* scheduling this call, so a throw here does not cause
 * a retry storm.
 */

export type FocusApplyOptions = {
  reduceMotion: boolean;
};

export const applyFocusToElement = (
  el: HTMLElement,
  { reduceMotion }: FocusApplyOptions
): void => {
  try {
    el.focus({ preventScroll: true });
  } catch {
    // Element was detached or refused focus — the hook has already
    // cleared pendingFocusTarget, so nothing else to do.
    return;
  }
  try {
    el.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? ("instant" as ScrollBehavior) : "auto",
    });
  } catch {
    // Legacy browsers reject the options-object form; the focus move
    // itself already succeeded above.
  }
};

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
};
