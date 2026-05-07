/**
 * No-workout state actions: [AI process] (primary), [Edit manually],
 * [Match existing], [Close]. The AI hint above the buttons surfaces
 * when the activity description is empty so the user knows the prompt
 * will fall back to title+sport (per design D6).
 *
 * The MatchToPicker renders inline above the action row when open so
 * the keyboard contract stays in one render pass.
 */
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { MatchToPicker } from "./MatchToPicker";
import { NoWorkoutButtons } from "./no-workout-buttons";

export type NoWorkoutActionsProps = {
  activity: CoachingActivity;
  matching: boolean;
  pickerOpen: boolean;
  pickerWorkouts: WorkoutRecord[];
  creatingManual: boolean;
  onClose: () => void;
  onAiProcess: () => void;
  onEditManually: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSelectWorkout: (workoutId: string) => void;
};

const isDescriptionEmpty = (activity: CoachingActivity): boolean => {
  const d = activity.description;
  return d === undefined || d === "" || d.trim() === "";
};

export function NoWorkoutActions(props: NoWorkoutActionsProps) {
  const showHint = isDescriptionEmpty(props.activity);
  // Single-writer invariant: a fast user must not queue two creation paths.
  const writeInFlight = props.creatingManual || props.matching;
  return (
    <div className="space-y-3 pt-3">
      {showHint && (
        <p
          data-testid="coaching-dialog-ai-hint"
          className="text-xs text-slate-500 dark:text-slate-400"
        >
          ℹ AI will use only the title + sport
        </p>
      )}
      {props.pickerOpen && (
        <MatchToPicker
          workouts={props.pickerWorkouts}
          pending={props.matching}
          onSelect={props.onSelectWorkout}
          onClose={props.onClosePicker}
        />
      )}
      <NoWorkoutButtons
        pickerOpen={props.pickerOpen}
        writeInFlight={writeInFlight}
        creatingManual={props.creatingManual}
        onClose={props.onClose}
        onOpenPicker={props.onOpenPicker}
        onEditManually={props.onEditManually}
        onAiProcess={props.onAiProcess}
      />
    </div>
  );
}
