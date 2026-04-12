/**
 * CalendarDialogs - Dialog layer for the calendar page.
 *
 * Renders RawWorkoutDialog and EmptyDayDialog.
 */

import type { WorkoutRecord } from "../../types/calendar-record";
import { EmptyDayDialog } from "../molecules/EmptyDayDialog/EmptyDayDialog";
import { RawWorkoutDialog } from "../molecules/RawWorkoutDialog/RawWorkoutDialog";

export type CalendarDialogsProps = {
  selectedWorkout: WorkoutRecord | null;
  emptyDayDate: string | null;
  onCloseWorkout: () => void;
  onCloseDay: () => void;
};

export function CalendarDialogs({
  selectedWorkout,
  emptyDayDate,
  onCloseWorkout,
  onCloseDay,
}: CalendarDialogsProps) {
  return (
    <>
      <RawWorkoutDialog
        workout={selectedWorkout}
        onClose={onCloseWorkout}
        onProcess={onCloseWorkout}
        onSkip={onCloseWorkout}
        onUnskip={onCloseWorkout}
      />
      <EmptyDayDialog date={emptyDayDate} onClose={onCloseDay} />
    </>
  );
}
