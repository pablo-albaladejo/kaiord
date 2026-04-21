import type { Workout } from "../types/krd";
import { isRepetitionBlock } from "../types/krd";
import type {
  UIRepetitionBlock,
  UIWorkoutInner,
  UIWorkoutStep,
} from "../types/krd-ui";
import type { ItemId } from "./providers/item-id";

export type FoundStep = {
  kind: "step";
  step: UIWorkoutStep;
  index: number;
};

export type FoundBlock = {
  kind: "block";
  block: UIRepetitionBlock;
  index: number;
};

export type FoundNestedStep = {
  kind: "nested-step";
  step: UIWorkoutStep;
  stepIndex: number;
  block: UIRepetitionBlock;
  blockIndex: number;
};

export type FindByIdResult = FoundStep | FoundBlock | FoundNestedStep;

/**
 * Locate a UI item (step, repetition block, or step-inside-block) by its
 * stable `ItemId`. Returns the item plus enough context for callers to
 * compute flat / nested positions without re-walking the tree.
 *
 * Single replacement for the legacy positional-ID parser that decoded
 * `step-N` / `block-N-step-M` strings. Consumers that previously pulled
 * position info out of a string now receive it directly on the result.
 */
export const findById = (
  workout: Workout | UIWorkoutInner | undefined,
  id: ItemId | string | null | undefined
): FindByIdResult | null => {
  if (!workout || !id) return null;

  for (let i = 0; i < workout.steps.length; i++) {
    const item = workout.steps[i];
    if (isRepetitionBlock(item)) {
      if ((item as UIRepetitionBlock).id === id) {
        return {
          kind: "block",
          block: item as UIRepetitionBlock,
          index: i,
        };
      }
      for (let j = 0; j < item.steps.length; j++) {
        const nested = item.steps[j] as UIWorkoutStep;
        if (nested.id === id) {
          return {
            kind: "nested-step",
            step: nested,
            stepIndex: j,
            block: item as UIRepetitionBlock,
            blockIndex: i,
          };
        }
      }
    } else if ((item as UIWorkoutStep).id === id) {
      return { kind: "step", step: item as UIWorkoutStep, index: i };
    }
  }

  return null;
};
