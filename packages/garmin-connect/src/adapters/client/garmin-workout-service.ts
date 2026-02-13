import type {
  KRD,
  Logger,
  WorkoutService,
  WorkoutSummary,
  PushResult,
  ListOptions,
} from "@kaiord/core";
import { createConsoleLogger, toText, fromText } from "@kaiord/core";
import { createGarminReader, createGarminWriter } from "@kaiord/garmin";
import { createServiceApiError } from "@kaiord/core";
import type { GarminHttpClient } from "../http/garmin-http-client";
import {
  createGarminAuthProvider,
  type GarminAuthProviderOptions,
} from "../auth/garmin-auth-provider";
import { mapToWorkoutSummary } from "../mappers/workout-summary.mapper";
import {
  garminPushResponseSchema,
  garminWorkoutSummarySchema,
} from "../schemas/workout-response.schema";
import { WORKOUT_URL } from "../http/urls";

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

const pullWorkout = async (
  workoutId: string,
  httpClient: GarminHttpClient,
  garminReader: ReturnType<typeof createGarminReader>,
  log: Logger
): Promise<KRD> => {
  try {
    log.info("Pulling workout from Garmin Connect", { workoutId });
    const detail = await httpClient.get<Record<string, unknown>>(
      `${WORKOUT_URL}/workout/${workoutId}`
    );
    const gcnString = JSON.stringify(detail);
    return fromText(gcnString, garminReader, log);
  } catch (error) {
    throw createServiceApiError(
      `Failed to pull workout ${workoutId}`,
      undefined,
      error
    );
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

const removeWorkout = async (
  workoutId: string,
  httpClient: GarminHttpClient,
  log: Logger
): Promise<void> => {
  try {
    log.info("Deleting workout from Garmin Connect", { workoutId });
    await httpClient.del(`${WORKOUT_URL}/workout/${workoutId}`);
  } catch (error) {
    throw createServiceApiError(
      `Failed to delete workout ${workoutId}`,
      undefined,
      error
    );
  }
};

export const createGarminWorkoutService = (
  httpClient: GarminHttpClient,
  logger?: Logger
): WorkoutService => {
  const log = logger ?? createConsoleLogger();
  const garminWriter = createGarminWriter(log);
  const garminReader = createGarminReader(log);

  return {
    push: (krd) => pushWorkout(krd, httpClient, garminWriter, log),
    pull: (id) => pullWorkout(id, httpClient, garminReader, log),
    list: (opts) => listWorkouts(httpClient, log, opts),
    remove: (id) => removeWorkout(id, httpClient, log),
  };
};

export type GarminConnectClientOptions = GarminAuthProviderOptions;

export const createGarminConnectClient = (
  options?: GarminConnectClientOptions
) => {
  const { auth, httpClient } = createGarminAuthProvider(options);
  const service = createGarminWorkoutService(httpClient, options?.logger);
  return { auth, service };
};
