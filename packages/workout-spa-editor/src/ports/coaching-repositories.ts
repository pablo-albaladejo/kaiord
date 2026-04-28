/**
 * Coaching repository port interfaces.
 *
 * Split from persistence-port.ts to keep file size under the lint limit;
 * re-exported from persistence-port for ergonomics. CoachingRepository
 * intentionally does NOT expose raw table access — `getByProfileAndDateRange`
 * is the only public read API, making profile isolation a structural
 * property of the port surface.
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
