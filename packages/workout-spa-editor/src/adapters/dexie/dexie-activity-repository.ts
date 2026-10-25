/**
 * Dexie implementation of ActivityRepository.
 *
 * Uses the v27 `activities` store with the `[profileId+sourceBridgeId+externalId]`
 * index for natural-key dedup on ingest.
 */
import Dexie from "dexie";

import type { ActivityRepository } from "../../ports/activity-repository";
import type { ActivityRecord } from "../../types/activity-record";
import type { KaiordDatabase } from "./dexie-database";

export const createDexieActivityRepository = (
  db: KaiordDatabase
): ActivityRepository => ({
  upsertByExternalId: async (record: ActivityRecord) => {
    const table = db.table<ActivityRecord>("activities");
    const existing = await table
      .where("[profileId+sourceBridgeId+externalId]")
      .equals([record.profileId, record.sourceBridgeId, record.externalId])
      .first();
    if (existing) return { created: false };
    await table.add(record);
    return { created: true };
  },

  getByProfileAndDateRange: async (profileId, start, end) =>
    db
      .table<ActivityRecord>("activities")
      .where("[profileId+date]")
      .between([profileId, start], [profileId, end], true, true)
      .toArray(),

  referencesWorkout: async (profileId, workoutId) => {
    const table = db.table<ActivityRecord>("activities");
    const self = await table.get(workoutId);
    if (self?.profileId === profileId) return true;
    const linked = await table
      .where("[profileId+date]")
      .between([profileId, Dexie.minKey], [profileId, Dexie.maxKey])
      .filter((a) => a.linkedWorkoutId === workoutId)
      .first();
    return linked !== undefined;
  },
});
