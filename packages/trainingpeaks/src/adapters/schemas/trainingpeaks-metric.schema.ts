import { z } from "zod";

/**
 * Schemas for the TrainingPeaks internal metrics API
 * (`tpapi.trainingpeaks.com`) `consolidatedtimedmetric(s)` payloads.
 *
 * A "consolidated timed metric" is one timestamped health reading whose
 * individual channels (weight, pulse, HRV, sleep, …) each arrive as a
 * `details[]` entry keyed by a numeric `type` id. The read endpoint
 * (`GET …/consolidatedtimedmetrics/{start}/{end}`) returns an ARRAY of these
 * objects; the write endpoint (`POST …/consolidatedtimedmetric`) accepts one.
 *
 * The exact GET response shape is not published; it is modelled here from the
 * documented POST body shape plus the documented `type` ids (see
 * `docs/connectors-research/trainingpeaks.md`). Unknown fields are dropped by
 * Zod's default strip behaviour so forward-compatible additions do not break
 * parsing. Fixtures used in tests are SYNTHETIC — no real user data.
 */

/**
 * TrainingPeaks `details[].type` ids for consolidated timed metrics
 * (research-documented). Only `weight` is currently mapped to KRD; the rest
 * are listed for reference and are intentionally deferred (see
 * {@link TRAININGPEAKS_DEFERRED_METRIC_TYPES}).
 */
export const TRAININGPEAKS_METRIC_TYPE = {
  weight: 9,
  pulse: 5,
  hrv: 60,
  sleep: 6,
  spo2: 53,
  steps: 58,
  restingMetabolicRate: 15,
  injury: 23,
} as const;

/** The `details[].type` id for a weight reading. */
export const TRAININGPEAKS_WEIGHT_METRIC_TYPE =
  TRAININGPEAKS_METRIC_TYPE.weight;

/**
 * Metric `type` ids TrainingPeaks documents but that have no KRD home yet and
 * are therefore skipped on read. To add one later, map it in the read
 * converter (and add the KRD payload if missing). Mirrors the deferred-column
 * pattern in `@kaiord/tanita`.
 */
export const TRAININGPEAKS_DEFERRED_METRIC_TYPES = [
  TRAININGPEAKS_METRIC_TYPE.pulse,
  TRAININGPEAKS_METRIC_TYPE.hrv,
  TRAININGPEAKS_METRIC_TYPE.sleep,
  TRAININGPEAKS_METRIC_TYPE.spo2,
  TRAININGPEAKS_METRIC_TYPE.steps,
  TRAININGPEAKS_METRIC_TYPE.restingMetabolicRate,
  TRAININGPEAKS_METRIC_TYPE.injury,
] as const;

/** One channel within a consolidated timed metric (e.g. the weight reading). */
export const trainingPeaksMetricDetailSchema = z.object({
  type: z.number().int(),
  value: z.number().nullable().optional(),
  label: z.string().optional(),
  units: z.string().optional(),
  formatedUnits: z.string().optional(),
  time: z.string().optional(),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  temporaryId: z.union([z.string(), z.number(), z.null()]).optional(),
});

export type TrainingPeaksMetricDetail = z.infer<
  typeof trainingPeaksMetricDetailSchema
>;

/** One timestamped consolidated metric carrying one or more channels. */
export const trainingPeaksConsolidatedMetricSchema = z.object({
  athleteId: z.number().optional(),
  timeStamp: z.string(),
  id: z.number().nullable().optional(),
  details: z.array(trainingPeaksMetricDetailSchema).default([]),
});

export type TrainingPeaksConsolidatedMetric = z.infer<
  typeof trainingPeaksConsolidatedMetricSchema
>;

/** The `GET …/consolidatedtimedmetrics/{start}/{end}` response: an array. */
export const trainingPeaksMetricsResponseSchema = z.array(
  trainingPeaksConsolidatedMetricSchema
);

export type TrainingPeaksMetricsResponse = z.infer<
  typeof trainingPeaksMetricsResponseSchema
>;
