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
 *   - route: window.location.pathname, scrubbed (no truncation)
 *   - name: error.name || "Error", scrubbed (no truncation)
 *   - message: error.message, scrubbed and truncated to ≤ 500
 *   - componentStack: info.componentStack, scrubbed and truncated to ≤ 1000
 */
export function buildRouteErrorPayload(
  error: Error,
  info: ErrorInfo,
  scrub: typeof scrubAnalyticsString
): RouteErrorPayload {
  return {
    route: scrub(window.location.pathname),
    name: scrub(error.name || "Error"),
    message: scrub(error.message ?? "", 500),
    componentStack: scrub(info.componentStack ?? "", 1000),
  };
}
