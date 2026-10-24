/**
 * Dialog handler hooks for CalendarDialogs.
 *
 * Extracts skip/unskip/process handlers with loading state.
 */

import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { updateWorkoutRecord } from "../../application/save-workout-edits";
import {
  transitionToRaw,
  transitionToSkipped,
} from "../../application/workout-transitions";
import { usePersistence } from "../../contexts/persistence-context";
import { withOrigin } from "../../routing/with-origin";
import type { WorkoutRecord } from "../../types/calendar-record";
import { getWeekIdForDate } from "../../utils/week-utils";

/** Week id for a YYYY-MM-DD date via a local-midnight anchor (the same
    convention as `calendar-week-href.ts` — `getWeekIdForDate` reads local
    calendar fields, so a UTC anchor would shift the week in UTC+13/+14). */
const finitePart = (value: number | undefined, fallback: number): number =>
  value !== undefined && Number.isFinite(value) ? value : fallback;

const weekIdForDate = (date: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  return getWeekIdForDate(
    new Date(finitePart(year, 0), finitePart(month, 1) - 1, finitePart(day, 1))
  );
};

export function useDialogHandlers(
  selectedWorkout: WorkoutRecord | null,
  onCloseWorkout: () => void,
  // Optional href builder for the "Process" target. The default routes Back to
  // THAT week's calendar grid; the Daily page passes a `daily`-origin builder so
  // Back returns to /daily?date= instead of leaking the calendar origin.
  buildProcessHref?: (id: string) => string
) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const persistence = usePersistence();

  const handleProcess = useCallback(
    (id: string) => {
      if (buildProcessHref) {
        navigate(buildProcessHref(id));
      } else {
        const week = selectedWorkout
          ? weekIdForDate(selectedWorkout.date)
          : undefined;
        navigate(withOrigin(`/workout/${id}`, "calendar", { week }));
      }
      onCloseWorkout();
    },
    [navigate, onCloseWorkout, selectedWorkout, buildProcessHref]
  );

  const handleSkip = useCallback(
    async (id: string) => {
      if (!selectedWorkout || selectedWorkout.id !== id) return;
      setIsSubmitting(true);
      try {
        // Onto the row as stored: a move made since the dialog opened stays.
        await updateWorkoutRecord(persistence, id, (fresh) =>
          fresh.state === "raw" ? transitionToSkipped(fresh) : undefined
        );
        onCloseWorkout();
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedWorkout, onCloseWorkout, persistence]
  );

  const handleUnskip = useCallback(
    async (id: string) => {
      if (!selectedWorkout || selectedWorkout.id !== id) return;
      setIsSubmitting(true);
      try {
        await updateWorkoutRecord(persistence, id, (fresh) =>
          fresh.state === "skipped" ? transitionToRaw(fresh) : undefined
        );
        onCloseWorkout();
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedWorkout, onCloseWorkout, persistence]
  );

  return { handleProcess, handleSkip, handleUnskip, isSubmitting };
}
