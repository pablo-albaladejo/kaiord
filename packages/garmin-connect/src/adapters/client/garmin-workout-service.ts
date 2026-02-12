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
import { WORKOUT_URL } from "../http/urls";

export const createGarminWorkoutService = (
  httpClient: GarminHttpClient,
  logger?: Logger
): WorkoutService => {
  const log = logger ?? createConsoleLogger();
  const garminWriter = createGarminWriter(log);
  const garminReader = createGarminReader(log);

  return {
    push: async (krd: KRD): Promise<PushResult> => {
      log.info("Pushing workout to Garmin Connect");
      const gcnJson = await toText(krd, garminWriter, log);
      const payload = JSON.parse(gcnJson) as Record<string, unknown>;

      const result = await httpClient.post<{
        workoutId: number;
        workoutName?: string;
      }>(`${WORKOUT_URL}/workout`, payload);

      return {
        id: String(result.workoutId),
        name: result.workoutName ?? "Workout",
        url: `https://connect.garmin.com/modern/workout/${result.workoutId}`,
      };
    },

    pull: async (workoutId: string): Promise<KRD> => {
      log.info("Pulling workout from Garmin Connect", { workoutId });
      const detail = await httpClient.get<Record<string, unknown>>(
        `${WORKOUT_URL}/workout/${workoutId}`
      );
      const gcnString = JSON.stringify(detail);
      return fromText(gcnString, garminReader, log);
    },

    list: async (options?: ListOptions): Promise<WorkoutSummary[]> => {
      log.info("Listing workouts from Garmin Connect");
      const start = options?.offset ?? 0;
      const limit = options?.limit ?? 20;
      const params = new URLSearchParams({
        start: String(start),
        limit: String(limit),
      });
      const workouts = await httpClient.get<
        Array<{
          workoutId?: number | string;
          workoutName?: string;
          sportType?: { sportTypeKey?: string };
          createdDate?: number;
          updatedDate?: number;
        }>
      >(`${WORKOUT_URL}/workouts?${params}`);

      return workouts.map(mapToWorkoutSummary);
    },

    remove: async (workoutId: string): Promise<void> => {
      log.info("Deleting workout from Garmin Connect", { workoutId });
      try {
        await httpClient.del(`${WORKOUT_URL}/workout/${workoutId}`);
      } catch (error) {
        throw createServiceApiError(
          `Failed to delete workout ${workoutId}`,
          undefined,
          error
        );
      }
    },
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
