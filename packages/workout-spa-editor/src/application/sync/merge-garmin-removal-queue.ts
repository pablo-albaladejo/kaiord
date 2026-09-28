/**
 * Removal-queue helpers for the Garmin ledger merge. Pure, no I/O.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import type {
  GarminPlaced,
  GarminPlacement,
  GarminRemovalEntry,
} from "../../types/garmin-ledger";

export const scheduleIdOf = (p: GarminPlacement | undefined) =>
  p?.kind === "scheduled" ? p.workoutScheduleId : undefined;

/** Union by id, `newer`'s entries first: max `attempts`, OR `abandoned`. */
export const unionRemovalQueues = (
  newer: ExportLedgerEntry,
  older: ExportLedgerEntry
): Map<string, GarminRemovalEntry> => {
  const byId = new Map<string, GarminRemovalEntry>();
  const all = [...(newer.removalQueue ?? []), ...(older.removalQueue ?? [])];
  for (const entry of all) {
    const seen = byId.get(entry.workoutScheduleId);
    const merged = seen && {
      ...seen,
      attempts: Math.max(seen.attempts, entry.attempts),
      abandoned: seen.abandoned || entry.abandoned,
    };
    byId.set(entry.workoutScheduleId, merged || entry);
  }
  return byId;
};

/** A superseded scheduled entry, fresh in the queue. */
export const toRemovalEntry = (
  p: GarminPlaced & { kind: "scheduled" }
): GarminRemovalEntry => ({
  workoutScheduleId: p.workoutScheduleId,
  workoutId: p.workoutId,
  date: p.date,
  attempts: 0,
  abandoned: false,
});
