import type { GarminWorkoutClient } from "./garmin-workout-service";
import type { RetryOptions } from "../http/retry";
import type { FetchFn } from "../http/types";
import type { AuthProvider, Logger, TokenStore } from "@kaiord/core";

export type InitResult = { restored: boolean };

export type GarminConnectClient = {
  auth: AuthProvider;
  service: GarminWorkoutClient;
  init: () => Promise<InitResult>;
};

export type GarminConnectClientOptions = {
  logger?: Logger;
  tokenStore?: TokenStore;
  fetchFn?: FetchFn;
  retry?: RetryOptions;
};
