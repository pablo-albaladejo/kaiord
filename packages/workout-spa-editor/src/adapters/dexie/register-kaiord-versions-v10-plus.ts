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

export const registerV13AndV14 = (db: DexieVersionHost): void => {
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
};
