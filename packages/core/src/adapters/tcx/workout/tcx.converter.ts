import type { KRD } from "../../../domain/schemas/krd";
import type { Workout, WorkoutStep } from "../../../domain/schemas/workout";
import { createTcxParsingError } from "../../../domain/types/errors";
import type { Logger } from "../../../ports/logger";
import { KRD_TO_TCX_SPORT } from "../schemas/tcx-sport";

export const convertKRDToTcx = (krd: KRD, logger: Logger): unknown => {
  logger.debug("Converting KRD to TCX structure");

  if (!krd.extensions?.workout) {
    throw createTcxParsingError(
      "KRD does not contain workout data in extensions"
    );
  }

  const workout = krd.extensions.workout as Workout;

  const tcxSport = KRD_TO_TCX_SPORT[workout.sport] || "Other";

  const tcxSteps = workout.steps.map((step, index) =>
    convertStepToTcx(step as WorkoutStep, index, logger)
  );

  const tcxWorkout: Record<string, unknown> = {
    "@_Sport": tcxSport,
    Name: workout.name,
    Step: tcxSteps,
  };

  // Restore workout-level extensions
  if (workout.extensions?.tcx) {
    logger.debug("Restoring workout-level TCX extensions");
    tcxWorkout.Extensions = workout.extensions.tcx;
  }

  const trainingCenterDatabase: Record<string, unknown> = {
    "@_xmlns": "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2",
    "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    Workouts: {
      Workout: tcxWorkout,
    },
  };

  // Restore TrainingCenterDatabase-level extensions
  if (krd.extensions?.tcx) {
    logger.debug("Restoring TrainingCenterDatabase-level TCX extensions");
    trainingCenterDatabase.Extensions = krd.extensions.tcx;
  }

  return {
    TrainingCenterDatabase: trainingCenterDatabase,
  };
};

const convertStepToTcx = (
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

  // Convert duration
  tcxStep.Duration = convertDurationToTcx(step);

  // Convert intensity
  if (step.intensity) {
    tcxStep.Intensity = capitalizeFirst(step.intensity);
  }

  // Convert target
  tcxStep.Target = convertTargetToTcx(step);

  // Restore step-level extensions
  if (step.extensions?.tcx) {
    logger.debug("Restoring step-level TCX extensions", {
      stepIndex: step.stepIndex,
    });
    tcxStep.Extensions = step.extensions.tcx;
  } else if (step.target.type === "power") {
    // Restore power data to extensions if not already present
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

  return tcxStep;
};

const convertDurationToTcx = (step: WorkoutStep): Record<string, unknown> => {
  if (step.duration.type === "time") {
    return {
      "@_xsi:type": "Time_t",
      Seconds: step.duration.seconds,
    };
  }

  if (step.duration.type === "distance") {
    return {
      "@_xsi:type": "Distance_t",
      Meters: step.duration.meters,
    };
  }

  if (step.duration.type === "open") {
    return {
      "@_xsi:type": "LapButton_t",
    };
  }

  // Default to open for unsupported types
  return {
    "@_xsi:type": "LapButton_t",
  };
};

const convertTargetToTcx = (step: WorkoutStep): Record<string, unknown> => {
  if (step.target.type === "open") {
    return {
      "@_xsi:type": "None_t",
    };
  }

  if (step.target.type === "heart_rate") {
    const value = step.target.value;
    if (value && "unit" in value) {
      if (value.unit === "zone") {
        return {
          "@_xsi:type": "HeartRate_t",
          HeartRateZone: {
            "@_xsi:type": "PredefinedHeartRateZone_t",
            Number: value.value,
          },
        };
      }

      if (value.unit === "bpm" || value.unit === "range") {
        const min = "min" in value ? value.min : value.value;
        const max = "max" in value ? value.max : value.value;
        return {
          "@_xsi:type": "HeartRate_t",
          HeartRateZone: {
            "@_xsi:type": "CustomHeartRateZone_t",
            Low: min,
            High: max,
          },
        };
      }
    }
  }

  if (step.target.type === "pace") {
    const value = step.target.value;
    if (value && "unit" in value) {
      if (value.unit === "meters_per_second" || value.unit === "range") {
        const min = "min" in value ? value.min : value.value;
        const max = "max" in value ? value.max : value.value;
        return {
          "@_xsi:type": "Speed_t",
          SpeedZone: {
            "@_xsi:type": "CustomSpeedZone_t",
            LowInMetersPerSecond: min,
            HighInMetersPerSecond: max,
          },
        };
      }
    }
  }

  if (step.target.type === "cadence") {
    const value = step.target.value;
    if (value && "unit" in value) {
      if (value.unit === "rpm" || value.unit === "range") {
        const min = "min" in value ? value.min : value.value;
        const max = "max" in value ? value.max : value.value;
        return {
          "@_xsi:type": "Cadence_t",
          CadenceZone: {
            "@_xsi:type": "CustomCadenceZone_t",
            Low: min,
            High: max,
          },
        };
      }
    }
  }

  // Default to None for unsupported target types
  return {
    "@_xsi:type": "None_t",
  };
};

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
