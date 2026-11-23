import type { Workout } from "@kaiord/core";

import { fitStringPrefix } from "../shared/fit-string";

/**
 * The writer also copies workout notes onto a first step that has none, so a
 * watch shows them; that copy is the description again, not a note of its own.
 */
export const dropAttachedWorkoutNotes = (
  steps: Workout["steps"],
  notes: string | undefined
): Workout["steps"] => {
  const [first, ...rest] = steps;
  if (!notes || !first || "repeatCount" in first) return steps;
  if (first.notes !== fitStringPrefix(notes)) return steps;
  const withoutCopy = { ...first };
  delete withoutCopy.notes;
  return [withoutCopy, ...rest];
};
