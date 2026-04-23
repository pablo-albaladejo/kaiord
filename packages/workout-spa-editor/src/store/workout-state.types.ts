import type { UIWorkout, UIWorkoutItem } from "../types/krd-ui";
import type { FocusTarget } from "./focus/focus-target.types";

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
  /**
   * Focus intent written by mutating actions (§6). `useFocusAfterAction`
   * (§7) reads it after each commit and moves DOM focus.
   */
  pendingFocusTarget: FocusTarget | null;
  // `selectionHistory` is kept parallel to `workoutHistory`: each entry
  // is the `selectedStepId` that was active the moment the matching
  // workout snapshot was pushed. Undo of add/paste/duplicate restores
  // focus to that item when still present (§6 focus-rule wiring).
  // Typed as `string | null` to match `selectedStepId` and avoid an
  // unsafe brand cast at the single `pushHistorySnapshot` call site.
  // Values stored here are the same id strings as every `UIWorkoutStep`
  // / `UIRepetitionBlock`, produced by `defaultIdProvider()` (UUID v4);
  // the `ItemId` brand is applied at the point of use downstream
  // (focus-rule helpers in §6 that look items up via `findById`).
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
