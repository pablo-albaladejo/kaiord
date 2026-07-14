/**
 * CalendarDialogs - Dialog layer for the calendar page.
 *
 * Renders RawWorkoutDialog and CoachingActivityDialog. The previous
 * EmptyDayDialog has been removed; the calendar empty-day "+" now
 * navigates to `/workout/new?date=Y-M-D`.
 */

import { isProjectedWorkoutRecord } from "../../application/coaching/activity-to-workout-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { ExpandActivity } from "../../types/coaching-expand-result";
import { CoachingActivityDialog } from "../molecules/CoachingCard/CoachingActivityDialog";
import { ExecutedActivityDialog } from "../molecules/ExecutedActivityDialog/ExecutedActivityDialog";
import { RawWorkoutDialog } from "../molecules/RawWorkoutDialog/RawWorkoutDialog";
import { useDialogHandlers } from "./use-dialog-handlers";

export type CalendarDialogsProps = {
  selectedWorkout: WorkoutRecord | null;
  selectedCoachingActivity?: CoachingActivity | null;
  onCloseWorkout: () => void;
  onCloseCoaching?: () => void;
  expandActivity: ExpandActivity;
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
  // Projected activities (executions with no persisted WorkoutRecord) get
  // the read-only preview; RawWorkoutDialog's Process/Skip actions assume
  // the raw-import workflow and don't apply to an already-recorded event.
  const isExecuted = selectedWorkout
    ? isProjectedWorkoutRecord(selectedWorkout)
    : false;
  const rawWorkout = isExecuted ? null : selectedWorkout;
  const { handleProcess, handleSkip, handleUnskip, isSubmitting } =
    useDialogHandlers(rawWorkout, onCloseWorkout, buildProcessHref);

  return (
    <>
      <RawWorkoutDialog
        workout={rawWorkout}
        onClose={onCloseWorkout}
        onProcess={handleProcess}
        onSkip={handleSkip}
        onUnskip={handleUnskip}
        isSubmitting={isSubmitting}
      />
      <ExecutedActivityDialog
        workout={isExecuted ? selectedWorkout : null}
        onClose={onCloseWorkout}
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
