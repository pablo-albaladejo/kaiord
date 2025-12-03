import type { KRD, RepetitionBlock, WorkoutStep } from "../types/krd";

export type WorkoutState = {
  currentWorkout: KRD | null;
  workoutHistory: Array<KRD>;
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
