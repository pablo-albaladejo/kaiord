/**
 * v37 — nutrition rides the cloud snapshot, merged last-write-wins on
 * `updatedAt`. Rows written before the stores synced have no such clock, so
 * it is backfilled from the time the row was made: an intake entry's
 * `loggedAt`, a preset's `createdAt`. A row that already has a clock is left
 * alone. `energyTargets` always carried `updatedAt`.
 */
import type { Transaction } from "dexie";

type Row = Record<string, unknown>;

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
