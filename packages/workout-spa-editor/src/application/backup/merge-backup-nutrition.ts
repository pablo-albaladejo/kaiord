/**
 * The device-local rewrite of a backup import: the default profile's rows
 * move onto its re-key target first (as a Drive sync moves them), then the
 * file's nutrition rows merge in last-write-wins by key, this device's row
 * winning a tie. Nutrition has no delete markers yet, so an entry deleted
 * after the backup comes back (the import summary says so). Rows of a
 * profile that does not exist after the import are left out. Pure.
 */

import type { BackupNutrition } from "../../types/backup";
import type { SnapshotTables } from "../../types/snapshot";
import { rekeyDeviceLocal } from "../sync/import-reconciled-snapshot";
import { mergeTableRows } from "../sync/merge-table-rows";
import type { ProfileRekey } from "../sync/rekey-profile-rows";

type Row = Record<string, unknown>;

export type NutritionMerge = {
  rekey: ProfileRekey | null;
  nutrition: BackupNutrition;
  profileIds: ReadonlySet<unknown>;
};

const NO_DELETES = new Map<string, number>();

/** The file's nutrition rows that belong to a profile present after import. */
export const ownedNutrition = ({
  nutrition,
  profileIds,
}: NutritionMerge): SnapshotTables =>
  Object.fromEntries(
    Object.entries(nutrition).map(([table, rows]) => [
      table,
      (rows as Row[]).filter((row) => profileIds.has(row.profileId)),
    ])
  );

export const mergeBackupNutrition =
  (merge: NutritionMerge) =>
  (tables: SnapshotTables): SnapshotTables => {
    const base = merge.rekey
      ? { ...tables, ...rekeyDeviceLocal(merge.rekey)(tables) }
      : tables;
    const next: Record<string, ReadonlyArray<unknown>> = { ...base };
    for (const [table, rows] of Object.entries(ownedNutrition(merge))) {
      const all = [...(base[table] ?? []), ...rows] as Row[];
      next[table] = mergeTableRows(table, all, NO_DELETES);
    }
    return next;
  };
