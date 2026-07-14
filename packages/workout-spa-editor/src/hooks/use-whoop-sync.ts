/**
 * useWhoopSync — live, once-per-mount governed pull of WHOOP cycles (HRV,
 * sleep, strain, vitals) and heart-rate series into their persisted stores.
 *
 * Mirrors useGarminActivitiesPull: gates on a discovered whoop-bridge with an
 * active captured session (status.connected + userId present), then defers
 * all governance (route-inactive → no fetch) to the pure
 * `syncWhoopCycles`/`syncWhoopHeartRate` use cases. Errors are swallowed so a
 * failed pull never breaks the calendar mount. The `firedRef` guard keeps it
 * single-shot per profile so re-renders never re-fire the network call.
 */
import { useEffect, useRef } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import {
  readWhoopFetch,
  readWhoopStatus,
} from "../adapters/bridge/whoop-transport";
import { syncWhoopCycles } from "../application/whoop/sync-whoop-cycles.use-case";
import { syncWhoopHeartRate } from "../application/whoop/sync-whoop-heart-rate.use-case";
import { usePersistence } from "../contexts/persistence-context";
import type { PersistencePort } from "../ports/persistence-port";
import { useDiscoveredBridges } from "./use-discovered-bridges";

const WHOOP_BRIDGE_ID = "whoop-bridge";
const CYCLES_WINDOW_DAYS = 30;
const HR_WINDOW_DAYS = 7;
const DAY_MS = 86_400_000;

const runWhoopSync = async (
  persistence: PersistencePort,
  extensionId: string,
  profileId: string
): Promise<void> => {
  const status = await readWhoopStatus(extensionId);
  if (!status.connected || status.userId == null) return;

  const endTime = new Date().toISOString();
  const startTime = new Date(
    Date.now() - CYCLES_WINDOW_DAYS * DAY_MS
  ).toISOString();
  const hrStartTime = new Date(
    Date.now() - HR_WINDOW_DAYS * DAY_MS
  ).toISOString();
  const fetch = (path: string) => readWhoopFetch(extensionId, path);

  await syncWhoopCycles(
    {
      policyRepo: persistence.integrationPolicy,
      importedRecords: persistence.importedRecords,
      fetchCycles: fetch,
    },
    { profileId, userId: status.userId, startTime, endTime }
  );
  await syncWhoopHeartRate(
    {
      policyRepo: persistence.integrationPolicy,
      importedRecords: persistence.importedRecords,
      fetchMetrics: fetch,
    },
    { profileId, userId: status.userId, startTime: hrStartTime, endTime }
  );
};

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
    void runWhoopSync(persistence, extensionId, profileId).catch(
      () => undefined
    );
  }, [profileId, discovered, persistence]);
};
