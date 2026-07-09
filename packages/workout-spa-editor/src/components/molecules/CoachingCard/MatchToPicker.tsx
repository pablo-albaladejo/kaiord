/**
 * MatchToPicker — keyboard-operable list for selecting a workout to
 * match a coaching activity to. Lives inside `CoachingActivityDialog`.
 *
 * Keyboard contract (per `spa-coaching-integration` "Match-to picker
 * keyboard navigation" + "Picker Escape closes only the picker"):
 *   Tab          focuses the first list item on first entry
 *   ArrowDown    moves focus to the next item (wraps at end)
 *   ArrowUp      moves focus to the previous item (wraps at start)
 *   Enter        selects the focused item
 *   Escape       closes the picker WITHOUT closing the parent dialog
 *
 * Selection invokes `onSelect(workoutId)`. Buttons are disabled while a
 * selection is in flight so a double-click cannot dispatch twice.
 */

import { useEffect, useRef, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { MatchToPickerItem } from "./MatchToPickerItem";

export type MatchToPickerProps = {
  workouts: WorkoutRecord[];
  pending: boolean;
  onSelect: (workoutId: string) => void;
  onClose: () => void;
};

const Empty = () => {
  const t = useTranslate("coaching");
  return (
    <div
      role="listbox"
      aria-label={t("picker.ariaLabel")}
      className="rounded border border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-700"
    >
      {t("picker.empty")}
    </div>
  );
};

export function MatchToPicker({
  workouts,
  pending,
  onSelect,
  onClose,
}: MatchToPickerProps) {
  const t = useTranslate("coaching");
  const [focusIndex, setFocusIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    itemRefs.current[focusIndex]?.focus();
  }, [focusIndex]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (workouts.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i) => (i + 1) % workouts.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i) => (i - 1 + workouts.length) % workouts.length);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  if (workouts.length === 0) return <Empty />;

  return (
    <div
      role="listbox"
      aria-label={t("picker.ariaLabel")}
      onKeyDown={onKeyDown}
      className="space-y-1 rounded border border-slate-200 p-2 dark:border-slate-700"
    >
      {workouts.map((w, idx) => (
        <MatchToPickerItem
          key={w.id}
          workout={w}
          focused={focusIndex === idx}
          pending={pending}
          onSelect={onSelect}
          buttonRef={(el) => {
            itemRefs.current[idx] = el;
          }}
        />
      ))}
    </div>
  );
}
