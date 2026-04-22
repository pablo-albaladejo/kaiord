/**
 * State fields of the workout store.
 *
 * Split out of `workout-store-types.ts` so both the state shape and the
 * action signatures can live under the ≤80-line-per-file rule.
 */

import type { UIWorkout, UIWorkoutItem } from "../types/krd-ui";
import type { FocusTarget } from "./focus/focus-target.types";

export type DeletedStep = {
  step: UIWorkoutItem;
  index: number;
  timestamp: number;
};

export type ModalConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant: "default" | "destructive";
};

export type WorkoutStoreState = {
  currentWorkout: UIWorkout | null;
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  isEditing: boolean;
  safeMode: boolean;
  lastBackup: UIWorkout | null;
  deletedSteps: Array<DeletedStep>;
  isModalOpen: boolean;
  modalConfig: ModalConfig | null;
  createBlockDialogOpen: boolean;

  // Focus slice (§4) — `pendingFocusTarget` is an "intent" written by
  // mutating actions; `useFocusAfterAction` (§7) reads it after commit
  // and moves DOM focus. `selectionHistory` is kept parallel to
  // `workoutHistory` so undo/redo can restore focus to the item the
  // user saw selected before the undone mutation.
  pendingFocusTarget: FocusTarget | null;
  // Matches `selectedStepId: string | null`. The brand (`ItemId`) is
  // applied at the point of use (the selection ids stored here come
  // from the same provider as every other UIWorkout id), so the
  // relaxed type here avoids an unsafe `as ItemId` cast at the single
  // `pushHistorySnapshot` call site.
  selectionHistory: Array<string | null>;
};
