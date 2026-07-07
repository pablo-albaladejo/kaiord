/**
 * useSourceSyncState — live `lastSyncedAt` for a (source, profile)
 * `coachingSyncState` row. Backs the Data Hub matrix freshness for any
 * import source that records a sync timestamp (train2go planned sessions,
 * garmin-bridge activities) without a per-source bespoke hook.
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { PersistencePort } from "../../ports/persistence-port";

export const useSourceSyncState = (
  persistence: PersistencePort,
  source: string,
  profileId: string | null
): string | undefined => {
  const row = useLiveQuery(() => {
    if (!profileId) return Promise.resolve(undefined);
    return persistence.coachingSyncState.getBySourceAndProfile(
      source,
      profileId
    );
  }, [source, profileId]);
  return row?.lastSyncedAt;
};
