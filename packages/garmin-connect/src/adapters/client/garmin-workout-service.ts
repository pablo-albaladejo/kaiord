import type {
  KRD,
  ListOptions,
  Logger,
  PushResult,
  WorkoutService,
  WorkoutSummary,
} from "@kaiord/core";
import {
  createConsoleLogger,
  toText,
  createServiceApiError,
} from "@kaiord/core";
import { createGarminWriter } from "@kaiord/garmin";
import type { GarminHttpClient } from "../http/garmin-http-client";
import { mapToWorkoutSummary } from "../mappers/workout-summary.mapper";
import {
  garminPushResponseSchema,
  garminWorkoutSummarySchema,
} from "../schemas/workout-response.schema";
import { WORKOUT_URL } from "../http/urls";

export type GarminWorkoutClient = Pick<WorkoutService, "push" | "list">;

const pushWorkout = async (
  krd: KRD,
  httpClient: GarminHttpClient,
  garminWriter: ReturnType<typeof createGarminWriter>,
  log: Logger
): Promise<PushResult> => {
  try {
    log.info("Pushing workout to Garmin Connect");
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
      url: `https://connect.garmin.com/modern/workout/${result.workoutId}`,
    };
  } catch (error) {
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
  const garminWriter = createGarminWriter(log);

  return {
    push: (krd) => pushWorkout(krd, httpClient, garminWriter, log),
    list: (opts) => listWorkouts(httpClient, log, opts),
  };
};
