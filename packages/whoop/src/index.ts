/**
 * @kaiord/whoop — WHOOP internal-API health adapter for Kaiord.
 *
 * A PURE adapter over the WHOOP internal `core-details-bff` cycles/details
 * and `metrics-service` responses. It never performs OAuth and never targets
 * the developer API; the SPA injects the read transport. Wave 1 exposes the
 * cycles schema and the recovery→hrv and sleep→sleep converters; Wave 2 adds
 * the read-only cycle→strain and cycle→vitals converters; Wave 3a adds the
 * metrics-service schema and the metrics→heart-rate-series converter.
 */

// Internal-API response schema & inferred types
export {
  whoopCycleSchema,
  whoopCycleRecoverySchema,
  whoopCycleSleepSchema,
  whoopCycleRecordSchema,
  whoopCyclesResponseSchema,
  type WhoopCycle,
  type WhoopCycleRecovery,
  type WhoopCycleSleep,
  type WhoopCycleRecord,
  type WhoopCyclesResponse,
} from "./adapters/schemas/whoop-cycles.schema";
export {
  whoopMetricSampleSchema,
  whoopMetricsResponseSchema,
  type WhoopMetricSample,
  type WhoopMetricsResponse,
} from "./adapters/schemas/whoop-metrics.schema";

// Pure converters (WHOOP cycle/metrics → KRD health extensions)
export { recoveryToHrv } from "./adapters/converters/recovery-to-hrv.converter";
export { sleepsToSleep } from "./adapters/converters/sleeps-to-sleep.converter";
export { cycleToStrain } from "./adapters/converters/cycle-to-strain.converter";
export { cycleToVitals } from "./adapters/converters/cycle-to-vitals.converter";
export { metricsToHeartRateSeries } from "./adapters/converters/metrics-to-heart-rate-series.converter";
