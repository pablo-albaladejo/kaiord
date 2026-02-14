/**
 * @kaiord/garmin-connect - Garmin Connect API client for Kaiord
 */

// Types
export type { GarminWorkoutClient } from "./adapters/client/garmin-workout-service";
export type {
  ListOptions,
  PushResult,
  TokenData,
  TokenStore,
  WorkoutSummary,
} from "@kaiord/core";

// Auth
export { createGarminAuthProvider } from "./adapters/auth/garmin-auth-provider";

// Client (high-level)
export { createGarminConnectClient } from "./adapters/client/garmin-connect-client";

// Cookie fetch
export { createCookieFetch } from "./adapters/http/cookie-fetch";

// Token stores
export { createFileTokenStore } from "./adapters/token-store/file-token-store";
export { createMemoryTokenStore } from "./adapters/token-store/memory-token-store";
