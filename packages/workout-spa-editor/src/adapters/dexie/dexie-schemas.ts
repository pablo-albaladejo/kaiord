/**
 * Dexie Schema Definitions
 *
 * Per-version `stores()` configs for the Kaiord IndexedDB schema.
 * Co-located with `dexie-database.ts` but split out so the database
 * class stays under the per-file line cap. Early versions (v1–v13) live
 * in `dexie-schemas-early.ts`; this file adds v16+ and assembles `SCHEMAS`.
 */

import {
  CORE_V1,
  CORE_V2,
  CORE_V4,
  CORE_V5,
  CORE_V8,
  CORE_V13,
} from "./dexie-schemas-early";

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

// v19 — additive `tombstones` table for cross-device delete propagation
// (google-drive-cross-device-sync, Phase 1). PK is the composite
// `[table+id]`; the `table` index supports per-table pruning and the
// `deletedAt` index supports the retention-window prune. No data
// transform — every existing table is carried over unchanged.
//
// `profileId` is a stored field (optional) but deliberately NOT indexed:
// indexing it would make `isPerProfileTable` classify tombstones as a
// per-profile cascade target, and tombstones MUST survive a profile
// delete so the deletion still propagates across devices.
const CORE_V19 = { ...CORE_V18, tombstones: "[table+id], table, deletedAt" };

// v20 — additive `coachingDayNotes` table for Train2Go day-scoped comment
// threads. PK is the composite `id` (`${profileId}:${source}:${date}`),
// matching `coachingActivities`; `getByDate` reads it directly. The
// `[profileId+date]` index drives the profile-delete cascade range scan
// (and makes `isPerProfileTable` auto-discover the table). Dexie
// auto-creates the store empty on upgrade — no data migration.
const CORE_V20 = { ...CORE_V19, coachingDayNotes: "id, [profileId+date]" };

// v21 — additive `chatMessages` store for the in-SPA AI chat transcript.
// Append-only rows keyed on `id` (nanoid); `[profileId+createdAt]` serves the
// per-profile chronological read and makes the table a cascade target.
// ISO-8601 `createdAt` lets the snapshot merge clock apply (no `updatedAt`).
const CORE_V21 = {
  ...CORE_V20,
  chatMessages: "id, profileId, [profileId+createdAt]",
};

// v22 — additive `aiModelBindings` store for per-profile model bindings.
// Composite PK `[profileId+purpose]` keeps one row per purpose per profile;
// the `profileId` index drives the cascade and makes the table a cascade
// target (also auto-discovered by `isPerProfileTable`).
const CORE_V22 = {
  ...CORE_V21,
  aiModelBindings: "[profileId+purpose], profileId",
};

// v23 — index `updatedAt` on the auto-push synced tables (#725) so the cloud
// change token reads `count` + `max(updatedAt)` per table via an index instead
// of `toArray()`-ing every row. Index-only addition: Dexie rebuilds the
// indexes on upgrade, no data transform and existing tables are untouched.
const CORE_V23 = {
  ...CORE_V22,
  workouts: `${CORE_V13.workouts}, updatedAt`,
  templates: `${CORE_V1.templates}, updatedAt`,
  profiles: `${CORE_V1.profiles}, updatedAt`,
};

// v24 — additive `connections` store for per-(profile, provider) account
// linkage (#714). PK `[profileId+providerId]`; the `profileId` index drives the
// profile-delete cascade and makes `isPerProfileTable` auto-discover it. Dexie
// auto-creates the store empty on upgrade — no data transform. The store is
// deliberately excluded from the cloud snapshot (credentials stay device-local).
const CORE_V24 = {
  ...CORE_V23,
  connections: "[profileId+providerId], profileId",
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
  v19: CORE_V19,
  v20: CORE_V20,
  v21: CORE_V21,
  v22: CORE_V22,
  v23: CORE_V23,
  v24: CORE_V24,
} as const;
