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
 * Failure mode: if the new page has no `[data-route-heading]`,
 * `console.warn` once with the offending pathname and fall back to
 * focusing `document.body`. Loud-but-not-fatal so missing markup is
 * caught in dev/QA without breaking the surface in production.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

import { ROUTE_HEADING_SELECTOR } from "../routing/constants";

const FALLBACK_WARN = "useFocusOnRouteChange: no [data-route-heading]";

export function useFocusOnRouteChange(): void {
  const [pathname] = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    // Defer to the next animation frame so the new page's heading
    // has mounted before we query for it. Without this, route
    // transitions that suspend or render asynchronously would miss
    // the element on the synchronous post-effect tick.
    const raf = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(
        ROUTE_HEADING_SELECTOR
      );
      if (target) {
        target.focus({ preventScroll: true });
        return;
      }
      // Fallback per spec — warn loudly, focus body so the document
      // still has a sensible focus owner.
      console.warn(FALLBACK_WARN, pathname);
      document.body.focus?.();
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);
}
