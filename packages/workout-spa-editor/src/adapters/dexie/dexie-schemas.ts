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
// v13 — workouts gain `profileId` so each workout is profile-scoped 1–1.
// Adds `profileId` and `[profileId+date]` indexes so the calendar's
// per-profile + date-range query hits an index, and the cascade auto-
// discovery (`isPerProfileTable`) picks the table up at delete time.
const CORE_V13 = {
  ...CORE_V8,
  workouts:
    "id, profileId, [profileId+date], date, [date+state], [source+sourceId], sport, *tags",
};

// v16 — six health-domain stores added (KRD v2.0). Each store keys on
// the KRD record `id` (nanoid) and indexes `[profileId+date]` so the
// per-profile date-range queries that back `useHealth*Live` hooks hit
// an index. Schema is purely additive; no rewrites of existing tables.
// v14 (calendar preference rename, PR #646) and v15 (userPreferences
// scratch + AI banner state, PR #654) both reused SCHEMAS.v13 — this
// is the first new schema entry since v13.
const CORE_V16 = {
  ...CORE_V13,
  healthSleep: "id, profileId, [profileId+date], date",
  healthWeight: "id, profileId, [profileId+date], date",
  healthHrv: "id, profileId, [profileId+date], date",
  healthDaily: "id, profileId, [profileId+date], date",
  healthBodyComposition: "id, profileId, [profileId+date], date",
  healthStress: "id, profileId, [profileId+date], date",
};

const HEALTH_SUFFIX =
  ", sourceBridgeId, externalId, [profileId+sourceBridgeId+externalId]";

// v17 — integrationPolicies + exportLedger stores; health stores gain
// provenance fields (sourceBridgeId, externalId) and a unique compound
// index [profileId+sourceBridgeId+externalId] for dedup on ingest.
const CORE_V17 = {
  ...CORE_V16,
  integrationPolicies:
    "id, [profileId+dataType+direction], &[profileId+dataType+direction+bridgeId], profileId",
  exportLedger:
    "id, &[kaiordRecordId+destinationBridgeId], kaiordRecordId, destinationBridgeId",
  healthSleep: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthWeight: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthHrv: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthDaily: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthBodyComposition: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthStress: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
};

// v18 — add dataType index to exportLedger for countByDataType analytics gauge.
const CORE_V18 = {
  ...CORE_V17,
  exportLedger:
    "id, &[kaiordRecordId+destinationBridgeId], kaiordRecordId, destinationBridgeId, dataType",
};

export const SCHEMAS = {
  v1: CORE_V1,
  v2: CORE_V2,
  v4: CORE_V4,
  v5: CORE_V5,
  v8: CORE_V8,
  v13: CORE_V13,
  v16: CORE_V16,
  v17: CORE_V17,
  v18: CORE_V18,
} as const;

/** Backfills `linkedAccounts: []` on profile rows missing the field. */
export const backfillLinkedAccounts = (row: Record<string, unknown>): void => {
  if (!Array.isArray(row.linkedAccounts)) row.linkedAccounts = [];
};
