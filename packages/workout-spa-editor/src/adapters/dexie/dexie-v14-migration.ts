/**
 * v13 → v14 migration — calendar preference rename.
 *
 * Walks every `userPreferences` row, writes `calendarView = "grid"`
 * (unconditional collapse — both legacy `"compact"` and `"comfortable"`
 * map to grid because the migration cannot read the user's viewport)
 * and removes the legacy `calendarDensity` field. Schema is unchanged
 * from v13; this is a data-only upgrade.
 *
 * Forward-only by design. The Zod schema (`userPreferencesSchema`) and
 * this migration are atomically coupled — shipping one without the
 * other throws `userPreferencesSchema.parse(...)` on the first read
 * after upgrade.
 *
 * Idempotency is guaranteed by Dexie's version gating (the upgrade
 * runs exactly once per browser per bump).
 */
import type { Transaction } from "dexie";

type LegacyUserPrefsRow = {
  profileId: string;
  calendarDensity?: unknown;
  calendarView?: unknown;
  updatedAt?: string;
};

export const applyV14Upgrade = async (tx: Transaction): Promise<void> => {
  await tx
    .table("userPreferences")
    .toCollection()
    .modify((row: LegacyUserPrefsRow) => {
      row.calendarView = "grid";
      delete row.calendarDensity;
    });
};
