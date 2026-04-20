import type { RepetitionBlock, WorkoutStep } from "../types/krd";
import type { UIWorkout } from "../types/krd-ui";

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
    step: WorkoutStep | RepetitionBlock;
    index: number;
    timestamp: number;
  }>;
};
