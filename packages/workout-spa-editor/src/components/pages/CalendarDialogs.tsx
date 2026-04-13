/**
 * CalendarDialogs - Dialog layer for the calendar page.
 *
 * Renders RawWorkoutDialog and EmptyDayDialog.
 */

import type { WorkoutRecord } from "../../types/calendar-record";
import { EmptyDayDialog } from "../molecules/EmptyDayDialog/EmptyDayDialog";
import { RawWorkoutDialog } from "../molecules/RawWorkoutDialog/RawWorkoutDialog";
import { useDialogHandlers } from "./use-dialog-handlers";

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
  const { handleProcess, handleSkip, handleUnskip, isSubmitting } =
    useDialogHandlers(selectedWorkout, onCloseWorkout);

  return (
    <>
      <RawWorkoutDialog
        workout={selectedWorkout}
        onClose={onCloseWorkout}
        onProcess={handleProcess}
        onSkip={handleSkip}
        onUnskip={handleUnskip}
        isSubmitting={isSubmitting}
      />
      <EmptyDayDialog date={emptyDayDate} onClose={onCloseDay} />
    </>
  );
}
