import { formatDuration } from "./format-duration";
import type { StepCardProps } from "./StepCard.types";

export const getStepLabel = (
  displayIndex: number,
  stepName: string | undefined,
  step: StepCardProps["step"]
): string => {
  return `Step ${displayIndex + 1}: ${stepName || formatDuration(step)}`;
};
