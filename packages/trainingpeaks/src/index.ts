/**
 * @kaiord/trainingpeaks — TrainingPeaks health adapter for Kaiord.
 *
 * A PURE, offline adapter over the TrainingPeaks internal metrics API
 * (`tpapi.trainingpeaks.com`) `consolidatedtimedmetric(s)` payloads. It
 * performs no network I/O and contains no browser-extension code; it only
 * maps between KRD health documents and TrainingPeaks metric payloads.
 *
 * - Read side: `trainingPeaksMetricsToKrd` turns a
 *   `GET …/consolidatedtimedmetrics/{start}/{end}` response into KRD
 *   `weight_measurement` documents (weight `type 9`; other channels deferred).
 * - Write side: `krdWeightToTrainingPeaksMetric` turns a KRD weight into a
 *   `POST …/consolidatedtimedmetric` payload (weight `type 9`, value in kg).
 *
 * The live cookie→token→Bearer transport lives in `@kaiord/trainingpeaks-bridge`;
 * this package is transport-agnostic.
 */

// Read converter (TrainingPeaks consolidatedtimedmetrics → KRD health docs)
export { trainingPeaksMetricsToKrd } from "./adapters/converters/trainingpeaks-metrics-to-krd.converter";

// Write converter (KRD weight → TrainingPeaks consolidatedtimedmetric payload)
export {
  krdWeightToTrainingPeaksMetric,
  TRAININGPEAKS_WEIGHT_UNITS,
} from "./adapters/converters/krd-to-trainingpeaks-metric.converter";

// Write converter (KRD structured workout → TrainingPeaks workout payload)
export {
  krdToTrainingPeaksStructure,
  krdToTrainingPeaksWorkout,
  type KrdToTrainingPeaksWorkoutOptions,
} from "./adapters/converters/krd-to-trainingpeaks-workout.converter";
export type { TrainingPeaksThresholds } from "./adapters/converters/trainingpeaks-workout-targets";
export {
  type TrainingPeaksBlock,
  type TrainingPeaksIntensityMetric,
  type TrainingPeaksStep,
  type TrainingPeaksStructure,
  trainingPeaksStructureSchema,
  type TrainingPeaksWorkout,
  trainingPeaksWorkoutSchema,
} from "./adapters/schemas/trainingpeaks-workout.schema";

// Schemas, metric-type ids & inferred types
export {
  TRAININGPEAKS_DEFERRED_METRIC_TYPES,
  TRAININGPEAKS_METRIC_TYPE,
  TRAININGPEAKS_WEIGHT_METRIC_TYPE,
  type TrainingPeaksConsolidatedMetric,
  trainingPeaksConsolidatedMetricSchema,
  type TrainingPeaksMetricDetail,
  trainingPeaksMetricDetailSchema,
  type TrainingPeaksMetricsResponse,
  trainingPeaksMetricsResponseSchema,
} from "./adapters/schemas/trainingpeaks-metric.schema";
