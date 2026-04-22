import type { UIWorkout, UIWorkoutItem } from "../types/krd-ui";

export type {
  UIRepetitionBlock,
  UIWorkout,
  UIWorkoutInner,
  UIWorkoutItem,
  UIWorkoutStep,
} from "../types/krd-ui";

export type WorkoutState = {
  currentWorkout: UIWorkout | null;
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  // `selectionHistory` is kept parallel to `workoutHistory`: each entry
  // is the `selectedStepId` that was active the moment the matching
  // workout snapshot was pushed. Undo of add/paste/duplicate restores
  // focus to that item when still present (§6 focus-rule wiring).
  // Typed as `string | null` to match `selectedStepId`; values stored
  // here come from the same UUID v4 provider as every other UIWorkout
  // id, so the brand is applied at the point of use downstream.
  selectionHistory: Array<string | null>;
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  isEditing: boolean;
  deletedSteps?: Array<{
    // Keep the stable-ItemId contract on the undo trail: the restored item
    // must carry the same `ItemId` the user saw before deletion.
    step: UIWorkoutItem;
    index: number;
    timestamp: number;
  }>;
};
