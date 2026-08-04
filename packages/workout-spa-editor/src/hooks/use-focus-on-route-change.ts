/**
 * useFocusOnRouteChange — move focus to the routed page's primary
 * heading on each pathname change so keyboard / screen-reader users
 * land in a deterministic location, restoring the focus-management
 * equity that the deleted header modal provided via Radix Dialog.
 *
 * Contract: each routed page renders a heading with the
 * `[data-route-heading]` attribute and `tabIndex={-1}`. CSS rule
 * `[data-route-heading]:focus:not(:focus-visible) { outline: none }`
 * suppresses the focus ring for non-keyboard activations.
 *
 * Resilience to lazy-loaded pages: routes are `React.lazy` chunks
 * gated by `<Suspense>`, so the heading may not exist on the first
 * post-effect rAF. We observe the document subtree with
 * `MutationObserver` until the heading appears (bounded by
 * `OBSERVE_TIMEOUT_MS` so a missing heading is detected loudly and
 * the page still has a sensible focus owner).
 *
 * Failure mode: if no `[data-route-heading]` appears within the
 * timeout, `console.warn` once with the offending pathname and fall
 * back to focusing `document.body`. Loud-but-not-fatal so missing
 * markup is caught in dev/QA without breaking the surface in
 * production.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

import { ROUTE_HEADING_SELECTOR } from "../routing/constants";
import { logger } from "../utils/logger";

const FALLBACK_WARN = "useFocusOnRouteChange: no [data-route-heading]";
// Bound the wait for a route-heading to appear. Long enough to cover
// a cold lazy-chunk fetch on mobile webkit / slow CI runners, short
// enough that a truly missing contract surfaces the warn quickly.
// Mobile Safari needed >1500ms for the LibraryPage chunk to land in
// the original 1500ms budget — bumped to 5000ms to stop the BODY
// fallback being taken in CI.
const OBSERVE_TIMEOUT_MS = 5000;
// Cadence for re-attempting a focus the engine dropped. Short enough that a
// keyboard user does not notice, long enough not to busy-wait for 5s.
const RETRY_INTERVAL_MS = 50;

export function useFocusOnRouteChange(): void {
  const [pathname] = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    let observer: MutationObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryId: ReturnType<typeof setInterval> | null = null;

    const focusTarget = (target: HTMLElement) => {
      target.focus({ preventScroll: true });
    };

    const tryFocus = (): boolean => {
      const target = document.querySelector<HTMLElement>(
        ROUTE_HEADING_SELECTOR
      );
      if (!target) return false;
      focusTarget(target);
      // Engines silently drop a programmatic focus applied during the
      // post-navigation settle window — the call returns normally and
      // activeElement stays put. Reporting success on the element merely
      // existing retires the retry path on a focus that never landed, so
      // confirm it before claiming it.
      return document.activeElement === target;
    };

    const cleanup = () => {
      observer?.disconnect();
      observer = null;
      if (retryId !== null) {
        clearInterval(retryId);
        retryId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // Defer to the next animation frame so the new page's heading
    // has a chance to mount synchronously before we resort to a
    // mutation observer. Most non-lazy transitions resolve here.
    const raf = requestAnimationFrame(() => {
      if (tryFocus()) return;

      // Lazy chunk hasn't resolved yet — observe DOM mutations until
      // the heading appears (bounded by OBSERVE_TIMEOUT_MS).
      observer = new MutationObserver(() => {
        if (tryFocus()) cleanup();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // A dropped focus mutates nothing, so the observer alone would wait
      // for a mutation that never comes. Re-attempt on a timer until the
      // focus sticks or the budget runs out.
      retryId = setInterval(() => {
        if (tryFocus()) cleanup();
      }, RETRY_INTERVAL_MS);

      timeoutId = setTimeout(() => {
        cleanup();
        // Fallback per spec — warn loudly, focus body so the document
        // still has a sensible focus owner.
        logger.warn(FALLBACK_WARN, { pathname });
        document.body.focus?.();
      }, OBSERVE_TIMEOUT_MS);
    });

    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [pathname]);
}
