import {
  readWhoopFetch,
  readWhoopStatus,
} from "../../adapters/bridge/whoop-transport";
import { syncWhoopActivities } from "../../application/whoop/sync-whoop-activities.use-case";
import { syncWhoopCycles } from "../../application/whoop/sync-whoop-cycles.use-case";
import { syncWhoopHeartRate } from "../../application/whoop/sync-whoop-heart-rate.use-case";
import { syncWhoopStress } from "../../application/whoop/sync-whoop-stress.use-case";
import type { PersistencePort } from "../../ports/persistence-port";

const CYCLES_WINDOW_DAYS = 30;
const HR_WINDOW_DAYS = 7;
// stress-bff is ~1.7MB/day (UI-shaped BFF), so the window stays short like HR.
const STRESS_WINDOW_DAYS = 7;
const DAY_MS = 86_400_000;
const SPORTS_HISTORY_PATH =
  "/activities-service/v1/sports/history?countryCode=US";

const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * DAY_MS).toISOString();

export const runWhoopImport = async (
  persistence: PersistencePort,
  extensionId: string,
  profileId: string
): Promise<void> => {
  const status = await readWhoopStatus(extensionId);
  if (!status.connected || status.userId == null) return;

  const endTime = new Date().toISOString();
  const startTime = isoDaysAgo(CYCLES_WINDOW_DAYS);
  const hrStartTime = isoDaysAgo(HR_WINDOW_DAYS);
  const stressStartTime = isoDaysAgo(STRESS_WINDOW_DAYS);
  const fetch = (path: string) => readWhoopFetch(extensionId, path);
  const importDeps = {
    policyRepo: persistence.integrationPolicy,
    importedRecords: persistence.importedRecords,
  };

  await syncWhoopCycles(
    { ...importDeps, fetchCycles: fetch },
    { profileId, userId: status.userId, startTime, endTime }
  );
  await syncWhoopHeartRate(
    { ...importDeps, fetchMetrics: fetch },
    { profileId, userId: status.userId, startTime: hrStartTime, endTime }
  );
  await syncWhoopActivities(
    {
      policyRepo: persistence.integrationPolicy,
      activities: persistence.activities,
      coachingSyncState: persistence.coachingSyncState,
      fetchCycles: fetch,
      fetchSports: () => readWhoopFetch(extensionId, SPORTS_HISTORY_PATH),
    },
    { profileId, userId: status.userId, startTime, endTime }
  );
  await syncWhoopStress(
    { ...importDeps, fetchStress: fetch },
    { profileId, userId: status.userId, startTime: stressStartTime, endTime }
  );
};
