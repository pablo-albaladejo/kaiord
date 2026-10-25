import { useLiveQuery } from "dexie-react-hooks";

import { readSessionMovability } from "../../../application/read-session-movability";
import { usePersistence } from "../../../contexts/persistence-context";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import { GarminDriftNotice } from "../../molecules/GarminDriftBadge/GarminDriftNotice";

export type DetailGarminDriftProps = {
  record: WorkoutRecord;
  placementRow: ExportLedgerEntry | undefined;
};

/**
 * The detail's "Garmin still on" state. A done session is locked (AC-29);
 * until its movability is read the state stays hidden, so a locked session
 * never flashes an Update Garmin it cannot use.
 */
export function DetailGarminDrift({
  record,
  placementRow,
}: DetailGarminDriftProps) {
  const persistence = usePersistence();
  const movability = useLiveQuery(
    () => readSessionMovability(persistence, record.profileId, record),
    [persistence, record]
  );
  return (
    <GarminDriftNotice
      workout={record}
      placementRow={placementRow}
      locked={movability?.movable !== true}
    />
  );
}
