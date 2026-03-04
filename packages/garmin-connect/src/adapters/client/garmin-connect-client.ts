import { createGarminWorkoutService } from "./garmin-workout-service";
import { createGarminAuthProvider } from "../auth/garmin-auth-provider";
import type { GarminAuthProviderOptions } from "../auth/garmin-auth-provider";

export type GarminConnectClientOptions = GarminAuthProviderOptions;

export const createGarminConnectClient = (
  options?: GarminConnectClientOptions
) => {
  const { auth, httpClient } = createGarminAuthProvider(options);
  const service = createGarminWorkoutService(httpClient, options?.logger);
  return { auth, service };
};
