import type { WorkoutStep } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { convertDurationToTcx } from "./duration-to-tcx-encoder";
import { convertTargetToTcx } from "./target-to-tcx.converter";

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const addPowerExtensions = (
  step: WorkoutStep,
  tcxStep: Record<string, unknown>,
  logger: Logger
): void => {
  if (step.target.type === "power") {
    logger.debug("Encoding power target to TCX extensions", {
      stepIndex: step.stepIndex,
    });
    const powerValue = step.target.value;
    if (powerValue && "unit" in powerValue && powerValue.unit === "watts") {
      tcxStep.Extensions = {
        TPX: {
          "@_xmlns": "http://www.garmin.com/xmlschemas/ActivityExtension/v2",
          Watts: powerValue.value,
        },
      };
    }
  }
};

export const convertStepToTcx = (
  step: WorkoutStep,
  index: number,
  logger: Logger
): Record<string, unknown> => {
  logger.debug("Converting step to TCX", { stepIndex: step.stepIndex });

  const tcxStep: Record<string, unknown> = {
    "@_xsi:type": "Step_t",
    StepId: index + 1,
  };

  if (step.name) {
    tcxStep.Name = step.name;
  }

  tcxStep.Duration = convertDurationToTcx(step);

  if (step.intensity) {
    tcxStep.Intensity = capitalizeFirst(step.intensity);
  }

  tcxStep.Target = convertTargetToTcx(step);

  if (step.extensions?.tcx) {
    logger.debug("Restoring step-level TCX extensions", {
      stepIndex: step.stepIndex,
    });
    tcxStep.Extensions = step.extensions.tcx;
  } else {
    addPowerExtensions(step, tcxStep, logger);
  }

  return tcxStep;
};
