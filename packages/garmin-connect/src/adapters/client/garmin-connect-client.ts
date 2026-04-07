import { createConsoleLogger } from "@kaiord/core";

import { createGarminAuthProvider } from "../auth/garmin-auth-provider";
import { createCookieFetch } from "../http/cookie-fetch";
import { createGarminHttpClient } from "../http/garmin-http-client";
import { withRetry } from "../http/retry";
import { createTokenManager } from "../token/token-manager";
import { buildRefreshFn } from "./build-refresh-fn";
import type {
  GarminConnectClient,
  GarminConnectClientOptions,
} from "./garmin-connect-client.types";
import { createGarminWorkoutService } from "./garmin-workout-service";

export type {
  GarminConnectClient,
  GarminConnectClientOptions,
  InitResult,
} from "./garmin-connect-client.types";

/**
 * Create a Garmin Connect client with auth, workout service, and optional token auto-restore.
 *
 * @example
 * ```ts
 * const client = createGarminConnectClient({
 *   tokenStore: createFileTokenStore(),
 *   retry: { maxRetries: 3 },
 * });
 * const { restored } = await client.init();
 * if (!restored) await client.auth.login(email, password);
 * ```
 */
export const createGarminConnectClient = (
  options?: GarminConnectClientOptions
): GarminConnectClient => {
  const logger = options?.logger ?? createConsoleLogger();
  const rawFetchFn = options?.fetchFn ?? createCookieFetch();
  const retryFetchFn = options?.retry
    ? withRetry(rawFetchFn, { ...options.retry, logger })
    : rawFetchFn;

  const refreshFn = buildRefreshFn(rawFetchFn, logger);
  const tokenManager = createTokenManager({
    refreshFn,
    logger,
    tokenStore: options?.tokenStore,
  });

  const auth = createGarminAuthProvider({
    tokenManager,
    logger,
    fetchFn: rawFetchFn,
  });
  const httpClient = createGarminHttpClient(tokenManager, retryFetchFn, logger);
  const service = createGarminWorkoutService(httpClient, logger);

  return {
    auth,
    service,
    init: () => tokenManager.init(),
  };
};
