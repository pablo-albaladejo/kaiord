/**
 * @kaiord/garmin-connect - Garmin Connect API client for Kaiord
 */

// Port type re-exports
export type {
  AuthProvider,
  ListOptions,
  PushResult,
  TokenData,
  TokenStore,
  WorkoutService,
  WorkoutSummary,
} from "@kaiord/core";

// Auth
export { createGarminAuthProvider } from "./adapters/auth/garmin-auth-provider";

// Workout service
export {
  createGarminConnectClient,
  createGarminWorkoutService,
} from "./adapters/client/garmin-workout-service";

// Token stores
export { createFileTokenStore } from "./adapters/token-store/file-token-store";
export { createMemoryTokenStore } from "./adapters/token-store/memory-token-store";
