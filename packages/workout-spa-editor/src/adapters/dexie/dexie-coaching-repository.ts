/**
 * Dexie Coaching Repository
 *
 * IndexedDB-backed implementation of CoachingRepository.
 * Reads MUST go through `getByProfileAndDateRange` / `getByProfileAndSourceId`
 * — raw table access is intentionally NOT exposed, so profile isolation is
 * enforced structurally at the port surface.
 */

import type { CoachingRepository } from "../../ports/persistence-port";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieCoachingRepository(
  db: KaiordDatabase
): CoachingRepository {
  const table = () => db.table<CoachingActivityRecord>("coachingActivities");

  return {
    getById: async (id) => {
      const result = await table().get(id);
      return result ?? undefined;
    },

    getByProfileAndDateRange: async (profileId, start, end) =>
      table()
        .where("[profileId+date]")
        .between([profileId, start], [profileId, end], true, true)
        .toArray(),

    getByProfileAndSourceId: async (profileId, source, sourceId) => {
      const result = await table()
        .where("[profileId+source+sourceId]")
        .equals([profileId, source, sourceId])
        .first();
      return result ?? undefined;
    },

    upsertMany: async (records) => {
      if (records.length === 0) return;
      await table().bulkPut(records);
    },

    put: async (record) => {
      await table().put(record);
    },

    // Dexie's `.delete(key)` is already a no-op for missing keys.
    delete: async (id) => {
      await table().delete(id);
    },

    deleteByProfile: async (profileId) => {
      await table()
        .where("[profileId+date]")
        .between(
          [profileId, "0000-00-00"],
          [profileId, "9999-99-99"],
          true,
          true
        )
        .delete();
    },
  };
}
