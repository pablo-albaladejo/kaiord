/**
 * useTrainingPeaksSync — live, once-per-mount governed pull of TrainingPeaks
 * weight readings into the weight store.
 *
 * Mirrors useWhoopSync: gates on a discovered trainingpeaks-bridge, then
 * defers the pull to `runTrainingPeaksImport`, which the Connections page's
 * manual "Sync now" also calls. Errors are swallowed so a failed pull never
 * breaks the calendar mount. The `firedRef` guard keeps it single-shot per
 * profile.
 */
import { useEffect, useRef } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { usePersistence } from "../contexts/persistence-context";
import { runTrainingPeaksImport } from "./bridge-import/run-trainingpeaks-import";
import { useDiscoveredBridges } from "./use-discovered-bridges";

const TP_BRIDGE_ID = "trainingpeaks-bridge";

export const useTrainingPeaksSync = (profileId: string | null): void => {
  const persistence = usePersistence();
  const discovered = useDiscoveredBridges();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profileId || firedRef.current === profileId) return;
    if (!discovered.some((d) => d.bridgeId === TP_BRIDGE_ID)) return;
    const extensionId = bridgeDiscovery.getExtensionId(TP_BRIDGE_ID);
    if (!extensionId) return;
    firedRef.current = profileId;
    void runTrainingPeaksImport(persistence, extensionId, profileId).catch(
      () => undefined
    );
  }, [profileId, discovered, persistence]);
};
