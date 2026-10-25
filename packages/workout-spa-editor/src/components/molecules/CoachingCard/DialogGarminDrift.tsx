import { useGarminLedgerRow } from "../../../hooks/use-garmin-ledger-row";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { GarminDriftNotice } from "../GarminDriftBadge/GarminDriftNotice";

/** The coaching dialog's "Garmin still on" state; it shows its own outcome. */
export function DialogGarminDrift({
  workout,
  locked,
}: {
  workout: WorkoutRecord;
  locked: boolean;
}) {
  const placementRow = useGarminLedgerRow(workout.id);
  return (
    <GarminDriftNotice
      workout={workout}
      placementRow={placementRow}
      locked={locked}
      withFeedback
    />
  );
}
