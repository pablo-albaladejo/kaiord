import { isRepetitionBlock, isWorkoutStep } from "../../types/krd";
import type {
  UIRepetitionBlock,
  UIWorkout,
  UIWorkoutItem,
  UIWorkoutStep,
} from "../../types/krd-ui";
import type { ItemId } from "../providers/item-id";

export const getMainListItems = (
  workout: UIWorkout
): ReadonlyArray<UIWorkoutItem> =>
  (workout.extensions?.structured_workout?.steps ??
    []) as ReadonlyArray<UIWorkoutItem>;

export const findMainListIndex = (workout: UIWorkout, id: ItemId): number =>
  getMainListItems(workout).findIndex((item) => item.id === id);

export const findBlockInMainList = (
  workout: UIWorkout,
  blockId: ItemId
): { block: UIRepetitionBlock; index: number } | null => {
  const items = getMainListItems(workout);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (isRepetitionBlock(item) && item.id === blockId) {
      return { block: item as UIRepetitionBlock, index: i };
    }
  }
  return null;
};

export const findBlockContainingStepId = (
  workout: UIWorkout,
  stepId: ItemId
): {
  block: UIRepetitionBlock;
  blockIndex: number;
  stepIndex: number;
} | null => {
  const items = getMainListItems(workout);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!isRepetitionBlock(item)) continue;
    const block = item as UIRepetitionBlock;
    const idx = block.steps.findIndex((s) => s.id === stepId);
    if (idx !== -1) return { block, blockIndex: i, stepIndex: idx };
  }
  return null;
};

export const containsItemId = (workout: UIWorkout, id: ItemId): boolean => {
  for (const item of getMainListItems(workout)) {
    if (item.id === id) return true;
    if (!isWorkoutStep(item)) {
      const block = item as UIRepetitionBlock;
      if (block.steps.some((s: UIWorkoutStep) => s.id === id)) return true;
    }
  }
  return false;
};
