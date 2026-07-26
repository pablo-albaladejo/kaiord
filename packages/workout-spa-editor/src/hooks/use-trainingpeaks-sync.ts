/**
 * useTrainingPeaksSync — live, once-per-mount governed pull of TrainingPeaks
 * weight readings into the weight store.
 *
 * Mirrors useWhoopSync: gates on a discovered trainingpeaks-bridge, then
 * defers ALL governance to the pure `syncTrainingPeaksWeight` use case —
 * including the session probe, which is injected rather than called here
 * because it is a live token exchange that must not run ahead of the policy
 * gate. Errors are swallowed so a failed pull never breaks the calendar
 * mount. The `firedRef` guard keeps it single-shot per profile.
 */
import { useEffect, useRef } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import {
  checkTrainingPeaksSession,
  readTrainingPeaksMetrics,
} from "../adapters/trainingpeaks/trainingpeaks-transport";
import { syncTrainingPeaksWeight } from "../application/trainingpeaks/sync-trainingpeaks-weight.use-case";
import { usePersistence } from "../contexts/persistence-context";
import type { PersistencePort } from "../ports/persistence-port";
import { useDiscoveredBridges } from "./use-discovered-bridges";

const TP_BRIDGE_ID = "trainingpeaks-bridge";
const WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

/** The bridge interpolates start/end as `/consolidatedtimedmetrics/{start}/{end}`
    path segments, so these are date-only (`YYYY-MM-DD`), not full instants. */
const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);

const runTrainingPeaksSync = async (
  persistence: PersistencePort,
  extensionId: string,
  profileId: string
): Promise<void> => {
  const { trainingPeaksMetricsToKrd } = await import("@kaiord/trainingpeaks");
  await syncTrainingPeaksWeight(
    {
      policyRepo: persistence.integrationPolicy,
      importedRecords: persistence.importedRecords,
      checkSession: async () =>
        (await checkTrainingPeaksSession(extensionId)).authenticated,
      readMetrics: (start, end) =>
        readTrainingPeaksMetrics(extensionId, start, end),
      parse: trainingPeaksMetricsToKrd,
    },
    {
      profileId,
      start: isoDaysAgo(WINDOW_DAYS),
      end: isoDaysAgo(0),
    }
  );
};

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
    void runTrainingPeaksSync(persistence, extensionId, profileId).catch(
      () => undefined
    );
  }, [profileId, discovered, persistence]);
};
