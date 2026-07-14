import type { WhoopMetricsResponse } from "../adapters/schemas/whoop-metrics.schema";

/**
 * Scrubbed WHOOP `metrics-service/v1/metrics/user/{userId}?name=heart_rate`
 * response at a 6-second step. Four samples spaced 6s apart, with a
 * deliberate gap at the third slot (12s after the first sample is skipped)
 * so converter tests can assert the bucketer fills it with `null`.
 */

export const HEART_RATE_METRICS_FIRST_SAMPLE_TIME = 1_783_663_200_000; // 2026-07-10T06:00:00.000Z

export const HEART_RATE_METRICS_FIXTURE: WhoopMetricsResponse = {
  values: [
    { data: 58, time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME },
    { data: 60, time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME + 6_000 },
    // 12_000 slot deliberately skipped — the converter must fill it with null.
    { data: 61, time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME + 18_000 },
    { data: 59, time: HEART_RATE_METRICS_FIRST_SAMPLE_TIME + 24_000 },
  ],
};
