import type { UIWorkout, UIWorkoutItem } from "../types/krd-ui";
import type { FocusTarget } from "./focus/focus-target.types";
import type { ItemId } from "./providers/item-id";

export type {
  UIRepetitionBlock,
  UIWorkout,
  UIWorkoutInner,
  UIWorkoutItem,
  UIWorkoutStep,
} from "../types/krd-ui";

export type HistoryEntry = {
  workout: UIWorkout;
  selection: ItemId | null;
};

export type UndoHistory = Array<HistoryEntry>;

export type WorkoutState = {
  currentWorkout: UIWorkout | null;
  undoHistory: UndoHistory;
  historyIndex: number;
  /**
   * Focus intent written by mutating actions (§6). `useFocusAfterAction`
   * (§7) reads it after each commit and moves DOM focus.
   */
  pendingFocusTarget: FocusTarget | null;
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  isEditing: boolean;
  deletedSteps?: Array<{
    step: UIWorkoutItem;
    index: number;
    timestamp: number;
  }>;
};
