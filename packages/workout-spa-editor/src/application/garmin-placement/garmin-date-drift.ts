import type { ExportLedgerEntry } from "../../types/export-ledger";
import { isGarminPlaced } from "../../types/garmin-ledger";

export type GarminDateDrift = {
  placedOn: string;
  certainty: "placed" | "unconfirmed";
};

/**
 * The Garmin calendar entry still sits on another day than the workout.
 * Only a settled placement counts: an `attempting` or `uncertain` row is
 * mid-flight and has its own notice. A locked session never drifts — it
 * cannot move, so a differing date is not something the athlete caused.
 */
export const garminDateDrift = (
  row: Pick<ExportLedgerEntry, "placement"> | undefined,
  workout: { date: string },
  { locked }: { locked: boolean }
): GarminDateDrift | undefined => {
  const placement = row?.placement;
  if (locked || !isGarminPlaced(placement)) return undefined;
  if (placement.date === workout.date) return undefined;
  return {
    placedOn: placement.date,
    certainty: placement.kind === "scheduled" ? "placed" : "unconfirmed",
  };
};
