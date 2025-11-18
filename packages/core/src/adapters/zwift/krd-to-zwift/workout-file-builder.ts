import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../../domain/schemas/workout";
import { convertStepsToZwiftIntervals } from "./intervals-encoder";

type WorkoutData = {
  name?: string;
  sport?: string;
  steps?: Array<WorkoutStep | RepetitionBlock>;
};

type ZwiftExtensions = Record<string, unknown>;

export const buildWorkoutFile = (
  workoutData: WorkoutData,
  zwiftExtensions: ZwiftExtensions
): Record<string, unknown> => {
  const sportType =
    workoutData.sport === "cycling"
      ? "bike"
      : workoutData.sport === "running"
        ? "run"
        : "bike";

  const workoutFile: Record<string, unknown> = {
    "@_xmlns": "http://www.zwift.com/workouts",
  };

  if (zwiftExtensions.author) {
    workoutFile.author = zwiftExtensions.author;
  }
  if (workoutData.name) {
    workoutFile.name = workoutData.name;
  }
  if (zwiftExtensions.description) {
    workoutFile.description = zwiftExtensions.description;
  }
  workoutFile.sportType = sportType;

  if (zwiftExtensions.durationType) {
    workoutFile.durationType = zwiftExtensions.durationType;
  }
  if (zwiftExtensions.thresholdSecPerKm !== undefined) {
    workoutFile.thresholdSecPerKm = zwiftExtensions.thresholdSecPerKm;
  }

  const tags = zwiftExtensions.tags as Array<string> | undefined;
  if (tags && tags.length > 0) {
    workoutFile.tags = {
      tag: tags.map((name) => ({ "@_name": name })),
    };
  }

  const intervals = convertStepsToZwiftIntervals(workoutData.steps || []);
  workoutFile.workout = intervals;

  return workoutFile;
};
