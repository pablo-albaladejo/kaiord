/**
 * Persistence tail of `syncWeek`. Stamps provenance on every fetched row,
 * upserts, deletes coach-removed orphans within the window, and bumps the
 * staleness gate unconditionally. Returns the number of orphans deleted.
 */
import type {
  CoachingRepository,
  CoachingSyncStateRepository,
} from "../../ports/persistence-port";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { stampProvenance } from "../import/stamp-provenance";

export type PersistSyncedWeekDeps = {
  coaching: CoachingRepository;
  coachingSyncState: CoachingSyncStateRepository;
  now?: () => string;
};

export type PersistSyncedWeekInput = {
  profileId: string;
  source: string;
  fetched: CoachingActivityRecord[];
  localSameSource: CoachingActivityRecord[];
};

export const persistSyncedWeek = async (
  deps: PersistSyncedWeekDeps,
  input: PersistSyncedWeekInput
): Promise<number> => {
  const bridgeId = `${input.source}-bridge`;
  const stamped = input.fetched.map((r) => ({
    ...r,
    ...stampProvenance(bridgeId, r.sourceId),
  }));
  await deps.coaching.upsertMany(stamped);

  const fetchedIds = new Set(stamped.map((r) => r.id));
  const orphans = input.localSameSource.filter((r) => !fetchedIds.has(r.id));
  for (const orphan of orphans) await deps.coaching.delete(orphan.id);

  const now = deps.now ?? (() => new Date().toISOString());
  await deps.coachingSyncState.put({
    source: input.source,
    profileId: input.profileId,
    lastSyncedAt: now(),
  });
  return orphans.length;
};
