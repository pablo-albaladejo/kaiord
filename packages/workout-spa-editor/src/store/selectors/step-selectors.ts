/**
 * Step-level selectors
 *
 * Hooks that mutate or observe individual workout steps (create,
 * duplicate, reorder, delete + soft-delete recovery state). Selection is
 * deliberately split out into selection-selectors.ts to keep this file
 * focused on step lifecycle.
 */

import { useWorkoutStore } from "../workout-store";

export const useCreateStep = () => useWorkoutStore((state) => state.createStep);

export const useDeleteStep = () => useWorkoutStore((state) => state.deleteStep);

export const useUndoDelete = () => useWorkoutStore((state) => state.undoDelete);

export const useClearExpiredDeletes = () =>
  useWorkoutStore((state) => state.clearExpiredDeletes);

export const useDeletedSteps = () =>
  useWorkoutStore((state) => state.deletedSteps);

export const useDuplicateStep = () =>
  useWorkoutStore((state) => state.duplicateStep);

export const useReorderStep = () =>
  useWorkoutStore((state) => state.reorderStep);
