import type { KRD, WeightMeasurement } from "@kaiord/core";
import { krdSchema } from "@kaiord/core";

import {
  type TrainingPeaksMetricDetail,
  trainingPeaksMetricsResponseSchema,
  TRAININGPEAKS_WEIGHT_METRIC_TYPE,
} from "../schemas/trainingpeaks-metric.schema";

const KRD_VERSION = "2.0" as const;
const HEALTH_VERSION = "2.0";
const MANUFACTURER = "trainingpeaks";
const WEIGHT_MEASUREMENT_TYPE = "weight_measurement" as const;

/** `YYYY-MM-DDTHH:MM:SS` with no timezone — a naive TrainingPeaks instant. */
const NAIVE_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

/**
 * Anchors a TrainingPeaks `timeStamp` to a UTC ISO instant. Values that
 * already carry a zone (`Z` or `±HH:MM`) pass through untouched; a naive
 * `YYYY-MM-DDTHH:MM:SS` is stamped `Z` verbatim (same UTC-anchoring decision
 * as `@kaiord/tanita`, since the source provides no offset). Any other shape
 * is returned unchanged and rejected downstream by `krdSchema`.
 */
const toIsoUtc = (timeStamp: string): string => {
  const trimmed = timeStamp.trim();
  if (/(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) return trimmed;
  if (NAIVE_DATETIME_RE.test(trimmed)) return `${trimmed}Z`;
  return trimmed;
};

/** Finds the first positive-valued weight detail (`type 9`) in a metric. */
const findWeightDetail = (
  details: TrainingPeaksMetricDetail[]
): TrainingPeaksMetricDetail | undefined =>
  details.find(
    (detail) =>
      detail.type === TRAININGPEAKS_WEIGHT_METRIC_TYPE &&
      typeof detail.value === "number" &&
      detail.value > 0
  );

/**
 * Converts a TrainingPeaks `consolidatedtimedmetrics` response into one KRD
 * `weight_measurement` document per entry that carries a weight reading.
 *
 * Only the weight channel (`type 9`) is mapped today; pulse / HRV / sleep /
 * spo2 / steps / RMR / injury are intentionally deferred (see
 * `TRAININGPEAKS_DEFERRED_METRIC_TYPES`). Entries without a positive weight
 * value, and any whose timestamp does not resolve to a valid KRD instant, are
 * skipped. Each emitted KRD is `krdSchema`-validated. Pure and offline.
 *
 * The weight value is read as kilograms (see `TRAININGPEAKS_WEIGHT_UNITS`).
 */
export const trainingPeaksMetricsToKrd = (response: unknown): KRD[] => {
  const parsed = trainingPeaksMetricsResponseSchema.safeParse(response);
  if (!parsed.success) return [];
  const documents: KRD[] = [];
  for (const metric of parsed.data) {
    const weightDetail = findWeightDetail(metric.details);
    if (!weightDetail || typeof weightDetail.value !== "number") continue;
    const measuredAt = toIsoUtc(metric.timeStamp);
    const weight: WeightMeasurement = {
      kind: "weight",
      version: HEALTH_VERSION,
      measuredAt,
      weightKilograms: weightDetail.value,
    };
    const result = krdSchema.safeParse({
      version: KRD_VERSION,
      type: WEIGHT_MEASUREMENT_TYPE,
      metadata: { created: measuredAt, manufacturer: MANUFACTURER },
      extensions: { health: { weight } },
    });
    if (result.success) documents.push(result.data);
  }
  return documents;
};
