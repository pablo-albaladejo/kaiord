/**
 * MatchToPickerItem — single workout entry inside `MatchToPicker`.
 * Extracted so the parent picker stays under the function-size lint cap.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";

export type MatchToPickerItemProps = {
  workout: WorkoutRecord;
  focused: boolean;
  pending: boolean;
  onSelect: (workoutId: string) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
};

const formatWorkoutLabel = (w: WorkoutRecord): string => {
  const sport = w.sport ?? "workout";
  const minutes = w.raw?.duration?.value
    ? ` · ${Math.round(w.raw.duration.value / 60)}min`
    : "";
  return `${sport}${minutes}`;
};

export function MatchToPickerItem({
  workout,
  focused,
  pending,
  onSelect,
  buttonRef,
}: MatchToPickerItemProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="option"
      aria-selected={focused}
      disabled={pending}
      onClick={() => onSelect(workout.id)}
      className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:opacity-50 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
    >
      {formatWorkoutLabel(workout)}
    </button>
  );
}
