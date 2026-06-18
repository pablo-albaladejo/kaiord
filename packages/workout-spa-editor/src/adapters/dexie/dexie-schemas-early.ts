/**
 * Early Dexie schema versions (v1–v13). Split out of `dexie-schemas.ts` so
 * that file stays under the per-file line cap as the migration history grows;
 * `dexie-schemas.ts` imports these and assembles the public `SCHEMAS` map.
 */

export const CORE_V1 = {
  workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
  templates: "id, sport, *tags",
  profiles: "id",
  aiProviders: "id",
  syncState: "source",
  usage: "yearMonth",
  meta: "key",
};
export const CORE_V2 = { ...CORE_V1, bridges: "extensionId, status, lastSeen" };
export const CORE_V4 = {
  ...CORE_V2,
  coachingActivities:
    "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
  coachingSyncState: "[source+profileId], source, profileId",
};
export const CORE_V5 = {
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
export const CORE_V8 = { ...CORE_V5, aiProviders: "id, createdAt" };
// v13 — workouts gain `profileId` so each workout is profile-scoped 1–1.
// Adds `profileId` and `[profileId+date]` indexes so the calendar's
// per-profile + date-range query hits an index, and the cascade auto-
// discovery (`isPerProfileTable`) picks the table up at delete time.
export const CORE_V13 = {
  ...CORE_V8,
  workouts:
    "id, profileId, [profileId+date], date, [date+state], [source+sourceId], sport, *tags",
};
