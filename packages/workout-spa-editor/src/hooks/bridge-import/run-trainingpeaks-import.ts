import {
  checkTrainingPeaksSession,
  readTrainingPeaksMetrics,
} from "../../adapters/trainingpeaks/trainingpeaks-transport";
import { syncTrainingPeaksWeight } from "../../application/trainingpeaks/sync-trainingpeaks-weight.use-case";
import type { PersistencePort } from "../../ports/persistence-port";

const WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

/** The bridge interpolates start/end as `/consolidatedtimedmetrics/{start}/{end}`
    path segments, so these are date-only (`YYYY-MM-DD`), not full instants. */
const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);

export const runTrainingPeaksImport = async (
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
      coachingSyncState: persistence.coachingSyncState,
    },
    { profileId, start: isoDaysAgo(WINDOW_DAYS), end: isoDaysAgo(0) }
  );
};
