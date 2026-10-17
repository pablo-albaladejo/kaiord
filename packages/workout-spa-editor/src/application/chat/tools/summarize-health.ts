/**
 * Pure health-record projection for the chat read tool.
 *
 * The KRD payload is never forwarded: each metric names the numeric fields
 * the model may read, and only finite numbers survive. Upstream free text
 * (`externalId`, `sourceBridgeId`, …) therefore cannot reach the prompt,
 * whatever a writer stored. Sleep stages are reduced to seconds per stage;
 * sleep and stress start/end become local `HH:MM` clock times.
 */
import { clockWindowOf } from "./health-clock";
import {
  HRV_WINDOWS,
  NUMERIC_FIELDS,
  SLEEP_STAGES,
} from "./health-projection-fields";
import type { HealthMetric, HealthRow } from "./profile-readers";

export type HealthDay = { date: string } & Record<string, number | string>;
export type HealthSummary = { count: number; records: HealthDay[] };

type Krd = Record<string, unknown>;

const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const asKrd = (v: unknown): Krd =>
  typeof v === "object" && v !== null ? (v as Krd) : {};

const pickNumbers = (krd: Krd, keys: readonly string[]) =>
  Object.fromEntries(
    keys.flatMap((k) => (isNumber(krd[k]) ? [[k, krd[k]]] : []))
  ) as Record<string, number>;

const sleepStageSeconds = (krd: Krd): Record<string, number> => {
  const stages = Array.isArray(krd.stages) ? krd.stages.map(asKrd) : [];
  const out: Record<string, number> = {};
  for (const stage of SLEEP_STAGES) {
    const seconds = stages
      .filter((s) => s.stage === stage && isNumber(s.durationSeconds))
      .reduce((sum, s) => sum + (s.durationSeconds as number), 0);
    if (seconds > 0) out[`${stage}Seconds`] = seconds;
  }
  return out;
};

const extrasOf = (metric: HealthMetric, krd: Krd) => {
  if (metric === "sleep")
    return { ...clockWindowOf(krd), ...sleepStageSeconds(krd) };
  if (metric === "stress") return clockWindowOf(krd);
  if (metric === "hrv" && HRV_WINDOWS.includes(String(krd.measurementWindow)))
    return { measurementWindow: String(krd.measurementWindow) };
  if (metric === "daily-wellness") {
    const minutes = asKrd(krd.intensityMinutes);
    return pickNumbers(
      {
        moderateIntensityMinutes: minutes.moderate,
        vigorousIntensityMinutes: minutes.vigorous,
      },
      ["moderateIntensityMinutes", "vigorousIntensityMinutes"]
    );
  }
  return {};
};

export const projectHealthDay = (
  metric: HealthMetric,
  row: HealthRow
): HealthDay => {
  const krd = asKrd(row.krd);
  return {
    date: row.date,
    ...pickNumbers(krd, NUMERIC_FIELDS[metric]),
    ...extrasOf(metric, krd),
  };
};

export const summarizeHealth = (
  metric: HealthMetric,
  records: ReadonlyArray<HealthRow>
): HealthSummary => {
  const byDateAsc = [...records].sort((a, b) => a.date.localeCompare(b.date));
  return {
    count: records.length,
    records: byDateAsc.map((r) => projectHealthDay(metric, r)),
  };
};
