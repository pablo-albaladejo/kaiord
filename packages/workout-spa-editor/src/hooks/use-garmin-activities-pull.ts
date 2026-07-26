/**
 * useGarminActivitiesPull — live, once-per-mount governed pull of executed
 * Garmin activities into the v27 `activities` store (F5.3).
 *
 * Mirrors the zones auto-import lifecycle: gates on a discovered garmin-bridge
 * and defers all governance (route-inactive → no fetch) to the pure
 * `pullGarminActivities` use case. Errors are swallowed so a failed pull never
 * breaks the calendar mount. The `firedRef` guard keeps it single-shot per
 * profile so re-renders never re-fire the network call.
 */
import { useEffect, useRef } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { readGarminActivities } from "../adapters/garmin/garmin-activities-transport";
import { pullGarminActivities } from "../application/import/pull-garmin-activities.use-case";
import { usePersistence } from "../contexts/persistence-context";
import { useDiscoveredBridges } from "./use-discovered-bridges";

const GARMIN_BRIDGE_ID = "garmin-bridge";

export const useGarminActivitiesPull = (profileId: string | null): void => {
  const persistence = usePersistence();
  const discovered = useDiscoveredBridges();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profileId || firedRef.current === profileId) return;
    if (!discovered.some((d) => d.bridgeId === GARMIN_BRIDGE_ID)) return;
    const extensionId = bridgeDiscovery.getExtensionId(GARMIN_BRIDGE_ID);
    if (!extensionId) return;
    firedRef.current = profileId;
    void pullGarminActivities(
      {
        policyRepo: persistence.integrationPolicy,
        activities: persistence.activities,
        coachingSyncState: persistence.coachingSyncState,
        readActivities: () => readGarminActivities(extensionId),
      },
      profileId
    ).catch(() => undefined);
  }, [profileId, discovered, persistence]);
};
