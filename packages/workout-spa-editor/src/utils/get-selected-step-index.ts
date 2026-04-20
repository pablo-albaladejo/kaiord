/**
 * Get Selected Step Index Utility
 *
 * Resolves the current array position of a selected top-level step by
 * its stable ItemId. Only returns a position for main-list steps —
 * selections on a block or on a nested-inside-block step return null.
 */

import { findById } from "../store/find-by-id";
import type { Workout } from "../types/krd";

export const getSelectedStepIndex = (
  selectedStepId: string | null,
  workout: Workout | undefined
): number | null => {
  if (!selectedStepId || !workout) return null;

  const found = findById(workout, selectedStepId);
  if (!found || found.kind !== "step") return null;
  return found.index;
};
