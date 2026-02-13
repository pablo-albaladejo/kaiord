import type { KRD, Logger, Workout } from "@kaiord/core";
import {
  createGarminParsingError,
  isRepetitionBlock,
  workoutSchema,
} from "@kaiord/core";
import type { GarminWorkoutStepInput } from "../schemas/input/types";
import { mapKrdSportToGarmin } from "../mappers/sport.mapper";
import { mapWorkoutStep } from "./garmin-workout-step.converter";
import { mapRepetitionBlock } from "./garmin-repetition.converter";
import { addPoolInfo, type PoolInput } from "./garmin-pool-info.mapper";

export const convertKRDToGarmin = (krd: KRD, logger: Logger): string => {
  logger.info("Converting KRD to Garmin Connect JSON");

  const workout = extractWorkout(krd);
  if (!workout) {
    throw createGarminParsingError("KRD does not contain a structured workout");
  }

  const sportType = mapKrdSportToGarmin(workout.sport);
  const counter = { value: 1 };

  const workoutSteps: GarminWorkoutStepInput[] = workout.steps.map((step) =>
    isRepetitionBlock(step)
      ? mapRepetitionBlock(step, counter)
      : mapWorkoutStep(step, counter)
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

  logger.info("KRD to Garmin GCN conversion complete");
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
