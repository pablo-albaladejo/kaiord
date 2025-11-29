/**
 * Workout Loader Hook
 *
 * Manages workout loading logic with confirmation dialog.
 */

import { useState } from "react";
import type { WorkoutTemplate } from "../../../../types/workout-library";

export function useWorkoutLoader(
  hasCurrentWorkout: boolean,
  onLoadWorkout: (template: WorkoutTemplate) => void,
  onOpenChange: (open: boolean) => void
) {
  const [loadConfirmTemplate, setLoadConfirmTemplate] =
    useState<WorkoutTemplate | null>(null);

  const handleLoadWorkout = (template: WorkoutTemplate) => {
    if (hasCurrentWorkout) {
      setLoadConfirmTemplate(template);
    } else {
      confirmLoadWorkout(template);
    }
  };

  const confirmLoadWorkout = (template: WorkoutTemplate) => {
    onLoadWorkout(template);
    setLoadConfirmTemplate(null);
    onOpenChange(false);
  };

  const cancelLoadWorkout = () => {
    setLoadConfirmTemplate(null);
  };

  return {
    loadConfirmTemplate,
    handleLoadWorkout,
    confirmLoadWorkout,
    cancelLoadWorkout,
  };
}
