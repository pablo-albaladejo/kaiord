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

const FALLBACK_WARN = "useFocusOnRouteChange: no [data-route-heading]";
// Bound the wait for a route-heading to appear. Long enough to cover
// a cold lazy-chunk fetch in a typical test/dev environment, short
// enough that a truly missing contract surfaces the warn quickly.
const OBSERVE_TIMEOUT_MS = 1500;

export function useFocusOnRouteChange(): void {
  const [pathname] = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    let observer: MutationObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const focusTarget = (target: HTMLElement) => {
      target.focus({ preventScroll: true });
    };

    const tryFocus = (): boolean => {
      const target = document.querySelector<HTMLElement>(
        ROUTE_HEADING_SELECTOR
      );
      if (target) {
        focusTarget(target);
        return true;
      }
      return false;
    };

    const cleanup = () => {
      observer?.disconnect();
      observer = null;
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

      timeoutId = setTimeout(() => {
        cleanup();
        // Fallback per spec — warn loudly, focus body so the document
        // still has a sensible focus owner.
        console.warn(FALLBACK_WARN, pathname);
        document.body.focus?.();
      }, OBSERVE_TIMEOUT_MS);
    });

    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [pathname]);
}
