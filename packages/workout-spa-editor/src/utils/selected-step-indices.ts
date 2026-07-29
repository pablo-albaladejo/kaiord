/**
 * Resolve a multi-selection to the `stepIndex` values a bulk main-list
 * mutation addresses.
 */

import { findById } from "../store/find-by-id";
import type { Workout } from "../types/krd";

/**
 * Returns `null` unless every selected id resolves to a *top-level*
 * step.
 *
 * The single-parent invariant makes a selection homogeneous — either all
 * main-list or all inside one block — so a nested selection is addressed
 * by block id and must not fall through to the main-list path.
 *
 * Note the two distinct index spaces: `findById` yields the flat *array*
 * position, while bulk delete matches on the domain `stepIndex`. They
 * diverge as soon as a repetition block sits earlier in the list, so the
 * domain value is what gets returned here.
 */
export const selectedTopLevelStepIndices = (
  workout: Workout | undefined,
  ids: ReadonlyArray<string>
): Array<number> | null => {
  if (ids.length === 0) return null;

  const indices: Array<number> = [];
  for (const id of ids) {
    const found = findById(workout, id);
    if (found?.kind !== "step" || !("stepIndex" in found.step)) return null;
    indices.push(found.step.stepIndex);
  }
  return indices;
};
