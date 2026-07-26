/**
 * @kaiord/whoop — a PURE adapter over the WHOOP internal API (never OAuth,
 * never the developer API; the SPA injects the read transport). It provides
 * Zod schemas for the internal responses (`core-details-bff` cycles/details,
 * `metrics-service`, `activities-service` sports catalog, `stress-bff`,
 * `advanced-labs-service` biomarkers) and pure converters mapping them to KRD
 * targets: recovery→hrv, sleep→sleep, cycle→strain, cycle→vitals,
 * metrics→heart-rate-series, workout→activity, stress-bff→stress-episode, plus
 * the measured-biomarker filter for Advanced Labs.
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
export {
  whoopWorkoutSchema,
  type WhoopWorkout,
} from "./adapters/schemas/whoop-workout.schema";
export {
  whoopSportSchema,
  whoopSportsResponseSchema,
  buildSportCatalog,
  type WhoopSport,
  type WhoopSportsResponse,
} from "./adapters/schemas/whoop-sports.schema";
export {
  whoopStressResponseSchema,
  extractStressPoints,
  type WhoopStressResponse,
} from "./adapters/schemas/whoop-stress.schema";
export {
  whoopBiomarkerTestSchema,
  whoopBiomarkerTestsResponseSchema,
  whoopBiomarkerSchema,
  whoopBiomarkerSummarySchema,
  measuredBiomarkers,
  type WhoopBiomarkerTest,
  type WhoopBiomarkerTestsResponse,
  type WhoopBiomarker,
  type WhoopBiomarkerSummary,
} from "./adapters/schemas/whoop-biomarkers.schema";

// Pure converters (WHOOP cycle/metrics → KRD health extensions)
export { recoveryToHrv } from "./adapters/converters/recovery-to-hrv.converter";
export { sleepsToSleep } from "./adapters/converters/sleeps-to-sleep.converter";
export { cycleToStrain } from "./adapters/converters/cycle-to-strain.converter";
export { cycleToVitals } from "./adapters/converters/cycle-to-vitals.converter";
export { metricsToHeartRateSeries } from "./adapters/converters/metrics-to-heart-rate-series.converter";
export { workoutToActivity } from "./adapters/converters/workout-to-activity.converter";
export { stressBffToEpisode } from "./adapters/converters/stress-bff-to-episode.converter";
