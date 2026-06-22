/**
 * useWeeklyTrainingTime — reactive read of the weekly-training-time trend (one
 * Monday-anchored point per week, in minutes) for a profile across a date range.
 *
 * Reads the profile's workouts in the range through the port and reduces them
 * with the pure `buildWeeklyTrainingTime`. Returns `undefined` while loading
 * and when `profileId` is null.
 */
import { useLiveQuery } from "dexie-react-hooks";

import {
  buildWeeklyTrainingTime,
  type WeeklyTrainingTimePoint,
} from "../../application/energy/build-weekly-training-time";
import { usePersistence } from "../../contexts/persistence-context";

export const useWeeklyTrainingTime = (
  profileId: string | null,
  startDate: string,
  endDate: string
): WeeklyTrainingTimePoint[] | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<WeeklyTrainingTimePoint[] | undefined>(async () => {
    if (!profileId) return undefined;
    const records = await persistence.workouts.getByDateRange(
      startDate,
      endDate
    );
    return buildWeeklyTrainingTime(
      records.filter((record) => record.profileId === profileId)
    );
  }, [persistence, profileId, startDate, endDate]);
};
