import type { GarminAuthProviderOptions } from "../auth/garmin-auth-provider";
import { createGarminAuthProvider } from "../auth/garmin-auth-provider";
import { createGarminWorkoutService } from "./garmin-workout-service";

export type GarminConnectClientOptions = GarminAuthProviderOptions;

export const createGarminConnectClient = (
  options?: GarminConnectClientOptions
) => {
  const { auth, httpClient } = createGarminAuthProvider(options);
  const service = createGarminWorkoutService(httpClient, options?.logger);
  return { auth, service };
};
