/**
 * v37 — nutrition rides the cloud snapshot, merged last-write-wins on
 * `updatedAt`. Rows written before the stores synced have no such clock, so
 * it is backfilled from the time the row was made: an intake entry's
 * `loggedAt`, a preset's `createdAt`. A row that already has a clock is left
 * alone. `energyTargets` always carried `updatedAt`.
 *
 * The three stores also gain an `updatedAt` index, so the auto-push change
 * token reads each one's latest edit without scanning it.
 */
import type { Transaction } from "dexie";

type Row = Record<string, unknown>;

/** Only the changed stores; Dexie keeps every other store as declared. */
export const V37_STORES = {
  intakeEntries: "id, [profileId+date], updatedAt",
  intakePresets: "id, profileId, updatedAt",
  energyTargets: "profileId, updatedAt",
};

const backfill = (tx: Transaction, table: string, from: string) =>
  tx
    .table(table)
    .toCollection()
    .modify((row: Row) => {
      if (row.updatedAt === undefined && typeof row[from] === "string")
        row.updatedAt = row[from];
    });

export const applyV37Upgrade = async (tx: Transaction): Promise<void> => {
  await backfill(tx, "intakeEntries", "loggedAt");
  await backfill(tx, "intakePresets", "createdAt");
};
