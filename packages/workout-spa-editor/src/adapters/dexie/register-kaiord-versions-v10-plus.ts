/**
 * Kaiord Dexie Version Registration — v10 onwards.
 *
 * Extracted from `register-kaiord-versions.ts` so each registration file
 * stays under the per-file line cap as the migration history grows.
 */

import type Dexie from "dexie";

import { SCHEMAS } from "./dexie-schemas";
import { applyV10Upgrade } from "./dexie-v10-migration";
import { applyV11Upgrade } from "./dexie-v11-migration";
import { applyV12Upgrade } from "./dexie-v12-migration";
import { applyV13Upgrade } from "./dexie-v13-migration";
import { applyV14Upgrade } from "./dexie-v14-migration";
import { applyV15Upgrade } from "./dexie-v15-migration";
import { applyV17Upgrade } from "./dexie-v17-migration";
import { applyV22Upgrade } from "./dexie-v22-migration";
import { applyV25Upgrade } from "./dexie-v25-migration";
import { applyV27Upgrade } from "./dexie-v27-migration";
import { applyV28Upgrade } from "./dexie-v28-migration";
import { applyV29Upgrade } from "./dexie-v29-migration";
import { applyV33Upgrade } from "./dexie-v33-migration";
import { applyV36Upgrade } from "./dexie-v36-migration";
import { applyV37Upgrade, V37_STORES } from "./dexie-v37-migration";

type DexieVersionHost = Pick<Dexie, "version">;

export const registerV10ToV12 = (db: DexieVersionHost): void => {
  // v10 — coaching auto-match retro-fix (per coaching-activity-dialog-
  // redesign / D8). Schema unchanged from v8; data-side upgrade only.
  db.version(10).stores(SCHEMAS.v8).upgrade(applyV10Upgrade);
  // v11 — SessionMatch.source rename: legacy "auto-conversion" rows
  // become canonical "auto-coaching". Schema unchanged from v8.
  db.version(11).stores(SCHEMAS.v8).upgrade(applyV11Upgrade);
  // v12 — SessionMatch.executedWorkoutIds backfill (Train2Go three-slot
  // grouping). Schema unchanged from v8; every existing row gets `[]`.
  db.version(12).stores(SCHEMAS.v8).upgrade(applyV12Upgrade);
};

export const registerV13ToV15 = (db: DexieVersionHost): void => {
  // v13 — workouts become profile-scoped 1–1. Adds `profileId` +
  // `[profileId+date]` indexes on `workouts` and backfills every legacy
  // row from `meta.activeProfileId`. The upgrade throws when workouts
  // exist but no active profile is set — degenerate state.
  db.version(13).stores(SCHEMAS.v13).upgrade(applyV13Upgrade);
  // v14 — calendar preference rename. Walks `userPreferences` rows,
  // writes `calendarView = "grid"` unconditionally (both legacy
  // `compact` and `comfortable` collapse to `grid`) and removes the
  // legacy `calendarDensity` field. Schema unchanged from v13.
  db.version(14).stores(SCHEMAS.v13).upgrade(applyV14Upgrade);
  // v15 — userPreferences scratch-sport + AI banner state. Adds two
  // optional fields (`lastScratchSport`, `aiBannerExpanded`) so the
  // editor can pre-populate the scratch sport picker and persist the
  // AI banner accordion state across sessions. Schema unchanged.
  db.version(15).stores(SCHEMAS.v13).upgrade(applyV15Upgrade);
};
// v16 — KRD v2.0 health-domain stores. Schema only: pruned, restated by
// v17's SCHEMAS.v17.

export const registerV17 = (db: DexieVersionHost): void => {
  // v17 — integrationPolicies + exportLedger stores; health stores gain
  // sourceBridgeId + externalId columns and unique compound index
  // [profileId+sourceBridgeId+externalId]. Backfills provenance on
  // legacy health rows and converts syncZones=true linkedAccounts into
  // IntegrationPolicy rows. syncZones column retained as rollback
  // buffer until v18 (F-4).
  db.version(17).stores(SCHEMAS.v17).upgrade(applyV17Upgrade);
};

