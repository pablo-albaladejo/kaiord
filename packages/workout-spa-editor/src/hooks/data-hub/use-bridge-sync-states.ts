/**
 * useBridgeSyncStates — live `lastSyncedAt` per bridge INTEGRATION id.
 *
 * One `useLiveQuery` wrapping the shared `readBridgeSyncStates` reader, so
 * the Data Hub matrix, the chat data-routes tool and the connection model all
 * derive freshness from the same N point-gets.
 */
import { useLiveQuery } from "dexie-react-hooks";

import {
  byIntegrationId,
  readBridgeSyncStates,
} from "../../application/data-hub/read-bridge-sync-states";
import type { PersistencePort } from "../../ports/persistence-port";

type SyncStateMap = ReadonlyMap<string, string | undefined>;

const EMPTY: SyncStateMap = new Map();

export const useBridgeSyncStates = (
  persistence: PersistencePort,
  profileId: string | null
): SyncStateMap => {
  const map = useLiveQuery(
    () =>
      profileId
        ? readBridgeSyncStates(persistence.coachingSyncState, profileId).then(
            byIntegrationId
          )
        : Promise.resolve(EMPTY),
    [persistence, profileId]
  );
  return map ?? EMPTY;
};
