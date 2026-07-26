/**
 * useTanitaImport — live, once-per-mount governed pull of MyTANITA export-CSV
 * readings into the weight + body-composition stores.
 *
 * Mirrors useWhoopSync: gates on a discovered tanita-bridge, then defers all
 * governance (route-inactive → no read) to the pure `syncTanitaImport` use
 * case. Distinct from `useTanitaGarminSync`, which is the MANUAL outbound
 * Tanita → Garmin push. Errors are swallowed so a failed pull never breaks the
 * calendar mount. The `firedRef` guard keeps it single-shot per profile.
 */
import { useEffect, useRef } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { readTanitaExportCsv } from "../adapters/tanita/tanita-transport";
import { syncTanitaImport } from "../application/tanita/sync-tanita-import.use-case";
import { TANITA_BRIDGE_ID } from "../application/tanita/tanita-import-records";
import { usePersistence } from "../contexts/persistence-context";
import type { PersistencePort } from "../ports/persistence-port";
import { useDiscoveredBridges } from "./use-discovered-bridges";

const runTanitaImport = async (
  persistence: PersistencePort,
  extensionId: string,
  profileId: string
): Promise<void> => {
  const { tanitaCsvToKrd } = await import("@kaiord/tanita");
  await syncTanitaImport(
    {
      policyRepo: persistence.integrationPolicy,
      importedRecords: persistence.importedRecords,
      readCsv: () => readTanitaExportCsv(extensionId),
      parse: tanitaCsvToKrd,
      coachingSyncState: persistence.coachingSyncState,
    },
    { profileId }
  );
};

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
