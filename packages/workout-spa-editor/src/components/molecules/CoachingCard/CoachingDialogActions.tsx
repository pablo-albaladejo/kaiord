/**
 * Footer actions for CoachingActivityDialog.
 *
 * Solo-plan: "Convert to workout" + "Match to…" (opens MatchToPicker).
 * Matched: only "Close" — Split lives inside LinkedWorkoutSection;
 *          Convert is hidden because the executed workout already exists.
 *
 * The picker is rendered in-place above the action row when open so the
 * keyboard contract (Tab → first item, Escape → close picker only) lives
 * inside one render pass.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import { MatchToPicker } from "./MatchToPicker";

export type CoachingDialogActionsProps = {
  matched: boolean;
  matching: boolean;
  converting: boolean;
  pickerOpen: boolean;
  pickerWorkouts: WorkoutRecord[];
  onClose: () => void;
  onConvert: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSelectWorkout: (workoutId: string) => void;
};

export function CoachingDialogActions({
  matched,
  matching,
  converting,
  pickerOpen,
  pickerWorkouts,
  onClose,
  onConvert,
  onOpenPicker,
  onClosePicker,
  onSelectWorkout,
}: CoachingDialogActionsProps) {
  return (
    <div className="space-y-3 pt-3">
      {!matched && pickerOpen && (
        <MatchToPicker
          workouts={pickerWorkouts}
          pending={matching}
          onSelect={onSelectWorkout}
          onClose={onClosePicker}
        />
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Close
        </button>
        {!matched && !pickerOpen && (
          <button
            type="button"
            onClick={onOpenPicker}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Match to…
          </button>
        )}
        {!matched && (
          <button
            type="button"
            disabled={converting}
            onClick={onConvert}
            className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {converting ? "Converting…" : "Convert to workout"}
          </button>
        )}
      </div>
    </div>
  );
}
