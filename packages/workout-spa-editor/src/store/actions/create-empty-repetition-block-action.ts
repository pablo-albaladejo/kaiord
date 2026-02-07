/**
 * Create Empty Repetition Block Action
 *
 * Action for creating an empty repetition block with a default step.
 *
 * Requirements:
 * - Allow users to create repetition blocks from scratch
 * - Automatically add a default step (5 minutes, open target, active intensity)
 */

import { isWorkoutStep } from "../../types/krd";
import { generateBlockId } from "../../utils/id-generation";
import { createUpdateWorkoutAction } from "../workout-actions";
import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import type { WorkoutState } from "../workout-actions";

/**
 * Default step template for new empty repetition blocks
 * - Duration: 5 minutes (300 seconds)
 * - Target: Open (no specific target)
 * - Intensity: Active
 */
const DEFAULT_STEP: Omit<WorkoutStep, "stepIndex"> = {
  durationType: "time",
  duration: {
    type: "time",
    seconds: 300, // 5 minutes
  },
  targetType: "open",
  target: {
    type: "open",
  },
  intensity: "active",
};

/**
 * Creates an empty repetition block with a default step at the end of the workout
 *
 * @param krd - Current KRD workout
 * @param repeatCount - Number of times to repeat (minimum 1)
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const createEmptyRepetitionBlockAction = (
  krd: KRD,
  repeatCount: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  // Validate inputs
  if (repeatCount < 1) return {};

  const workout = krd.extensions.workout as Workout;

  // Create default step with stepIndex 0 (within the block context)
  const defaultStep: WorkoutStep = {
    ...DEFAULT_STEP,
    stepIndex: 0,
  };

  // Create a repetition block with the default step
  const repetitionBlock: RepetitionBlock = {
    id: generateBlockId(),
    repeatCount,
    steps: [defaultStep],
  };

  // Add the repetition block at the end
  const newSteps = [...workout.steps, repetitionBlock];

  // Recalculate stepIndex for all WorkoutSteps
  let currentIndex = 0;
  const reindexedSteps = newSteps.map((step) => {
    if (isWorkoutStep(step)) {
      const reindexedStep = {
        ...step,
        stepIndex: currentIndex,
      };
      currentIndex++;
      return reindexedStep;
    }
    return step;
  });

  const updatedWorkout = {
    ...workout,
    steps: reindexedSteps,
  };

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: updatedWorkout,
    },
  };

  return createUpdateWorkoutAction(updatedKrd, state);
};
