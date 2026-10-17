import type {
  KRD,
  ListOptions,
  Logger,
  PushOptions,
  PushResult,
  WorkoutService,
  WorkoutSummary,
} from "@kaiord/core";
import {
  createConsoleLogger,
  createServiceApiError,
  MissingFtpError,
  toText,
} from "@kaiord/core";
import { createGarminReader, createGarminWriter } from "@kaiord/garmin";

import type { GarminHttpClient } from "../http/types";
import { garminWorkoutWebUrl, WORKOUT_URL } from "../http/urls";
import { mapToWorkoutSummary } from "../mappers/workout-summary.mapper";
import {
  garminPushResponseSchema,
  garminWorkoutSummarySchema,
} from "../schemas/workout-response.schema";
import { pullWorkout } from "./pull-workout";
import { removeWorkout } from "./remove-workout";

export type GarminWorkoutClient = WorkoutService;

const isNamedMissingFtp = (error: unknown): boolean =>
  error instanceof Error && error.name === "MissingFtpError";

const pushWorkout = async (
  krd: KRD,
  httpClient: GarminHttpClient,
  log: Logger,
  options?: PushOptions
): Promise<PushResult> => {
  try {
    log.info("Pushing workout to Garmin Connect");
    const garminWriter = createGarminWriter({
      logger: log,
      ftpWatts: options?.ftpWatts,
    });
    const gcnJson = await toText(krd, garminWriter, log);
    const payload = JSON.parse(gcnJson) as Record<string, unknown>;
    const raw = await httpClient.post<unknown>(
      `${WORKOUT_URL}/workout`,
      payload
    );
    const result = garminPushResponseSchema.parse(raw);
    return {
      id: String(result.workoutId),
      name: result.workoutName ?? "Workout",
      url: garminWorkoutWebUrl(result.workoutId),
    };
  } catch (error) {
    // Name check too: a second copy of @kaiord/core breaks `instanceof`.
    if (error instanceof MissingFtpError || isNamedMissingFtp(error)) {
      throw error;
    }
    throw createServiceApiError("Failed to push workout", undefined, error);
  }
};

const listWorkouts = async (
  httpClient: GarminHttpClient,
  log: Logger,
  options?: ListOptions
): Promise<WorkoutSummary[]> => {
  try {
    log.info("Listing workouts from Garmin Connect");
    const start = options?.offset ?? 0;
    const limit = options?.limit ?? 20;
    const params = new URLSearchParams({
      start: String(start),
      limit: String(limit),
    });
    const raw = await httpClient.get<unknown>(
      `${WORKOUT_URL}/workouts?${params}`
    );
    const workouts = garminWorkoutSummarySchema.array().parse(raw);
    return workouts.map(mapToWorkoutSummary);
  } catch (error) {
    throw createServiceApiError("Failed to list workouts", undefined, error);
  }
};

export const createGarminWorkoutService = (
  httpClient: GarminHttpClient,
  logger?: Logger
): GarminWorkoutClient => {
  const log = logger ?? createConsoleLogger();
  const garminReader = createGarminReader(log);

  return {
    push: (krd, opts) => pushWorkout(krd, httpClient, log, opts),
    pull: (id) => pullWorkout(id, httpClient, garminReader, log),
    list: (opts) => listWorkouts(httpClient, log, opts),
    remove: (id) => removeWorkout(id, httpClient, log),
  };
};
