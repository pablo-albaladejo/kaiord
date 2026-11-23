import type { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";

import { useCapabilities } from "../../../contexts/capabilities-context";
import { DAILY_PATH } from "../../../routing/constants";
import { RouteSpinner } from "../RouteSpinner";

/**
 * Every route an off Capability owns redirects to the Day, read from the
 * catalogue rather than per route, so declaring a Capability's routes is all
 * it takes. Until the athlete's decisions are read it renders the spinner:
 * redirecting then would bounce a deep link of a Capability that is on.
 */
export function CapabilityRouteGate({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const capabilities = useCapabilities();
  if (capabilities.offers("route", location)) return <>{children}</>;
  if (capabilities.status === "loading") return <RouteSpinner />;
  return <Redirect to={DAILY_PATH} replace />;
}
