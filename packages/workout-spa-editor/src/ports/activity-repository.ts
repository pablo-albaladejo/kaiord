/**
 * ActivityRepository
 *
 * Write port for the v27 `activities` store (executed sessions). Dedup is by
 * the provenance natural key (profileId, sourceBridgeId, externalId) so a
 * re-imported file (same content-hash) is a no-op — the same guarantee
 * `upsertImportedRecord` gives the health stores.
 */
import type { ActivityRecord } from "../types/activity-record";

export type ActivityRepository = {
  /**
   * Insert an activity unless one already exists for its natural key.
   * Returns `{ created: false }` on a dedup hit (no second write).
   */
  upsertByExternalId: (record: ActivityRecord) => Promise<{ created: boolean }>;
  /**
   * All executed activities for a profile within an inclusive date range —
   * backs the calendar's native activity render (`[profileId+date]` index).
   */
  getByProfileAndDateRange: (
    profileId: string,
    start: string,
    end: string
  ) => Promise<ActivityRecord[]>;
};
