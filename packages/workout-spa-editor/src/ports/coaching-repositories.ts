/**
 * Coaching repository port interfaces.
 *
 * Split from persistence-port.ts to keep file size under the lint limit;
 * re-exported from persistence-port for ergonomics. CoachingRepository
 * intentionally does NOT expose raw table access — `getByProfileAndDateRange`
 * is the only public scan API, making profile isolation a structural
 * property of the port surface.
 *
 * `getById(id)` is intentionally retained: the `id` is the composite
 * `${profileId}:${source}:${sourceId}` constructed by `buildCoachingActivityId`,
 * so the lookup is already profile-scoped at the key level — to read another
 * profile's row, a caller must already know that profile's full composite id
 * (which is itself derived from data the caller would have to obtain through
 * another profile-scoped read). This keeps the API ergonomic for the convert
 * use case without weakening the isolation guarantee.
 */

import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { CoachingSyncStateRecord } from "../types/coaching-sync-state";

export type CoachingRepository = {
  getById: (id: string) => Promise<CoachingActivityRecord | undefined>;
  getByProfileAndDateRange: (
    profileId: string,
    start: string,
    end: string
  ) => Promise<CoachingActivityRecord[]>;
  getByProfileAndSourceId: (
    profileId: string,
    source: string,
    sourceId: string
  ) => Promise<CoachingActivityRecord | undefined>;
  upsertMany: (records: CoachingActivityRecord[]) => Promise<void>;
  put: (record: CoachingActivityRecord) => Promise<void>;
  /** No-op when the row does not exist (concurrent-delete tolerance). */
  delete: (id: string) => Promise<void>;
  deleteByProfile: (profileId: string) => Promise<void>;
};

export type CoachingSyncStateRepository = {
  getBySourceAndProfile: (
    source: string,
    profileId: string
  ) => Promise<CoachingSyncStateRecord | undefined>;
  put: (record: CoachingSyncStateRecord) => Promise<void>;
  deleteByProfile: (profileId: string) => Promise<void>;
};
