import { targetTypeSchema } from "@kaiord/core";
import type { WorkoutStep } from "@kaiord/core";
import { fitTargetTypeSchema } from "../schemas/fit-target";

/**
 * Converts KRD stroke_type target to FIT swimStroke target.
 *
 * The stroke value is already a FIT-compatible number (0-5):
 * 0 = freestyle, 1 = backstroke, 2 = breaststroke, 3 = butterfly, 4 = drill, 5 = mixed/IM
 */
export const convertStrokeTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeSchema.enum.swimStroke;
  if (step.target.type !== targetTypeSchema.enum.stroke_type) return;

  // Zod discriminated union guarantees value exists when type is stroke_type
  const strokeValue = step.target.value as { unit: string; value: number };

  message.targetValue = strokeValue.value;
};
