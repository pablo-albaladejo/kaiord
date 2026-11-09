/**
 * State fields of the workout store, composed by `workout-store-types.ts`.
 */

import type { UIWorkout, UIWorkoutItem } from "../types/krd-ui";
import type { FocusTarget } from "./focus/focus-target.types";
import type { UndoHistory } from "./workout-state.types";

export type DeletedStep = {
  step: UIWorkoutItem;
  index: number;
  /**
   * Wall-clock read, used *only* for the TTL sweep in
   * `clearExpiredDeletesAction`. It is NOT an identity: N deletes inside
   * one millisecond share a value, so keying undo on it restores one
   * entry and discards the rest.
   */
  timestamp: number;
  /**
   * Identity of the delete *operation* that produced this entry. A bulk
   * delete emits one entry per removed item, all sharing one `groupId`,
   * so `undoDelete` restores the whole operation atomically. A single
   * delete is simply a group of one.
   */
  groupId: string;
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
  undoHistory: UndoHistory;
  historyIndex: number;
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  isEditing: boolean;
  deletedSteps: Array<DeletedStep>;
  isModalOpen: boolean;
  modalConfig: ModalConfig | null;
  createBlockDialogOpen: boolean;
  pendingFocusTarget: FocusTarget | null;
};
