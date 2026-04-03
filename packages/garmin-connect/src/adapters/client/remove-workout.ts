import { createServiceApiError } from "@kaiord/core";
import { WORKOUT_URL } from "../http/urls";
import type { GarminHttpClient } from "../http/types";
import type { Logger } from "@kaiord/core";

export const removeWorkout = async (
  workoutId: string,
  httpClient: GarminHttpClient,
  log: Logger
): Promise<void> => {
  try {
    log.info(`Removing workout ${workoutId} from Garmin Connect`);
    await httpClient.del(`${WORKOUT_URL}/workout/${workoutId}`);
  } catch (error) {
    throw createServiceApiError("Failed to remove workout", undefined, error);
  }
};
