/**
 * Kaiord Dexie Version Registration
 *
 * Wires every schema version + upgrade onto a Dexie instance. Extracted
 * from `KaiordDatabase` so the constructor stays under the per-function
 * line cap. See per-version comments inline for migration intent and
 * forward-only invariants.
 */

import type Dexie from "dexie";

import {
  applyV8Upgrade,
  applyV9Upgrade,
  backfillBridgeSnapshotState,
  backfillUsageRow,
} from "./dexie-migrations";
import { backfillLinkedAccounts, SCHEMAS } from "./dexie-schemas";
import { applyV10Upgrade } from "./dexie-v10-migration";
import { applyV11Upgrade } from "./dexie-v11-migration";
import { applyV12Upgrade } from "./dexie-v12-migration";
import { applyV13Upgrade } from "./dexie-v13-migration";

// Narrowed handle: only `version()` is needed and Dexie's full surface
// causes "Type instantiation is excessively deep" when passed as a
// param across module boundaries. The runtime value is always a
// `KaiordDatabase`/`Dexie` instance.
type DexieVersionHost = Pick<Dexie, "version">;

const registerV1ToV3 = (db: DexieVersionHost): void => {
  db.version(1).stores(SCHEMAS.v1);
  db.version(2).stores(SCHEMAS.v2);
  db.version(3)
    .stores(SCHEMAS.v2)
    .upgrade(async (tx) => {
      await tx.table("usage").toCollection().modify(backfillUsageRow);
    });
};

const registerV4ToV6 = (db: DexieVersionHost): void => {
  // v4 — coaching integration. New tables; existing profiles backfilled
  // with linkedAccounts: [].
  db.version(4)
    .stores(SCHEMAS.v4)
    .upgrade(async (tx) => {
      await tx.table("profiles").toCollection().modify(backfillLinkedAccounts);
    });
  // v5 — session-match + user-preferences + auto-match-dismissals.
  // Forward-only; new tables empty on first load.
  db.version(5).stores(SCHEMAS.v5);
  // v6 — bridge profile-snapshot push: backfills snapshot-pusher state
  // so de-dup and right-to-be-forgotten paths have well-defined data.
  db.version(6)
    .stores(SCHEMAS.v5)
    .upgrade(async (tx) => {
      await tx
        .table("bridges")
        .toCollection()
        .modify(backfillBridgeSnapshotState);
    });
};

const registerV7ToV9 = (db: DexieVersionHost): void => {
  // v7 — autoMatchDismissals reshape (D15 of calendar-coaching-redesign).
  // UX-state cache, not user data: cleared forward-only rather than
  // row-by-row reshaped.
  db.version(7)
    .stores(SCHEMAS.v5)
    .upgrade(async (tx) => {
      await tx.table("autoMatchDismissals").clear();
    });
  // v8 — AI provider insertion-order. Adds `createdAt` index +
  // backfills legacy rows so getAll() orderBy is stable.
  db.version(8).stores(SCHEMAS.v8).upgrade(applyV8Upgrade);
  // v9 — zone-method-aware reconcile prep (data-only upgrade).
  db.version(9).stores(SCHEMAS.v8).upgrade(applyV9Upgrade);
};

const registerV10ToV12 = (db: DexieVersionHost): void => {
  // v10 — coaching auto-match retro-fix (per coaching-activity-dialog-
  // redesign / D8). Schema is unchanged from v8; only the data-side
  // upgrade fires, scanning coachingActivities × workouts for pairs
  // that lack a sessionMatch and writing the missing rows.
  db.version(10).stores(SCHEMAS.v8).upgrade(applyV10Upgrade);
  // v11 — SessionMatch.source rename: legacy "auto-conversion" rows are
  // rewritten to the canonical "auto-coaching" value (coaching-activity-
  // dialog-redesign §1.4 follow-up). Schema unchanged from v8; data-only.
  db.version(11).stores(SCHEMAS.v8).upgrade(applyV11Upgrade);
  // v12 — SessionMatch.executedWorkoutIds backfill (Train2Go three-slot
  // grouping). Schema unchanged from v8; data-only — every existing row
  // gets `executedWorkoutIds: []` so the field is always present on read.
  db.version(12).stores(SCHEMAS.v8).upgrade(applyV12Upgrade);
};

const registerV13 = (db: DexieVersionHost): void => {
  // v13 — workouts become profile-scoped 1–1. Adds `profileId` +
  // `[profileId+date]` indexes on the `workouts` store and backfills
  // every legacy row from `meta.activeProfileId`. The upgrade throws
  // when workouts exist but no active profile is set — degenerate
  // state, not a silently-tolerated condition.
  db.version(13).stores(SCHEMAS.v13).upgrade(applyV13Upgrade);
};

export const registerKaiordVersions = (db: DexieVersionHost): void => {
  registerV1ToV3(db);
  registerV4ToV6(db);
  registerV7ToV9(db);
  registerV10ToV12(db);
  registerV13(db);
};
