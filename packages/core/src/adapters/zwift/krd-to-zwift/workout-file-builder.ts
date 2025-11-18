import type { KRDMetadata } from "../../../domain/schemas/krd";
import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { convertStepsToZwiftIntervals } from "./intervals-encoder";
import { addKrdMetadata } from "./metadata-builder";
import { addWorkoutProperties, mapSportType } from "./workout-properties";

type WorkoutData = {
  name?: string;
  sport?: string;
  steps?: Array<WorkoutStep | RepetitionBlock>;
};

type ZwiftExtensions = Record<string, unknown>;
type FitExtensions = Record<string, unknown>;

export const buildWorkoutFile = (
  workoutData: WorkoutData,
  zwiftExtensions: ZwiftExtensions,
  metadata: KRDMetadata,
  fitExtensions?: FitExtensions,
  logger?: Logger
): Record<string, unknown> => {
  const workoutFile: Record<string, unknown> = {};

  // Add author and name first (XSD requires this order)
  addWorkoutProperties(workoutFile, workoutData.name, zwiftExtensions);
  // Then sportType
  workoutFile.sportType = mapSportType(workoutData.sport);

  const intervals = convertStepsToZwiftIntervals(
    workoutData.steps || [],
    logger
  );
  workoutFile.workout = intervals;

  addKrdMetadata(workoutFile, metadata, fitExtensions);

  return workoutFile;
};
