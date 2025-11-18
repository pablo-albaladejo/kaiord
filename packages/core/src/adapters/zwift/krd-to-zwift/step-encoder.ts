import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { encodeDuration } from "./duration-encoder";
import { encodeHeartRateTarget, encodeMetadata } from "./metadata-encoder";
import { encodeCadence, encodeTargets } from "./target-encoder";
import { encodeTextEvents } from "./text-events-encoder";

export const convertStepToInterval = (
  step: WorkoutStep,
  intervalType: string,
  logger?: Logger
): Record<string, unknown> => {
  const interval: Record<string, unknown> = {};

  encodeDuration(step, interval, logger);
  encodeTargets(step, intervalType, interval, logger);
  encodeCadence(step, interval);
  encodeHeartRateTarget(step, interval, logger);
  encodeMetadata(step, interval);

  const textEvents = encodeTextEvents(step);
  if (textEvents) {
    interval.textevent = textEvents;
  }

  return interval;
};
