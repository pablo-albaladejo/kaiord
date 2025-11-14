import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import { convertConditionalDuration } from "./duration-converters/conditional";
import { convertRepeatDuration } from "./duration-converters/repeat";
import { convertRepeatHrPowerDuration } from "./duration-converters/repeat-hr-power";
import { convertSimpleDuration } from "./duration-converters/simple";

export const convertDuration = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  const { duration } = step;

  if (convertSimpleDuration(duration, message)) return;
  if (convertConditionalDuration(duration, message)) return;
  if (convertRepeatDuration(duration, message)) return;
  if (convertRepeatHrPowerDuration(duration, message)) return;

  message.durationType = fitDurationTypeSchema.enum.open;
};
