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
import type { WorkoutRecord } from "../../types/calendar-record";

export function useDialogHandlers(
  selectedWorkout: WorkoutRecord | null,
  onCloseWorkout: () => void
) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProcess = useCallback(
    (id: string, commentIndices: number[]) => {
      const params =
        commentIndices.length > 0
          ? `?comments=${commentIndices.join(",")}`
          : "";
      navigate(`/workout/${id}${params}`);
      onCloseWorkout();
    },
    [navigate, onCloseWorkout]
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
