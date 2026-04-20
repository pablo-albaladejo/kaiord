/**
 * Flatten Steps
 *
 * Flattens a Workout's steps (including RepetitionBlocks)
 * into a flat array of PreviewBar objects for rendering.
 */

import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";
import { getStepColor } from "../../../utils/step-colors";
import { calculateNormalizedHeight } from "./bar-height";
import type { PreviewBar } from "./workout-preview-types";

const DEFAULT_DURATION_SECONDS = 300;

function getStepDuration(step: WorkoutStep): number {
  if (step.duration.type === "time") return step.duration.seconds;
  return DEFAULT_DURATION_SECONDS;
}

function stepToBar(step: WorkoutStep, id: string, stepId: string): PreviewBar {
  return {
    id,
    stepId,
    durationSeconds: getStepDuration(step),
    normalizedHeight: calculateNormalizedHeight(step.target, step.intensity),
    color: getStepColor(step),
    intensity: step.intensity,
  };
}

/**
 * Resolve the selection id for a workout item. Prefers the stable
 * `ItemId` (assigned by `hydrateUIWorkout`), falls back to position-based
 * ids only when a test harness passes a raw `Workout` without hydration.
 */
function selectionIdFor(
  item: WorkoutStep | RepetitionBlock,
  positionalFallback: string
): string {
  return (item as { id?: string }).id ?? positionalFallback;
}

function flattenBlock(
  block: RepetitionBlock,
  blockIndex: number
): PreviewBar[] {
  const bars: PreviewBar[] = [];
  const blockId = selectionIdFor(block, `block-${blockIndex}`);

  for (let rep = 0; rep < block.repeatCount; rep++) {
    for (let j = 0; j < block.steps.length; j++) {
      const inner = block.steps[j];
      // `barId` is unique per rendered bar; `stepId` points at the block so
      // clicking any bar inside the block selects the block itself.
      const barId = `${blockId}-rep-${rep}-step-${j}`;
      bars.push(stepToBar(inner, barId, blockId));
    }
  }

  return bars;
}

export function flattenWorkoutSteps(workout: Workout): PreviewBar[] {
  const bars: PreviewBar[] = [];

  for (let i = 0; i < workout.steps.length; i++) {
    const item = workout.steps[i];

    if (isRepetitionBlock(item)) {
      bars.push(...flattenBlock(item, i));
    } else {
      const stepId = selectionIdFor(item, `step-${item.stepIndex}`);
      bars.push(stepToBar(item, stepId, stepId));
    }
  }

  return bars;
}
