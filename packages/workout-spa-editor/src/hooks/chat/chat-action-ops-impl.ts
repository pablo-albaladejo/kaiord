/**
 * Implementations for the chat action ops, as plain functions so the
 * `useChatActionOps` hook stays thin and these are unit-testable. Each wraps
 * an existing use case; none touches React.
 */
import type { LogHealthMetricInput } from "../../application/chat/tools/chat-tool-deps";
import { toManualHealthInput } from "../../application/chat/tools/log-health-metric-input";
import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import type { SyncWeekResult } from "../../application/coaching/sync-week";
import { syncWeek } from "../../application/coaching/sync-week";
import { saveManualHealthMetric } from "../../application/health/save-manual-health-metric.use-case";
import type { PersistencePort } from "../../ports/persistence-port";
import { todayIsoDate } from "../../utils/today-iso-date";
import { getCurrentWeekId, parseWeekId } from "../../utils/week-utils";

/**
 * `SyncWeekResult.error` carries the upstream exception text verbatim — the
 * coaching bridge's own string. The use case keeps it for the UI and the log,
 * but an action-tool result crosses into prompt space, so it is dropped here:
 * `reason` already carries every signal the model can act on.
 */
const toModelSafeSync = (result: SyncWeekResult): unknown =>
  result.ok ? result : { ok: false, reason: result.reason };

export const doSyncCoaching = async (
  persistence: PersistencePort,
  transport: CoachingTransport,
  profileId: string
): Promise<unknown> => {
  const weekStart = parseWeekId(getCurrentWeekId())?.start ?? todayIsoDate();
  const result = await syncWeek(
    {
      profiles: persistence.profiles,
      coaching: persistence.coaching,
      transport,
      coachingSyncState: persistence.coachingSyncState,
      workouts: persistence.workouts,
      sessionMatch: persistence.sessionMatch,
      transaction: persistence.transaction,
      integrationPolicy: persistence.integrationPolicy,
    },
    profileId,
    weekStart
  );
  return toModelSafeSync(result);
};

export const doLogHealthMetric = async (
  persistence: PersistencePort,
  profileId: string,
  input: LogHealthMetricInput
): Promise<unknown> => {
  const result = await saveManualHealthMetric(
    { persistence, profileId },
    toManualHealthInput(input)
  );
  return result ?? { error: "invalid_value" };
};