// v18 (exportLedger `dataType` index), v19 (`tombstones`), v20
// (`coachingDayNotes`) and v21 (`chatMessages`) are schema-only: pruned,
// restated by v22's SCHEMAS.v22.

export const registerV22 = (db: DexieVersionHost): void => {
  // v22 — additive `aiModelBindings` store + default-binding backfill from the
  // current default provider so AI features behave identically after the
  // key↔model decoupling.
  db.version(22).stores(SCHEMAS.v22).upgrade(applyV22Upgrade);
};

// v23 (`updatedAt` indexes on workouts/templates/profiles, #725) and v24
// (`connections`, #714) are schema-only: pruned, restated by v25's
// SCHEMAS.v25.

export const registerV25 = (db: DexieVersionHost): void => {
  // v25 — multi-conversation chat: additive `chatConversations` store +
  // `conversationId` on `chatMessages`. The upgrade buckets prior messages
  // into one seeded "Conversation 1" per profile and backfills the FK.
  db.version(25).stores(SCHEMAS.v25).upgrade(applyV25Upgrade);
  // v26 — additive energy-balance stores. Schema only: pruned, restated by
  // v27's SCHEMAS.v27.
};

export const registerV27 = (db: DexieVersionHost): void => {
  // v27 — Data Hub domain tables. Adds `plannedSessions` (migrated from
  // `coachingActivities`, ids preserved) and `activities` (empty), and
  // rewrites `integrationPolicies.dataType` "training-plan" → "planned-session".
  // `coachingActivities` is retained this version for reversibility.
  db.version(27).stores(SCHEMAS.v27).upgrade(applyV27Upgrade);
};

export const registerV28 = (db: DexieVersionHost): void => {
  // v28 — data-only (schema unchanged from v27): backfill provenance
  // `sourceBridgeId:"unknown"` on historical health/activities rows lacking a
  // source, and seed a default enabled planned-session import policy for
  // Train2Go-linked profiles (partial fail-open seeding — see dexie-v28-migration).
  db.version(28).stores(SCHEMAS.v27).upgrade(applyV28Upgrade);
};

export const registerV29 = (db: DexieVersionHost): void => {
  // v29 — data-only: full fail-open policy seeding. Seeds enabled routes for
  // everything live today (planned-session←train2go import, workout→garmin
  // export) so a working profile survives the governance gates.
  // Idempotent superset of v28 — see dexie-v29-migration.
  db.version(29).stores(SCHEMAS.v27).upgrade(applyV29Upgrade);
  // v30 (`dataTypeSourcePolicy`), v31 (`labReports`, `labValues`) and v32
  // (`usageEvents`) are schema-only: pruned, restated by v33's SCHEMAS.v33.
  // v33 — usage-accounting cutover. `applyV33Upgrade` folds each `usage` row's
  // `entries[]` into `usageEvents` (chat events, cost carried), then the v33
  // schema drops the store (`usage: null`). The fold runs before the drop within
  // the same upgrade (Dexie keeps the deleted table readable in the callback).
  db.version(33).stores(SCHEMAS.v33).upgrade(applyV33Upgrade);
  // v34 (`healthStrain`, `healthVitals`) and v35 (`healthHeartRateSeries`)
  // are schema-only: pruned, restated by v36's SCHEMAS.v35.
  // v36 — Garmin calendar placement. Schema unchanged from v35 (the new
  // ledger fields are unindexed); data-side upgrade only: Garmin workout
  // ledger rows gain their explicit `library` state (normalizeGarminLedgerRow).
  db.version(36).stores(SCHEMAS.v35).upgrade(applyV36Upgrade);
  // v37 — nutrition joins the snapshot: `updatedAt` indexes on its stores and
  // a backfill of the intake clock (dexie-v37-migration). V37_STORES is a
  // delta: Dexie carries every other store over from v36, which is kept.
  db.version(37).stores(V37_STORES).upgrade(applyV37Upgrade);
};
