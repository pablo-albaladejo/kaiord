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
