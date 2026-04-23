/**
 * Creates selection-related action handlers for the workout store.
 *
 * Multi-selection invariant (§8.8): a selection cannot span the main
 * list and the inside of a repetition block. When a toggle would
 * violate that invariant, the selection is *replaced* rather than
 * extended — we drop the previous selection and start a new one
 * rooted at the newly-toggled item's parent.
 */

import type { Workout } from "../types/krd";
import { findById } from "./find-by-id";

type MinimalState = {
  selectedStepIds: Array<string>;
  currentWorkout?: { extensions?: { structured_workout?: Workout } } | null;
};

/** Returns the parent block id (or `null` for main-list) of an item id. */
const parentOf = (workout: Workout | undefined, id: string): string | null => {
  const found = findById(workout, id);
  if (!found) return null;
  if (found.kind === "nested-step") return found.block.id as string;
  // Top-level step or block card → main list (represented as `null`).
  return null;
};

export function createSelectionActions(
  set: (partial: Partial<unknown>) => void
) {
  return {
    selectStep: (id: string | null) =>
      set({ selectedStepId: id, selectedStepIds: [] }),

    toggleStepSelection: (id: string) =>
      set((state: MinimalState) => {
        const workout = state.currentWorkout?.extensions?.structured_workout as
          | Workout
          | undefined;
        const isSelected = state.selectedStepIds.includes(id);
        if (isSelected) {
          return {
            selectedStepIds: state.selectedStepIds.filter((s) => s !== id),
            selectedStepId: null,
          };
        }

        // Replace — not extend — if the toggle would mix a main-list
        // item and a nested-step from a block (or steps from two
        // different blocks).
        const incomingParent = parentOf(workout, id);
        const sameParent = state.selectedStepIds.every(
          (existing) => parentOf(workout, existing) === incomingParent
        );
        const nextSelection = sameParent
          ? [...state.selectedStepIds, id]
          : [id];

        return {
          selectedStepIds: nextSelection,
          selectedStepId: null,
        };
      }),

    clearStepSelection: () => set({ selectedStepIds: [] }),

    selectAllSteps: (ids: Array<string>) =>
      set((state: MinimalState) => {
        const workout = state.currentWorkout?.extensions?.structured_workout as
          | Workout
          | undefined;
        if (ids.length === 0) {
          return { selectedStepIds: [], selectedStepId: null };
        }
        // Same invariant: every id must share a parent; otherwise we
        // drop everything but the items that share the first id's
        // parent.
        const firstParent = parentOf(workout, ids[0]);
        const filtered = ids.filter(
          (id) => parentOf(workout, id) === firstParent
        );
        return {
          selectedStepIds: filtered,
          selectedStepId: null,
        };
      }),
  };
}
