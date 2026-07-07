/**
 * Dexie Schema Definitions
 *
 * Per-version `stores()` configs for the Kaiord IndexedDB schema.
 * Co-located with `dexie-database.ts` but split out so the database
 * class stays under the per-file line cap. Early versions (v1–v16) live
 * in `dexie-schemas-early.ts`; this file adds v17+ and assembles `SCHEMAS`.
 */

import {
  CORE_V1,
  CORE_V2,
  CORE_V4,
  CORE_V5,
  CORE_V8,
  CORE_V13,
  CORE_V16,
} from "./dexie-schemas-early";
import {
  buildCoreV22,
  buildCoreV24,
  buildCoreV26,
  buildCoreV27,
  buildCoreV30,
} from "./dexie-schemas-late";

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

// v22 — additive `aiModelBindings` store for per-profile model bindings;
// built in `dexie-schemas-late.ts`.
const CORE_V22 = buildCoreV22(CORE_V21);

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

// v24 (connections) and v26 (energy-balance stores) live in
// `dexie-schemas-late.ts` so this file stays under the per-file line cap.
const CORE_V24 = buildCoreV24(CORE_V23);

// v25 — multi-conversation chat. Adds the mutable `chatConversations` store
// (`[profileId+updatedAt]` orders the list and resolves rename LWW) and a
// `conversationId` FK + `[profileId+conversationId+createdAt]` index on
// `chatMessages`. Data migration: `applyV25Upgrade` (see dexie-v25-migration).
const CORE_V25 = {
  ...CORE_V24,
  chatConversations: "id, profileId, [profileId+updatedAt]",
  chatMessages:
    "id, profileId, conversationId, [profileId+createdAt], [profileId+conversationId+createdAt]",
};

// v26 — additive device-local energy-balance stores (`intakeEntries`,
// `intakePresets`, `energyTargets`); built in `dexie-schemas-late.ts`.
const CORE_V26 = buildCoreV26(CORE_V25);

// v27 — Data Hub domain tables (`plannedSessions`, `activities`); built in
// `dexie-schemas-late.ts`. The v27 upgrade migrates coachingActivities into
// plannedSessions and rewrites integrationPolicies.dataType.
const CORE_V27 = buildCoreV27(CORE_V26);

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
  v25: CORE_V25,
  v26: CORE_V26,
  v27: CORE_V27,
  // v30 — additive dataTypeSourcePolicy companion table; built in
  // dexie-schemas-late.ts. v28/v29 (data-only) reused SCHEMAS.v27.
  v30: buildCoreV30(CORE_V27),
} as const;
