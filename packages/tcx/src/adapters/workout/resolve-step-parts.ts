import type { Duration, Logger, Sport, Target } from "@kaiord/core";

import { convertTcxDuration } from "../duration/duration-decoder.converter";
import { convertTargetWithExtensions } from "./target-with-extensions.helper";

export type ResolveStepInput = {
  tcxStep: Record<string, unknown>;
  extensions: Record<string, unknown> | undefined;
  sport: Sport;
  stepIndex: number;
  logger: Logger;
};

/**
 * Resolves a TCX step's duration and target, returning null (with a skip
 * warning) when either cannot be converted.
 */
export const resolveDurationAndTarget = ({
  tcxStep,
  extensions,
  sport,
  stepIndex,
  logger,
}: ResolveStepInput): { duration: Duration; target: Target } | null => {
  const duration = convertTcxDuration(
    tcxStep.Duration as Record<string, unknown> | undefined,
    logger
  );
  if (!duration) {
    logger.warn("Step has no valid duration, skipping", { stepIndex });
    return null;
  }

  const target = convertTargetWithExtensions(
    tcxStep,
    extensions,
    sport,
    logger
  );
  if (!target) {
    logger.warn("Step has no valid target, skipping", { stepIndex });
    return null;
  }

  return { duration, target };
};
