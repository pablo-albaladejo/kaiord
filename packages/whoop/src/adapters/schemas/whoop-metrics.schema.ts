import { z } from "zod";

/**
 * Schemas for the WHOOP internal `metrics-service/v1/metrics/user/{userId}`
 * response (e.g. `?name=heart_rate&start&end&step`). Each sample carries a
 * numeric reading (`data`, e.g. bpm — may be a float) and an epoch
 * **milliseconds** timestamp (`time`). Modelled non-strict: unknown fields
 * are tolerated, and `values` may be absent or empty when WHOOP has no data
 * for the requested window.
 */

export const whoopMetricSampleSchema = z.object({
  data: z.number(),
  time: z.number(),
});

export const whoopMetricsResponseSchema = z.object({
  values: z.array(whoopMetricSampleSchema).optional(),
});

export type WhoopMetricSample = z.infer<typeof whoopMetricSampleSchema>;
export type WhoopMetricsResponse = z.infer<typeof whoopMetricsResponseSchema>;
