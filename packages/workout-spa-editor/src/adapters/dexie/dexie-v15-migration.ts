/**
 * v14 → v15 migration — userPreferences scratch-sport + AI-banner state.
 *
 * Walks every `userPreferences` row and ensures `lastScratchSport` and
 * `aiBannerExpanded` exist on the JSON shape. Both fields are optional
 * in `userPreferencesSchema` so absence is also valid; the explicit
 * `undefined` assignment normalises shape so consumers can `?? default`
 * without first probing `in`. Schema is unchanged from v13; this is a
 * data-only upgrade.
 *
 * Forward-only by design. The Zod schema and this migration ship
 * together; an earlier schema deploying with this migration is harmless
 * (the extra fields are ignored), but a later schema requiring these
 * fields without this migration would throw on first read.
 *
 * Idempotency is guaranteed by Dexie's version gating (the upgrade
 * runs exactly once per browser per bump).
 */
import type { Transaction } from "dexie";

type UserPrefsRow = {
  profileId: string;
  calendarView?: unknown;
  lastScratchSport?: unknown;
  aiBannerExpanded?: unknown;
  updatedAt?: string;
};

export const applyV15Upgrade = async (tx: Transaction): Promise<void> => {
  await tx
    .table("userPreferences")
    .toCollection()
    .modify((row: UserPrefsRow) => {
      if (!("lastScratchSport" in row)) row.lastScratchSport = undefined;
      if (!("aiBannerExpanded" in row)) row.aiBannerExpanded = undefined;
    });
};
