/**
 * Get Selected Step Index Utility
 *
 * Resolves the current array position of a selected step by its ID.
 * Handles step ID parsing and position lookup in the workout steps array.
 */

import { parseStepId } from "./step-id-parser";
import type { Workout } from "../types/krd";

export const getSelectedStepIndex = (
  selectedStepId: string | null,
  workout: Workout | undefined
): number | null => {
  if (!selectedStepId || !workout) return null;

  try {
    const parsed = parseStepId(selectedStepId);

    if (parsed.type !== "step" || parsed.stepIndex === undefined) {
      return null;
    }

    // Only handle main workout steps (not block steps)
    if (parsed.blockIndex !== undefined) {
      return null;
    }

    const currentPosition = workout.steps.findIndex(
      (step) => "stepIndex" in step && step.stepIndex === parsed.stepIndex
    );

    return currentPosition === -1 ? null : currentPosition;
  } catch {
    return null;
  }
};
