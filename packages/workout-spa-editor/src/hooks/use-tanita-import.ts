/**
 * useTanitaImport — live, once-per-mount governed pull of MyTANITA export-CSV
 * readings into the weight + body-composition stores.
 *
 * Mirrors useWhoopSync: gates on a discovered tanita-bridge, then defers the
 * pull to `runTanitaImport`, which the Connections page's manual "Sync now"
 * also calls. Distinct from `useTanitaGarminSync`, which is the MANUAL
 * outbound Tanita → Garmin push. Errors are swallowed so a failed pull never
 * breaks the calendar mount. The `firedRef` guard keeps it single-shot per
 * profile.
 */
import { useEffect, useRef } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { TANITA_BRIDGE_ID } from "../application/tanita/tanita-import-records";
import { usePersistence } from "../contexts/persistence-context";
import { runTanitaImport } from "./bridge-import/run-tanita-import";
import { useDiscoveredBridges } from "./use-discovered-bridges";

export const useTanitaImport = (profileId: string | null): void => {
  const persistence = usePersistence();
  const discovered = useDiscoveredBridges();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profileId || firedRef.current === profileId) return;
    if (!discovered.some((d) => d.bridgeId === TANITA_BRIDGE_ID)) return;
    const extensionId = bridgeDiscovery.getExtensionId(TANITA_BRIDGE_ID);
    if (!extensionId) return;
    firedRef.current = profileId;
    void runTanitaImport(persistence, extensionId, profileId).catch(
      () => undefined
    );
  }, [profileId, discovered, persistence]);
};
