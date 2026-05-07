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
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={props.onClose}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Close
        </button>
        {!props.pickerOpen && (
          <button
            type="button"
            data-testid="coaching-dialog-match-existing"
            onClick={props.onOpenPicker}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Match existing
          </button>
        )}
        <button
          type="button"
          data-testid="coaching-dialog-edit-manually"
          disabled={props.creatingManual}
          onClick={props.onEditManually}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {props.creatingManual ? "Creating…" : "Edit manually"}
        </button>
        <button
          type="button"
          data-testid="coaching-dialog-ai-process"
          onClick={props.onAiProcess}
          className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
        >
          AI process
        </button>
      </div>
    </div>
  );
}
