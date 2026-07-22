import type { KRD } from "@kaiord/core";

import {
  type TrainingPeaksConsolidatedMetric,
  trainingPeaksConsolidatedMetricSchema,
  TRAININGPEAKS_WEIGHT_METRIC_TYPE,
} from "../schemas/trainingpeaks-metric.schema";

/**
 * Unit for the TrainingPeaks weight metric (`details[].units`).
 *
 * Weight-unit assumption: TrainingPeaks stores the `consolidatedtimedmetric`
 * weight value in **kilograms** — its canonical storage unit — and converts to
 * pounds only for display based on the athlete's account setting. The research
 * (`docs/connectors-research/trainingpeaks.md`) documents `type 9 = weight`
 * but not the stored unit; kilograms is the safe canonical choice and lets the
 * KRD `weightKilograms` value pass through unconverted. If a real capture ever
 * shows the API expects/returns pounds, flip this constant and add a
 * lb↔kg conversion in both converters — nothing else changes.
 */
export const TRAININGPEAKS_WEIGHT_UNITS = "kg";

/** Human-readable label sent alongside the weight metric. */
const TRAININGPEAKS_WEIGHT_LABEL = "Weight";

/**
 * Maps a KRD weight measurement to a TrainingPeaks
 * `consolidatedtimedmetric` write payload (`POST …/consolidatedtimedmetric`).
 *
 * Reads `extensions.health.weight` and emits one metric object carrying a
 * single `type 9` (weight) detail whose `value` is the KRD `weightKilograms`
 * (see {@link TRAININGPEAKS_WEIGHT_UNITS} for the unit assumption). `id` is
 * `null` (server assigns it) and the metric `timeStamp` mirrors the KRD
 * `measuredAt`. Returns `undefined` when the KRD carries no weight. Pure and
 * offline — no network, no extension APIs. The result is schema-parsed so
 * callers always receive a validated payload.
 *
 * @param krd - a KRD health document (`weight_measurement`/`body_composition`)
 * @param athleteId - the TrainingPeaks athlete id (`user.personId`)
 */
export const krdWeightToTrainingPeaksMetric = (
  krd: KRD,
  athleteId: number
): TrainingPeaksConsolidatedMetric | undefined => {
  const weight = krd.extensions?.health?.weight;
  if (!weight) return undefined;
  return trainingPeaksConsolidatedMetricSchema.parse({
    athleteId,
    timeStamp: weight.measuredAt,
    id: null,
    details: [
      {
        type: TRAININGPEAKS_WEIGHT_METRIC_TYPE,
        label: TRAININGPEAKS_WEIGHT_LABEL,
        value: weight.weightKilograms,
        time: weight.measuredAt,
        units: TRAININGPEAKS_WEIGHT_UNITS,
        formatedUnits: TRAININGPEAKS_WEIGHT_UNITS,
      },
    ],
  });
};
