/**
 * Low-level focus application (§7.6).
 *
 * Called from `setTimeout(fn, 0)` so concurrent `role="status"` toasts
 * queue first in the AT speech pipeline.
 *
 * Safety: `focus()` and `scrollIntoView()` are each caught separately.
 * A throw on `focus()` aborts early (scroll skipped); a throw on
 * `scrollIntoView()` is swallowed — the focus move already succeeded.
 * Both catches emit a `focus-error` telemetry event when a handler is
 * provided.
 */

import {
  focusErrorEvent,
  type FocusTelemetry,
  safeEmit,
} from "../../store/providers/focus-telemetry";

export type FocusApplyOptions = {
  reduceMotion: boolean;
  telemetry?: FocusTelemetry;
};

export const applyFocusToElement = (
  el: HTMLElement,
  { reduceMotion, telemetry }: FocusApplyOptions
): void => {
  try {
    el.focus({ preventScroll: true });
  } catch {
    if (telemetry) safeEmit(telemetry, focusErrorEvent("focus"));
    return;
  }
  try {
    el.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? ("instant" as ScrollBehavior) : "auto",
    });
  } catch {
    if (telemetry) safeEmit(telemetry, focusErrorEvent("scrollIntoView"));
  }
};

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
};
