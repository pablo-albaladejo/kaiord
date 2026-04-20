/**
 * State-only fields of the workout store. Keep this file small — the
 * single-responsibility split lets `workout-store-types.ts` stay under
 * the max-lines budget and keeps composed slices (focus, future ones)
 * trivial to inspect.
 */

import type { UIWorkout, UIWorkoutItem } from "../types/krd-ui";

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
};
