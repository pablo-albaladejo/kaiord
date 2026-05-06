/**
 * Dexie Schema Definitions
 *
 * Per-version `stores()` configs for the Kaiord IndexedDB schema.
 * Co-located with `dexie-database.ts` but split out so the database
 * class stays under the per-file line cap.
 */

const CORE_V1 = {
  workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
  templates: "id, sport, *tags",
  profiles: "id",
  aiProviders: "id",
  syncState: "source",
  usage: "yearMonth",
  meta: "key",
};
const CORE_V2 = { ...CORE_V1, bridges: "extensionId, status, lastSeen" };
const CORE_V4 = {
  ...CORE_V2,
  coachingActivities:
    "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
  coachingSyncState: "[source+profileId], source, profileId",
};
const CORE_V5 = {
  ...CORE_V4,
  // PK is `id` (nanoid). Indexes support all spec-mandated queries:
  //   - [profileId+coachingActivityId] / [profileId+workoutId]: uniqueness
  //   - [profileId+date]: weekly listByProfileAndWeek
  //   - coachingActivityId / workoutId: cascade hooks
  //   - profileId: profile-delete cascade
  sessionMatches:
    "id, [profileId+coachingActivityId], [profileId+workoutId], [profileId+date], coachingActivityId, workoutId, profileId",
  // PK is `profileId` (one row per profile, lazy creation).
  userPreferences: "profileId",
  // PK is composite `[profileId+weekStart]`; index on profileId for cascade.
  autoMatchDismissals: "[profileId+weekStart], profileId",
};
// v8 — AI provider insertion-order index. `createdAt` becomes a Dexie
// index so the repository's getAll can `orderBy("createdAt")` cheaply.
const CORE_V8 = { ...CORE_V5, aiProviders: "id, createdAt" };

export const SCHEMAS = {
  v1: CORE_V1,
  v2: CORE_V2,
  v4: CORE_V4,
  v5: CORE_V5,
  v8: CORE_V8,
} as const;

/** Backfills `linkedAccounts: []` on profile rows missing the field. */
export const backfillLinkedAccounts = (row: Record<string, unknown>): void => {
  if (!Array.isArray(row.linkedAccounts)) row.linkedAccounts = [];
};
