/**
 * Dexie Coaching Sync State Repository
 *
 * IndexedDB-backed implementation of CoachingSyncStateRepository.
 * Distinct from the bridge-discovery `syncState` table.
 */

import type { CoachingSyncStateRepository } from "../../ports/persistence-port";
import type { CoachingSyncStateRecord } from "../../types/coaching-sync-state";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieCoachingSyncStateRepository(
  db: KaiordDatabase
): CoachingSyncStateRepository {
  const table = () => db.table<CoachingSyncStateRecord>("coachingSyncState");

  return {
    getBySourceAndProfile: async (source, profileId) => {
      const result = await table()
        .where("[source+profileId]")
        .equals([source, profileId])
        .first();
      return result ?? undefined;
    },

    put: async (record) => {
      await table().put(record);
    },

    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
}
