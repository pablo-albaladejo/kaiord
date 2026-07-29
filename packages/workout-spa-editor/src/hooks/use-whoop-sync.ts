/**
 * useWhoopSync — live, once-per-mount governed pull of WHOOP cycles (HRV,
 * sleep, strain, vitals), heart-rate series, stress episodes, and executed
 * workouts into their persisted stores.
 *
 * Mirrors useGarminActivitiesPull: gates on a discovered whoop-bridge, then
 * defers the whole pull to `runWhoopImport`, which the Connections page's
 * manual "Sync now" also calls so the two paths cannot drift. Errors are
 * swallowed so a failed pull never breaks the calendar mount. The `firedRef`
 * guard keeps it single-shot per profile so re-renders never re-fire the
 * network call.
 */
import { useEffect, useRef } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { usePersistence } from "../contexts/persistence-context";
import { runWhoopImport } from "./bridge-import/run-whoop-import";
import { useDiscoveredBridges } from "./use-discovered-bridges";

const WHOOP_BRIDGE_ID = "whoop-bridge";

export const useWhoopSync = (profileId: string | null): void => {
  const persistence = usePersistence();
  const discovered = useDiscoveredBridges();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profileId || firedRef.current === profileId) return;
    if (!discovered.some((d) => d.bridgeId === WHOOP_BRIDGE_ID)) return;
    const extensionId = bridgeDiscovery.getExtensionId(WHOOP_BRIDGE_ID);
    if (!extensionId) return;
    firedRef.current = profileId;
    void runWhoopImport(persistence, extensionId, profileId).catch(
      () => undefined
    );
  }, [profileId, discovered, persistence]);
};
