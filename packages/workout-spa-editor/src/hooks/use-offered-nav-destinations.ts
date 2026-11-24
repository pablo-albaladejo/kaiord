import { useMemo } from "react";

import { useCapabilities } from "../contexts/capabilities-context";
import {
  NAV_DESTINATIONS,
  type NavDestination,
} from "../routing/nav-destinations";

/** The navigation destinations the athlete is offered: none an off Capability owns. */
export const useOfferedNavDestinations = (): readonly NavDestination[] => {
  const capabilities = useCapabilities();
  return useMemo(
    () => NAV_DESTINATIONS.filter((d) => capabilities.offers("nav", d.id)),
    [capabilities]
  );
};
