/**
 * Per-profile table predicate.
 *
 * A Dexie table is "per-profile" iff its rows are owned by a single profile
 * such that deleting that profile MUST delete every row in the table for
 * that profile. The cascade-fan-out test enumerates `db.tables` and applies
 * this predicate to discover the cascade surface dynamically — adding a
 * new per-profile table without updating `deleteProfile` MUST cause the
 * test to fail (per design D18 of calendar-coaching-redesign-completion).
 *
 * A table is per-profile when ANY of:
 *   - its primary key starts with `profileId` (single PK or compound
 *     `[profileId+...]`);
 *   - it carries a top-level `profileId` index (single-key index
 *     keyPath === "profileId");
 *   - it carries a compound index whose first component is `profileId`
 *     (e.g., `[profileId+date]`) — Dexie treats these as profile-scoped
 *     entry points, and they appear in `coachingActivities` and similar
 *     tables that have a generic `id` primary key.
 *
 * The predicate is the single source of truth shared between the test and
 * the production cascade. Neither call site MAY hard-code the cascade list.
 */

import type Dexie from "dexie";

const PROFILE_ID_FIELD = "profileId";

const startsWithProfileId = (
  keyPath: string | string[] | null | undefined
): boolean => {
  if (keyPath == null) return false;
  if (keyPath === PROFILE_ID_FIELD) return true;
  if (Array.isArray(keyPath) && keyPath[0] === PROFILE_ID_FIELD) return true;
  return false;
};

const primaryKeyStartsWithProfileId = (table: Dexie.Table): boolean =>
  startsWithProfileId(table.schema.primKey?.keyPath);

const hasProfileIdScopedIndex = (table: Dexie.Table): boolean =>
  table.schema.indexes.some((idx) => startsWithProfileId(idx.keyPath));

export const isPerProfileTable = (table: Dexie.Table): boolean =>
  primaryKeyStartsWithProfileId(table) || hasProfileIdScopedIndex(table);
