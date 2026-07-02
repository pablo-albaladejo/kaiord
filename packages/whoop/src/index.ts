/**
 * @kaiord/whoop — WHOOP API (v2) health adapter for Kaiord.
 *
 * A PURE adapter: it maps WHOOP recovery/sleep JSON to the frozen KRD health
 * sub-schemas (`hrv_summary`, `sleep_record`) and never performs OAuth. The
 * HTTP/auth transport is injected via `WhoopHttpClient`; the OAuth mechanics
 * (token exchange, refresh-token rotation, rate-limit back-off) live in the
 * `@kaiord/whoop-bridge` Chrome extension at the composition edge.
 */

// Injected transport port
export type { WhoopHttpClient } from "./adapters/http/types";
export {
  buildCollectionPath,
  RECOVERY_PATH,
  SLEEP_PATH,
  WHOOP_MAX_LIMIT,
  type WhoopQuery,
} from "./adapters/http/urls";

// Pure converters (WHOOP JSON → KRD health)
export { mapWhoopRecoveryToKrd } from "./adapters/converters/recovery-to-krd.converter";
export {
  mapWhoopSleepToKrd,
  type WhoopSleepMapOptions,
} from "./adapters/converters/sleep-to-krd.converter";
export { buildSleepStages } from "./adapters/converters/sleep-stages.builder";

// Response schemas & types
export {
  type WhoopRecoveryRecord,
  whoopRecoveryRecordSchema,
} from "./adapters/schemas/whoop-recovery.schema";
export {
  type WhoopSleepRecord,
  whoopSleepRecordSchema,
} from "./adapters/schemas/whoop-sleep.schema";
export { whoopPaginatedSchema } from "./adapters/schemas/whoop-paginated.schema";

// Composition-edge service (uses the injected transport)
export {
  createWhoopHealthService,
  type WhoopHealthImport,
  type WhoopHealthService,
} from "./adapters/client/whoop-health-service";
