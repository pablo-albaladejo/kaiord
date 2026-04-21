import { useMemo } from "react";

import { findById } from "../../../store/find-by-id";
import type { Workout, WorkoutStep } from "../../../types/krd";

export const useSelectedStep = (
  selectedStepId: string | null,
  workout: Workout
): WorkoutStep | null => {
  return useMemo(() => {
    if (!selectedStepId) return null;

    const found = findById(workout, selectedStepId);
    if (!found) return null;
    if (found.kind === "block") return null;
    return found.step;
  }, [selectedStepId, workout]);
};
