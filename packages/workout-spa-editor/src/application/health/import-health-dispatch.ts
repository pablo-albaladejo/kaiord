/**
 * Extraction table for `importHealthFitFile` — one entry per health
 * metric, producing the natural-key inputs `upsertImportedRecord`
 * needs (dataType/date/measuredAt/payload). Lives in its own file so
 * the use-case stays small.
 */
import type {
  BodyComposition,
  DailyWellness,
  HealthFileType,
  HrvSummary,
  ManagedDataType,
  SleepRecord,
  StressEpisode,
  WeightMeasurement,
} from "@kaiord/core";

export type HealthExtensions = {
  sleep?: SleepRecord;
  weight?: WeightMeasurement;
  hrv?: HrvSummary;
  daily?: DailyWellness;
  bodyComposition?: BodyComposition;
  stress?: StressEpisode;
};

export type ExtractedHealthMetric = {
  dataType: ManagedDataType;
  payload: Record<string, unknown>;
  date: string;
  measuredAt: string;
};

const datePart = (iso: string): string => iso.slice(0, 10);

type Extractor = (
  health: HealthExtensions
) => ExtractedHealthMetric | undefined;

const EXTRACTORS: Record<HealthFileType, Extractor> = {
  sleep_record: (h) =>
    h.sleep && {
      dataType: "sleep",
      payload: h.sleep,
      date: datePart(h.sleep.startTime),
      measuredAt: h.sleep.startTime,
    },
  weight_measurement: (h) =>
    h.weight && {
      dataType: "weight",
      payload: h.weight,
      date: datePart(h.weight.measuredAt),
      measuredAt: h.weight.measuredAt,
    },
  hrv_summary: (h) =>
    h.hrv && {
      dataType: "hrv",
      payload: h.hrv,
      date: datePart(h.hrv.measuredAt),
      measuredAt: h.hrv.measuredAt,
    },
  daily_wellness: (h) =>
    h.daily && {
      dataType: "daily-wellness",
      payload: h.daily,
      date: h.daily.date,
      measuredAt: `${h.daily.date}T00:00:00.000Z`,
    },
  body_composition: (h) =>
    h.bodyComposition && {
      dataType: "body-composition",
      payload: h.bodyComposition,
      date: datePart(h.bodyComposition.measuredAt),
      measuredAt: h.bodyComposition.measuredAt,
    },
  stress_episode: (h) =>
    h.stress && {
      dataType: "stress",
      payload: h.stress,
      date: datePart(h.stress.startTime),
      measuredAt: h.stress.startTime,
    },
};

export const extractHealthMetric = (
  type: HealthFileType,
  health: HealthExtensions
): ExtractedHealthMetric | undefined => EXTRACTORS[type](health);
