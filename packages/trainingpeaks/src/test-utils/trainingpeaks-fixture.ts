/**
 * SYNTHETIC TrainingPeaks `consolidatedtimedmetrics` fixtures for tests.
 *
 * Every value below is MADE UP — no real user data is committed. The array
 * mirrors the modelled `GET …/consolidatedtimedmetrics/{start}/{end}` shape
 * (an array of timestamped metrics, each with a `details[]` list keyed by the
 * documented numeric `type` ids). Entries are hand-picked to exercise the
 * read converter's edges:
 *
 *  - Entry 1: a weight reading (type 9) alongside a deferred pulse channel
 *    (type 5) → yields one weight KRD; the pulse channel is dropped.
 *  - Entry 2: a weight reading with a zoned UTC timestamp.
 *  - Entry 3: only a deferred channel (no weight) → yields nothing.
 *  - Entry 4: a weight channel whose value is null (unmeasured) → skipped.
 */

import {
  TRAININGPEAKS_METRIC_TYPE,
  type TrainingPeaksMetricsResponse,
} from "../adapters/schemas/trainingpeaks-metric.schema";

/** The synthetic athlete id used across fixtures (`user.personId`). */
export const TRAININGPEAKS_FIXTURE_ATHLETE_ID = 900123;

export const TRAININGPEAKS_METRICS_FIXTURE: TrainingPeaksMetricsResponse = [
  {
    athleteId: TRAININGPEAKS_FIXTURE_ATHLETE_ID,
    timeStamp: "2026-07-01T07:30:00",
    id: 111,
    details: [
      {
        type: TRAININGPEAKS_METRIC_TYPE.weight,
        label: "Weight",
        value: 80.5,
        units: "kg",
        formatedUnits: "kg",
        time: "2026-07-01T07:30:00",
      },
      {
        type: TRAININGPEAKS_METRIC_TYPE.pulse,
        label: "Resting Pulse",
        value: 52,
        units: "bpm",
      },
    ],
  },
  {
    athleteId: TRAININGPEAKS_FIXTURE_ATHLETE_ID,
    timeStamp: "2026-07-02T07:45:00Z",
    id: 112,
    details: [
      {
        type: TRAININGPEAKS_METRIC_TYPE.weight,
        label: "Weight",
        value: 80.1,
        units: "kg",
        formatedUnits: "kg",
        time: "2026-07-02T07:45:00Z",
      },
    ],
  },
  {
    athleteId: TRAININGPEAKS_FIXTURE_ATHLETE_ID,
    timeStamp: "2026-07-03T07:15:00",
    id: 113,
    details: [
      {
        type: TRAININGPEAKS_METRIC_TYPE.steps,
        label: "Steps",
        value: 9000,
        units: "steps",
      },
    ],
  },
  {
    athleteId: TRAININGPEAKS_FIXTURE_ATHLETE_ID,
    timeStamp: "2026-07-04T07:10:00",
    id: 114,
    details: [
      {
        type: TRAININGPEAKS_METRIC_TYPE.weight,
        label: "Weight",
        value: null,
        units: "kg",
        formatedUnits: "kg",
      },
    ],
  },
];
