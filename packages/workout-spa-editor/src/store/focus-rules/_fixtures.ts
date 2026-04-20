import type {
  UIRepetitionBlock,
  UIWorkout,
  UIWorkoutItem,
  UIWorkoutStep,
} from "../../types/krd-ui";
import type { ItemId } from "../providers/item-id";
import { asItemId } from "../providers/item-id";

export const step = (id: string, stepIndex = 0): UIWorkoutStep =>
  ({
    id: asItemId(id),
    stepIndex,
    durationType: "open",
    duration: { type: "open" },
    targetType: "open",
    target: { type: "open" },
  }) as unknown as UIWorkoutStep;

export const block = (
  id: string,
  steps: Array<UIWorkoutStep>,
  repeatCount = 2
): UIRepetitionBlock =>
  ({
    id: asItemId(id),
    repeatCount,
    steps,
  }) as unknown as UIRepetitionBlock;

export const workout = (items: Array<UIWorkoutItem>): UIWorkout =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { sport: "cycling" },
    extensions: {
      structured_workout: {
        name: "fixture",
        sport: "cycling",
        steps: items,
      },
    },
  }) as unknown as UIWorkout;

export const id = (s: string): ItemId => asItemId(s);
