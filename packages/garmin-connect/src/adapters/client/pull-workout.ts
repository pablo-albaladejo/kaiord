import type { KRD, Logger } from "@kaiord/core";
import { createServiceApiError, fromText } from "@kaiord/core";
import type { createGarminReader } from "@kaiord/garmin";

import type { GarminHttpClient } from "../http/types";
import { WORKOUT_URL } from "../http/urls";

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
