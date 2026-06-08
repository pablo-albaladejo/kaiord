/**
 * CalendarDialogs - Dialog layer for the calendar page.
 *
 * Renders RawWorkoutDialog and CoachingActivityDialog. The previous
 * EmptyDayDialog has been removed; the calendar empty-day "+" now
 * navigates to `/workout/new?date=Y-M-D`.
 */

import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import { CoachingActivityDialog } from "../molecules/CoachingCard/CoachingActivityDialog";
import { RawWorkoutDialog } from "../molecules/RawWorkoutDialog/RawWorkoutDialog";
import { useDialogHandlers } from "./use-dialog-handlers";

export type CalendarDialogsProps = {
  selectedWorkout: WorkoutRecord | null;
  selectedCoachingActivity?: CoachingActivity | null;
  onCloseWorkout: () => void;
  onCloseCoaching?: () => void;
  expandActivity: (activity: CoachingActivity) => void;
  onOpenExecuted?: (workout: WorkoutRecord) => void;
  /** Override the "Process" target (Daily passes a `daily`-origin builder). */
  buildProcessHref?: (id: string) => string;
};

export function CalendarDialogs({
  selectedWorkout,
  selectedCoachingActivity = null,
  onCloseWorkout,
  onCloseCoaching = () => {},
  expandActivity,
  onOpenExecuted,
  buildProcessHref,
}: CalendarDialogsProps) {
  const { handleProcess, handleSkip, handleUnskip, isSubmitting } =
    useDialogHandlers(selectedWorkout, onCloseWorkout, buildProcessHref);

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
      <CoachingActivityDialog
        activity={selectedCoachingActivity}
        onClose={onCloseCoaching}
        expandActivity={expandActivity}
        onOpenExecuted={onOpenExecuted}
      />
    </>
  );
}
