import type { ErrorInfo } from "react";

import type { scrubAnalyticsString } from "./scrub-analytics-string";

export type RouteErrorPayload = {
  route: string;
  name: string;
  message: string;
  componentStack: string;
};

/**
 * Pure function that builds the analytics payload for a render error
 * caught by RouteErrorBoundary. Decoupled from the React lifecycle so
 * payload shape can be unit-tested independently.
 *
 * Contract per `analytics-port` spec:
 *   - route: the SPA route being rendered, scrubbed (no truncation)
 *   - name: error.name || "Error", scrubbed (no truncation)
 *   - message: error.message, scrubbed and truncated to ≤ 500
 *   - componentStack: info.componentStack, scrubbed and truncated to ≤ 1000
 */
/**
 * The route the SPA is rendering, read from the URL fragment where the router
 * keeps it. `location.pathname` is the deploy prefix and nothing else now, so
 * a payload built from it would name the same route for every error — the one
 * field this event exists to carry.
 */
function currentRoute(): string {
  const hash = window.location.hash;
  return hash.startsWith("#") ? hash.slice(1) || "/" : window.location.pathname;
}

export function buildRouteErrorPayload(
  error: Error,
  info: ErrorInfo,
  scrub: typeof scrubAnalyticsString
): RouteErrorPayload {
  return {
    route: scrub(currentRoute()),
    name: scrub(error.name || "Error"),
    message: scrub(error.message ?? "", 500),
    componentStack: scrub(info.componentStack ?? "", 1000),
  };
}
