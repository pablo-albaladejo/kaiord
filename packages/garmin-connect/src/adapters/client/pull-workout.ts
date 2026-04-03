import { fromText, createServiceApiError } from "@kaiord/core";
import { WORKOUT_URL } from "../http/urls";
import type { GarminHttpClient } from "../http/types";
import type { KRD, Logger } from "@kaiord/core";
import type { createGarminReader } from "@kaiord/garmin";

export const pullWorkout = async (
  workoutId: string,
  httpClient: GarminHttpClient,
  garminReader: ReturnType<typeof createGarminReader>,
  log: Logger
): Promise<KRD> => {
  try {
    log.info(`Pulling workout ${workoutId} from Garmin Connect`);
    const raw = await httpClient.get<unknown>(
      `${WORKOUT_URL}/workout/${workoutId}`
    );
    const gcnJson = JSON.stringify(raw);
    return await fromText(gcnJson, garminReader, log);
  } catch (error) {
    throw createServiceApiError("Failed to pull workout", undefined, error);
  }
};
