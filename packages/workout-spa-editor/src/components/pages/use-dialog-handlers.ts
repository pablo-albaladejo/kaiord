/**
 * Dialog handler hooks for CalendarDialogs.
 *
 * Extracts skip/unskip/process handlers with loading state.
 */

import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { db } from "../../adapters/dexie/dexie-database";
import {
  transitionToRaw,
  transitionToSkipped,
} from "../../application/workout-transitions";
import { withOrigin } from "../../routing/with-origin";
import type { WorkoutRecord } from "../../types/calendar-record";
import { getWeekIdForDate } from "../../utils/week-utils";

/** Week id for a YYYY-MM-DD date via a local-midnight anchor (the same
    convention as `calendar-week-href.ts` — `getWeekIdForDate` reads local
    calendar fields, so a UTC anchor would shift the week in UTC+13/+14). */
const weekIdForDate = (date: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  return getWeekIdForDate(new Date(year, month - 1, day));
};

export function useDialogHandlers(
  selectedWorkout: WorkoutRecord | null,
  onCloseWorkout: () => void
) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // commentIndices is part of the dialog's onProcess contract but the workout
  // route consumes no selection, so handleProcess takes only the workout id.
  // The originating week comes from the closed-over selectedWorkout's date
  // so Back returns to THAT week's grid.
  const handleProcess = useCallback(
    (id: string) => {
      const week = selectedWorkout
        ? weekIdForDate(selectedWorkout.date)
        : undefined;
      navigate(withOrigin(`/workout/${id}`, "calendar", { week }));
      onCloseWorkout();
    },
    [navigate, onCloseWorkout, selectedWorkout]
  );

  const handleSkip = useCallback(
    async (id: string) => {
      if (!selectedWorkout || selectedWorkout.id !== id) return;
      setIsSubmitting(true);
      try {
        const updated = transitionToSkipped(selectedWorkout);
        await db.table("workouts").put(updated);
        onCloseWorkout();
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedWorkout, onCloseWorkout]
  );

  const handleUnskip = useCallback(
    async (id: string) => {
      if (!selectedWorkout || selectedWorkout.id !== id) return;
      setIsSubmitting(true);
      try {
        const updated = transitionToRaw(selectedWorkout);
        await db.table("workouts").put(updated);
        onCloseWorkout();
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedWorkout, onCloseWorkout]
  );

  return { handleProcess, handleSkip, handleUnskip, isSubmitting };
}
