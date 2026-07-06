/**
 * Dexie implementation of ActivityRepository.
 *
 * Uses the v27 `activities` store with the `[profileId+sourceBridgeId+externalId]`
 * index for natural-key dedup on ingest.
 */
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
});
