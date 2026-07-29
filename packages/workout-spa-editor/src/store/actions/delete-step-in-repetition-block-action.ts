/**
 * Delete Step in Repetition Block Action
 *
 * Removes a step addressed by its position *within* a repetition block.
 *
 * The top-level `deleteStepAction` addresses steps by their `stepIndex`
 * field across `workout.steps`, which never descends into blocks. Nested
 * steps therefore need this block-scoped path — routing them through the
 * top-level action deletes whichever top-level step happens to share the
 * numeric index.
 *
 * Emptying a block cascades: per `spa-editor-focus-management`
 * ("Delete of only step inside repetition block"), the parent block
 * SHALL be deleted in the same state update.
 *
 * Undo is served by the generic `undoHistory` snapshot rather than the
 * `deletedSteps` trail: `undoDeleteAction` splices restored entries back
 * into `workout.steps` at the top level, so recording a nested step
 * there would resurrect it in the wrong parent.
 */

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import { nextAfterDelete } from "../focus-rules";
import type { ItemId } from "../providers/item-id";
import { findBlockById } from "../utils/block-utils";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { buildKrdWithWorkout, extractStructuredWorkout } from "./_helpers";

const reindexTopLevel = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep | RepetitionBlock> => {
  let currentIndex = 0;
  return steps.map((step) =>
    isWorkoutStep(step) ? { ...step, stepIndex: currentIndex++ } : step
  );
};

export const deleteStepInRepetitionBlockAction = (
  krd: KRD,
  blockId: string,
  stepIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) return {};

  const blockInfo = findBlockById(workout, blockId);
  if (!blockInfo) return {};

  const { block, position } = blockInfo;
  if (stepIndex < 0 || stepIndex >= block.steps.length) return {};

  const remaining = block.steps.filter((_, index) => index !== stepIndex);
  const cascaded = remaining.length === 0;
  const steps = [...workout.steps];

  if (cascaded) {
    steps.splice(position, 1);
  } else {
    const updatedBlock: RepetitionBlock = {
      ...block,
      steps: remaining.map((step, index) => ({ ...step, stepIndex: index })),
    };
    steps[position] = updatedBlock;
  }

  const updatedWorkout: Workout = { ...workout, steps: reindexTopLevel(steps) };

  // Cascade → the block vacated a main-list slot, so main-list focus
  // rules apply at its position. Otherwise focus stays inside the block.
  const pendingFocusTarget = cascaded
    ? nextAfterDelete({ workout: updatedWorkout, deletedIndex: position })
    : nextAfterDelete({
        workout: updatedWorkout,
        deletedIndex: stepIndex,
        parentBlockId: blockId as ItemId,
      });

  return {
    ...createUpdateWorkoutAction(
      buildKrdWithWorkout(krd, updatedWorkout),
      state
    ),
    ...(cascaded ? { selectedStepId: null, selectedStepIds: [] } : {}),
    pendingFocusTarget,
  };
};
