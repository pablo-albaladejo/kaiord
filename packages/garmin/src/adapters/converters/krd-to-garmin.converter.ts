import {
  createGarminParsingError,
  isRepetitionBlock,
  workoutSchema,
} from "@kaiord/core";
import { addPoolInfo, type PoolInput } from "./garmin-pool-info.mapper";
import { mapRepetitionBlock } from "./garmin-repetition.converter";
import { mapWorkoutStep } from "./garmin-workout-step.converter";
import { mapKrdSportToGarmin } from "../mappers/sport.mapper";
import type { TargetMapperOptions } from "../mappers/target.mapper";
import type { GarminWorkoutStepInput } from "../schemas/input/types";
import type { KRD, Logger, Workout } from "@kaiord/core";

export type GarminWriterOptions = TargetMapperOptions & {
  logger: Logger;
};

export const convertKRDToGarmin = (
  krd: KRD,
  options: GarminWriterOptions
): string => {
  options.logger.info("Converting KRD to Garmin Connect JSON");

  const workout = extractWorkout(krd);
  if (!workout) {
    throw createGarminParsingError("KRD does not contain a structured workout");
  }

  const sportType = mapKrdSportToGarmin(workout.sport);
  const counter = { value: 1 };
  const targetOpts: TargetMapperOptions = {
    paceZones: options.paceZones,
  };

  const workoutSteps: GarminWorkoutStepInput[] = workout.steps.map((step) =>
    isRepetitionBlock(step)
      ? mapRepetitionBlock(step, counter, targetOpts)
      : mapWorkoutStep(step, counter, targetOpts)
  );

  const input: PoolInput & Record<string, unknown> = {
    sportType,
    workoutName: (workout.name ?? "Kaiord Workout").substring(0, 255),
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType,
        workoutSteps,
      },
    ],
  };

  addPoolInfo(workout, input);

  options.logger.info("KRD to Garmin GCN conversion complete");
  return JSON.stringify(input, null, 2);
};

const extractWorkout = (krd: KRD): Workout | undefined => {
  const ext = krd.extensions?.structured_workout;
  if (!ext || typeof ext !== "object") return undefined;

  const result = workoutSchema.safeParse(ext);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw createGarminParsingError(`Invalid workout data: ${issues}`);
  }

  return result.data;
};
