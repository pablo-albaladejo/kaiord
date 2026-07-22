/**
 * useTanitaGarminSync — binds the pure `syncTanitaBodyComposition` use case to
 * live bridge-discovery signals and the two bridge transports for a MANUAL
 * "Sync Tanita → Garmin" button. Gates on both bridges being discovered; on
 * `sync()` it wires `readCsv`/`push` to the transports and dynamically imports
 * `@kaiord/tanita` (parser) + `@kaiord/fit` (encoder) so neither lands in the
 * main chunk (matching `export-workout-formats.ts`). The exposed `status`
 * reflects the `idle | reading | parsing | encoding | uploading | done |
 * needsReauth | error` state machine.
 */
import { useCallback, useState } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { pushGarminBodyComposition } from "../adapters/garmin/garmin-body-composition-transport";
import { readTanitaExportCsv } from "../adapters/tanita/tanita-transport";
import type { SyncTanitaPhase } from "../application/health/sync-tanita-body-composition.use-case";
import { syncTanitaBodyComposition } from "../application/health/sync-tanita-body-composition.use-case";
import { usePersistence } from "../contexts/persistence-context";
import { ledgerRepo } from "./garmin-push-fn";
import { useDiscoveredBridges } from "./use-discovered-bridges";

const TANITA_BRIDGE_ID = "tanita-bridge";
const GARMIN_BRIDGE_ID = "garmin-bridge";

export type TanitaGarminSyncStatus =
  | "idle"
  | "reading"
  | "parsing"
  | "encoding"
  | "uploading"
  | "done"
  | "needsReauth"
  | "error";

export type UseTanitaGarminSync = {
  status: TanitaGarminSyncStatus;
  lastError: string | null;
  /** Both bridges discovered and an active profile — the button is enabled. */
  canSync: boolean;
  sync: () => Promise<void>;
};

export const useTanitaGarminSync = (
  profileId: string | null
): UseTanitaGarminSync => {
  const persistence = usePersistence();
  const discovered = useDiscoveredBridges();
  const [status, setStatus] = useState<TanitaGarminSyncStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  const tanitaReady = discovered.some((d) => d.bridgeId === TANITA_BRIDGE_ID);
  const garminReady = discovered.some((d) => d.bridgeId === GARMIN_BRIDGE_ID);
  const canSync = tanitaReady && garminReady && profileId !== null;

  const sync = useCallback(async () => {
    if (!profileId) return;
    const tanitaExtId = bridgeDiscovery.getExtensionId(TANITA_BRIDGE_ID);
    const garminExtId = bridgeDiscovery.getExtensionId(GARMIN_BRIDGE_ID);
    if (!tanitaExtId || !garminExtId) return;

    setLastError(null);
    setStatus("reading");
    try {
      const [{ tanitaCsvToKrd }, { encodeBodyCompositionFit }] =
        await Promise.all([import("@kaiord/tanita"), import("@kaiord/fit")]);
      const result = await syncTanitaBodyComposition(
        {
          policyRepo: persistence.integrationPolicy,
          ledgerRepo,
          readCsv: () => readTanitaExportCsv(tanitaExtId),
          parse: tanitaCsvToKrd,
          encode: (krd) => encodeBodyCompositionFit(krd),
          push: (fit) => pushGarminBodyComposition(garminExtId, fit),
          // Phase names are a subset of the status union — surface them directly.
          onPhase: (phase: SyncTanitaPhase) => setStatus(phase),
        },
        { profileId }
      );
      if (result.ok) {
        setStatus("done");
        return;
      }
      if (result.reason === "needs-reauth") {
        setStatus("needsReauth");
        return;
      }
      setStatus("error");
      setLastError(result.error ?? "Sync failed");
    } catch (err) {
      setStatus("error");
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, [persistence, profileId]);

  return { status, lastError, canSync, sync };
};
