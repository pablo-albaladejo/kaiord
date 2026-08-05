import { useMemo } from "react";

import { useAthleteZones } from "../../../contexts/athlete-zones-context";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { type SessionZones, sessionZones } from "./session-zones";

/** The zone shape and dominant zone for one session's card. */
export function useSessionZones(
  record: Pick<WorkoutRecord, "krd" | "sport">
): SessionZones {
  const profile = useAthleteZones();
  return useMemo(() => sessionZones(record, profile), [record, profile]);
}
