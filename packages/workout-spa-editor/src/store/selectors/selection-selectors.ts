/**
 * Selection-state selectors
 *
 * Hooks that read or mutate the editor's step-selection state (single-id
 * selection, multi-id selection, toggle / clear actions). Kept separate
 * from step-lifecycle selectors so components that only care about
 * selection do not re-render when steps are added or reordered.
 */

import { useWorkoutStore } from "../workout-store";

export const useSelectedStepId = () =>
  useWorkoutStore((state) => state.selectedStepId);

export const useSelectedStepIds = () =>
  useWorkoutStore((state) => state.selectedStepIds);

export const useSelectStep = () => useWorkoutStore((state) => state.selectStep);

export const useToggleStepSelection = () =>
  useWorkoutStore((state) => state.toggleStepSelection);

export const useClearStepSelection = () =>
  useWorkoutStore((state) => state.clearStepSelection);
